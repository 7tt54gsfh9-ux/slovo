/** Slovak Web Speech API helpers for Slovo. */

const SK_DIACRITICS = /[áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]/

/**
 * Common Slovak tokens in the curriculum (with/without diacritics).
 * Intentionally excludes ultra-short ambiguous tokens (a, ja, ty, sa, …)
 * that also appear in English.
 */
const SK_WORDS =
  /\b(ahoj|cau|čau|dovidenia|prosim|prosím|dakujem|ďakujem|áno|ano|nie|dobry|dobrý|dobre|rano|ráno|vecer|večer|den|deň|popoludnie|pivo|vino|víno|voda|kava|káva|dzus|džús|caj|čaj|volam|volám|volas|voláš|nula|jeden|jedna|jedno|dva|tri|styri|štyri|pat|päť|sest|šesť|sedem|osem|devat|deväť|desat|desať|jedenast|jedenásť|dvanast|dvanásť|osemnast|osemnásť|sedemnast|sedemnásť|dvadsat|dvadsať|chlieb|syr|ryza|ryža|polievka|polievku|maso|mäso|ryba|salat|šalát|zemiaky|jablko|cukor|vajce|otec|mama|brat|sestra|syn|dcera|dcéra|rodina|deti|dieta|dieťa|priatel|priateľ|manzel|manžel|manzelka|manželka|dedko|babicka|babička|stary|starý|stara|stará|modry|modrý|biely|cerveny|červený|oranzovy|oranžový|hnedy|hnedý|maly|malý|velky|veľký|horuci|horúci|chutne|chutné|krasny|krásny|lahky|ľahký|malo|málo|vela|veľa|nic|nič|vsetko|všetko|tesi|teší|vyborne|výborne|prepac|prepáč|prepaccte|prepáčte|kolko|koľko|stoji|stojí|ucet|účet|hladny|hladný|hladna|hladná|nemam|nemám|chcem|idem|neviem|rozumiem|nerozumiem|hovorim|hovorím|pekne|slovenska|slovensky|slovenský|jeme|jedavam|jedávam|ranajky|raňajky|obed|veceru|večeru|mily|milý|mila|milá|doma|pomaly|pomaly|neskoro|volam|som|mam|mám|rad|rád|rada|ako|mate|máte|mas|máš|moja|moj|môj|tvoj|tvoja)\b/i

/** English UI / gloss patterns that must never be spoken via Slovak TTS. */
const ENGLISH_UI_START =
  /^(how |what |which |translate|tap |match |choose |see |i'm |i am |i |we |you |nice |good |please|excuse|great|excellent|respond |formal |the |a |an |and )/i

const COMMON_ENGLISH =
  /\b(soup|meat|bread|fish|cheese|egg|eggs|rice|potato|potatoes|apple|orange|banana|grape|beer|wine|juice|water|coffee|tea|milk|salad|sugar|yes|no|hello|goodbye|thanks|thank|morning|evening|night|afternoon|later|welcome|fine|great|excellent|delicious|tasty|father|mother|parents|sister|brother|son|daughter|grandfather|grandmother|wife|husband|friend|boyfriend|girlfriend|family|child|children|blue|white|red|brown|black|green|yellow|small|big|hot|cold|easy|light|beautiful|nice|nothing|little|few|many|lot|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|seventeen|eighteen|twenty|zero|bill|understand|speak|have|like|don't|means|goodbye|please|excuse|formal|informal|daytime|greeting|price|temperature|spicy|sense|often|from|slovakia|you'?re|kind|welcome)\b/i

let cachedVoice: SpeechSynthesisVoice | null | undefined
let voicesLoaded = false

function pickSlovakVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return cachedVoice ?? null

  const exact =
    voices.find((v) => v.lang === 'sk-SK') ||
    voices.find((v) => v.lang.toLowerCase().startsWith('sk'))
  const fuzzy = voices.find((v) => /slovak|sloven/i.test(v.name))
  cachedVoice = exact ?? fuzzy ?? null
  voicesLoaded = true
  return cachedVoice
}

