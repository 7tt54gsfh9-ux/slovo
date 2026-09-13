/** Web Speech API (SpeechRecognition) helpers + fuzzy Slovak matching. */

export type RecognitionErrorKind =
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'audio-capture'
  | 'service-not-allowed'
  | 'language-not-supported'
  | 'unsupported'
  | 'unknown'

export type RecognitionOutcome =
  | { ok: true; transcript: string }
  | { ok: false; error: RecognitionErrorKind; message: string }

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly 0: { transcript: string }
}

interface SpeechRecognitionEventLike {
  readonly results: ArrayLike<SpeechRecognitionResultLike> & { length: number }
}

interface SpeechRecognitionErrorEventLike {
  readonly error: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

const ERROR_MESSAGES: Record<RecognitionErrorKind, string> = {
  'not-allowed': 'Microphone permission denied. Allow mic access, or skip this exercise.',
  'no-speech': 'Didn’t catch that — tap the mic and try again.',
  network: 'Speech service needs a network connection. Try again or skip.',
  aborted: 'Listening stopped.',
  'audio-capture': 'Couldn’t access the microphone. Check device settings or skip.',
  'service-not-allowed': 'Speech recognition isn’t available here. You can skip this one.',
  'language-not-supported': 'Slovak speech recognition isn’t available on this device. You can skip.',
  unsupported: 'Speech recognition isn’t supported in this browser. You can skip this exercise.',
  unknown: 'Something went wrong with the mic. Try again or skip.',
}

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

export function friendlyRecognitionMessage(kind: RecognitionErrorKind): string {
  return ERROR_MESSAGES[kind] ?? ERROR_MESSAGES.unknown
}

function mapError(code: string): RecognitionErrorKind {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
    case 'no-speech':
    case 'network':
    case 'aborted':
    case 'audio-capture':
    case 'language-not-supported':
      return code
    default:
      return 'unknown'
  }
}

/** Lowercase, strip diacritics + punctuation, collapse whitespace. */
export function normalizeSpeechText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const row = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) row[j] = j
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return row[b.length]
}

function maxEditDistance(len: number): number {
  if (len <= 3) return 1
  if (len <= 6) return 2
  if (len <= 10) return 3
  return Math.max(3, Math.floor(len * 0.3))
}

function tokensMatch(heard: string, target: string): boolean {
  const hParts = heard.split(' ').filter(Boolean)
  const tParts = target.split(' ').filter(Boolean)
  if (!tParts.length) return false
  return tParts.every((t) =>
    hParts.some(
      (h) =>
        h === t ||
        h.includes(t) ||
        t.includes(h) ||
        levenshtein(h, t) <= maxEditDistance(t.length),
    ),
  )
}

/**
 * Fuzzy match spoken transcript against target (and optional accepted variants).
 * Diacritic-insensitive; allows close edits and extra filler words.
 */
export function fuzzyMatchSpeech(
  transcript: string,
  target: string,
  accepted?: string[],
): boolean {
  const heard = normalizeSpeechText(transcript)
  if (!heard) return false
  const candidates = [target, ...(accepted ?? [])]
    .map(normalizeSpeechText)
    .filter(Boolean)

  for (const c of candidates) {
    if (heard === c) return true
    if (heard.includes(c)) return true
    if (c.includes(heard) && heard.length >= Math.min(3, c.length)) return true
    if (levenshtein(heard, c) <= maxEditDistance(c.length)) return true
    if (tokensMatch(heard, c)) return true
  }
  return false
}

export interface ListenOptions {
  lang?: string
  timeoutMs?: number
  onInterim?: (transcript: string) => void
}

const WATCHDOG_GRACE_MS = 1000

function isAppleWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1)
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|Chromium|Android|CriOS|FxiOS|EdgiOS/i.test(ua)
  return isIOS || isSafari
}

async function warmupMic(): Promise<RecognitionOutcome | null> {
  if (typeof navigator === 'undefined') return null
  const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices)
  if (!getUserMedia) return null
  try {
    const stream = await getUserMedia({ audio: true })
    for (const track of stream.getTracks()) {
      try {
        track.stop()
      } catch {
        /* ignore */
      }
    }
    return null
  } catch (err) {
    const name =
      err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : ''
    if (
      name === 'NotAllowedError' ||
      name === 'PermissionDeniedError' ||
      name === 'SecurityError'
    ) {
      return {
        ok: false,
        error: 'not-allowed',
        message: ERROR_MESSAGES['not-allowed'],
      }
    }
    return null
  }
}

/**
 * Start recognition from a user gesture. Resolves once with a final transcript
 * or a friendly error. Always settles (even if iOS never fires onend) and
 * always stops/aborts the recognizer.
 */
export function listenOnce(options: ListenOptions = {}): {
  promise: Promise<RecognitionOutcome>
  stop: () => void
  cancel: (reason?: RecognitionErrorKind) => void
} {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) {
    return {
      promise: Promise.resolve({
        ok: false,
        error: 'unsupported',
        message: ERROR_MESSAGES.unsupported,
      }),
      stop: () => {},
      cancel: () => {},
    }
  }

  let settled = false
  let recognizer: SpeechRecognitionLike | null = null
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null
  let watchdogTimer: ReturnType<typeof setTimeout> | null = null
  let lastInterim = ''
  let finishRef: (outcome: RecognitionOutcome) => void = () => {}

  const clearTimers = () => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer)
      timeoutTimer = null
    }
    if (watchdogTimer) {
      clearTimeout(watchdogTimer)
      watchdogTimer = null
    }
  }

  const abortRecognizer = () => {
    if (!recognizer) return
    const rec = recognizer
    recognizer = null
    try {
      rec.onresult = null
      rec.onerror = null
      rec.onend = null
      rec.abort()
    } catch {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }
  }

  const cleanup = () => {
    clearTimers()
    abortRecognizer()
  }

  const finishWithHeardOrNoSpeech = () => {
    if (lastInterim) {
      finishRef({ ok: true, transcript: lastInterim })
      return
    }
    finishRef({
      ok: false,
      error: 'no-speech',
      message: ERROR_MESSAGES['no-speech'],
    })
  }

  const cancel = (reason: RecognitionErrorKind = 'aborted') => {
    finishRef({
      ok: false,
      error: reason,
      message: ERROR_MESSAGES[reason] ?? ERROR_MESSAGES.unknown,
    })
  }

  const stop = () => {
    cancel('aborted')
  }

  const promise = new Promise<RecognitionOutcome>((resolve) => {
    const finish = (outcome: RecognitionOutcome) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(outcome)
    }
    finishRef = finish

    const armSoftTimeout = (timeoutMs: number) => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
        timeoutTimer = null
      }
      timeoutTimer = setTimeout(() => {
        if (settled) return
        // Ask the engine to end; iOS may never fire onend — watchdog covers that.
        if (recognizer) {
          try {
            recognizer.stop()
          } catch {
            finishWithHeardOrNoSpeech()
          }
        } else {
          finishWithHeardOrNoSpeech()
        }
      }, timeoutMs)
    }

    const startRecognition = () => {
      if (settled) return
      try {
        const rec = new Ctor()
        recognizer = rec
        rec.continuous = false
        rec.interimResults = true
        rec.maxAlternatives = 3
        rec.lang = options.lang ?? 'sk-SK'

        rec.onresult = (ev) => {
          let finalText = ''
          let interim = ''
          for (let i = 0; i < ev.results.length; i++) {
            const r = ev.results[i]
            const t = r?.[0]?.transcript?.trim() ?? ''
            if (!t) continue
            if (r.isFinal) finalText = finalText ? `${finalText} ${t}` : t
            else interim = t
          }
          if (interim) {
            lastInterim = interim
            options.onInterim?.(interim)
          }
          if (finalText) {
            finish({ ok: true, transcript: finalText })
          }
        }

        rec.onerror = (ev) => {
          const kind = mapError(ev.error)
          if (kind === 'aborted') {
            // Timeout-triggered stop() often surfaces as aborted; prefer what we heard.
            finishWithHeardOrNoSpeech()
            return
          }
          finish({ ok: false, error: kind, message: ERROR_MESSAGES[kind] })
        }

        rec.onend = () => {
          if (settled) return
          finishWithHeardOrNoSpeech()
        }

        const timeoutMs = options.timeoutMs ?? 8000
        armSoftTimeout(timeoutMs)

        try {
          rec.start()
        } catch {
          try {
            rec.lang = 'sk'
            rec.start()
          } catch {
            finish({
              ok: false,
              error: 'unsupported',
              message: ERROR_MESSAGES.unsupported,
            })
          }
        }
      } catch {
        finish({
          ok: false,
          error: 'unsupported',
          message: ERROR_MESSAGES.unsupported,
        })
      }
    }

    // Hard hang-breaker from the moment listenOnce is called (covers getUserMedia too).
    const timeoutMs = options.timeoutMs ?? 8000
    watchdogTimer = setTimeout(() => {
      finishWithHeardOrNoSpeech()
    }, timeoutMs + WATCHDOG_GRACE_MS)

    const begin = () => {
      if (settled) return
      if (isAppleWebKit()) {
        void warmupMic().then((denied) => {
          if (settled) return
          if (denied) {
            finish(denied)
            return
          }
          startRecognition()
        })
        return
      }
      startRecognition()
    }

    begin()
  })

  return { promise, stop, cancel }
}