/** Warm voices list (Chrome loads async). Safe to call early. */
export function warmVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  pickSlovakVoice()
  if (!voicesLoaded) {
    window.speechSynthesis.addEventListener('voiceschanged', () => pickSlovakVoice(), {
      once: true,
    })
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
}

export function looksSlovak(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (SK_DIACRITICS.test(t)) return true
  if (SK_WORDS.test(t)) return true
  return false
}

/**
 * True for English UI copy / glosses that must never be fed to Slovak TTS.
 * Slovak (incl. ASCII-only curriculum answers like "polievka") returns false.
 */
export function looksEnglish(text: string): boolean {
  const t = text.trim()
  if (!t) return true
  if (looksSlovak(t)) return false
  if (/[?？]/.test(t)) return true
  if (ENGLISH_UI_START.test(t)) return true
  // Pure digits / numeric glosses ("4", "10", "17")
  if (/^\d+$/.test(t)) return true
  if (COMMON_ENGLISH.test(t)) return true
  // Multi-word ASCII phrases without Slovak markers → treat as English gloss
  if (/^[a-zA-Z0-9\s/',.!+\-…:/]+$/.test(t) && /\s/.test(t)) return true
  return false
}

/** Strip pronunciation hints like "(AH-hoy)" from curriculum hints. */
export function stripPronunciationHint(text: string): string {
  return text.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Pull first quoted phrase from a prompt, if any. */
export function extractQuotedPhrase(text: string): string | null {
  const patterns = [
    /[“"]([^”"]+)[”"]/,
    /"([^"]+)"/,
    /'([^']+)'/,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

/**
 * Pick the best Slovak string to pronounce from common exercise fields.
 * Never returns English — if nothing is clearly Slovak-safe, returns null
 * (callers should hide SpeakButton).
 *
 * Pass known-Slovak fields first (correct answers, Slovak sentences, hints).
 */
export function resolveSlovakSpeech(
  ...candidates: Array<string | undefined | null>
): string | null {
  const cleanedList: string[] = []
  for (const raw of candidates) {
    if (!raw) continue
    const cleaned = stripPronunciationHint(raw)
    if (!cleaned) continue
    cleanedList.push(cleaned)
  }

  // Prefer positive Slovak detection (diacritics / known tokens)
  for (const cleaned of cleanedList) {
    if (looksSlovak(cleaned)) return cleaned
  }

  // Trust remaining candidates that are not English UI/glosses
  // (covers ASCII-only Slovak answers like "polievka", "chlieb", "syr")
  for (const cleaned of cleanedList) {
    if (looksEnglish(cleaned)) continue
    if (cleaned.length > 96) continue
    return cleaned
  }

  return null
}

export type SpeakResult = 'spoke' | 'unsupported' | 'empty' | 'not_slovak'

/**
 * Speak Slovak text. Must be called from a user gesture on iOS Safari.
 * Stops any current utterance before starting.
 * Refuses English / empty strings so TTS never pronounces glosses.
 */
export function speakSlovak(text: string): SpeakResult {
  const trimmed = text.trim()
  if (!trimmed) return 'empty'
  if (looksEnglish(trimmed) && !looksSlovak(trimmed)) return 'not_slovak'
  if (!isSpeechSupported()) return 'unsupported'

  const synth = window.speechSynthesis
  synth.cancel()

  const utter = new SpeechSynthesisUtterance(trimmed)
  utter.lang = 'sk-SK'
  const voice = pickSlovakVoice()
  if (voice) {
    utter.voice = voice
    utter.lang = voice.lang || 'sk-SK'
  } else {
    utter.lang = 'sk-SK'
  }
  utter.rate = 0.92
  utter.pitch = 1

  // Fallback lang if sk-SK unsupported on some engines
  try {
    synth.speak(utter)
  } catch {
    utter.lang = 'sk'
    synth.speak(utter)
  }
  return 'spoke'
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return
  window.speechSynthesis.cancel()
}
