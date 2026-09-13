import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { SpeakButton } from '../ui/SpeakButton'
import {
  fuzzyMatchSpeech,
  friendlyRecognitionMessage,
  isSpeechRecognitionSupported,
  listenOnce,
} from '../../lib/speechRecognition'

export type SayThisFinish = 'correct' | 'skipped'

interface Props {
  target: string
  meaning: string
  acceptedAnswers?: string[]
  /** Called once when the exercise is done (correct or skipped). */
  onFinish: (result: SayThisFinish) => void
  /** Clear wrong recognition — parent should lose a heart. */
  onWrongAttempt: () => void
  showResult?: boolean
  disabled?: boolean
  resetKey: string
}

type Phase = 'ready' | 'listening' | 'wrong' | 'correct' | 'tech' | 'unsupported'

const LISTEN_TIMEOUT_MS = 7000
const UI_WATCHDOG_MS = LISTEN_TIMEOUT_MS + 2500
const HANG_MESSAGE = 'Mic didn’t respond. Try again or skip this one.'

export function SayThis({
  target,
  meaning,
  acceptedAnswers,
  onFinish,
  onWrongAttempt,
  showResult,
  disabled,
  resetKey,
}: Props) {
  const [phase, setPhase] = useState<Phase>(() =>
    isSpeechRecognitionSupported() ? 'ready' : 'unsupported',
  )
  const [interim, setInterim] = useState('')
  const [heard, setHeard] = useState('')
  const [techMessage, setTechMessage] = useState<string | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const stopRef = useRef<(() => void) | null>(null)
  const finishedRef = useRef(false)
  const recoveredRef = useRef(false)
  const uiWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearUiWatchdog = () => {
    if (uiWatchdogRef.current) {
      clearTimeout(uiWatchdogRef.current)
      uiWatchdogRef.current = null
    }
  }

  useEffect(() => {
    finishedRef.current = false
    recoveredRef.current = false
    if (uiWatchdogRef.current) {
      clearTimeout(uiWatchdogRef.current)
      uiWatchdogRef.current = null
    }
    stopRef.current?.()
    stopRef.current = null
    setPhase(isSpeechRecognitionSupported() ? 'ready' : 'unsupported')
    setInterim('')
    setHeard('')
    setTechMessage(
      isSpeechRecognitionSupported()
        ? null
        : friendlyRecognitionMessage('unsupported'),
    )
    setWrongCount(0)
  }, [resetKey])

  useEffect(() => {
    return () => {
      clearUiWatchdog()
      stopRef.current?.()
    }
  }, [])

  const finish = (result: SayThisFinish) => {
    if (finishedRef.current) return
    finishedRef.current = true
    clearUiWatchdog()
    stopRef.current?.()
    stopRef.current = null
    onFinish(result)
  }

  const startListening = () => {
    if (disabled || showResult || finishedRef.current) return
    if (!isSpeechRecognitionSupported()) {
      setPhase('unsupported')
      setTechMessage(friendlyRecognitionMessage('unsupported'))
      return
    }

    stopRef.current?.()
    recoveredRef.current = false
    clearUiWatchdog()
    setInterim('')
    setHeard('')
    setTechMessage(null)
    setPhase('listening')

    const { promise, stop } = listenOnce({
      lang: 'sk-SK',
      timeoutMs: LISTEN_TIMEOUT_MS,
      onInterim: setInterim,
    })
    stopRef.current = stop

    uiWatchdogRef.current = setTimeout(() => {
      if (finishedRef.current) return
      recoveredRef.current = true
      stopRef.current?.()
      stopRef.current = null
      setPhase('tech')
      setTechMessage(HANG_MESSAGE)
      setInterim('')
    }, UI_WATCHDOG_MS)

    void promise.then((outcome) => {
      clearUiWatchdog()
      stopRef.current = null
      if (finishedRef.current) return
      if (recoveredRef.current) return

      if (!outcome.ok) {
        const kind = outcome.error
        if (kind === 'aborted') {
          setPhase('ready')
          setInterim('')
          return
        }
        const unsupportedLike =
          kind === 'unsupported' ||
          kind === 'language-not-supported' ||
          kind === 'service-not-allowed'
        setPhase(unsupportedLike ? 'unsupported' : 'tech')
        setTechMessage(outcome.message)
        return
      }

      const transcript = outcome.transcript
      setHeard(transcript)
      const ok = fuzzyMatchSpeech(transcript, target, acceptedAnswers)
      if (ok) {
        setPhase('correct')
        finish('correct')
        return
      }
      setWrongCount((c) => c + 1)
      setPhase('wrong')
      onWrongAttempt()
    })
  }

  const stopListening = () => {
    clearUiWatchdog()
    stopRef.current?.()
    stopRef.current = null
    if (!finishedRef.current) {
      setPhase('ready')
      setInterim('')
      setTechMessage(null)
    }
  }

  const locked = Boolean(disabled || showResult || phase === 'correct')
  const canSkip =
    phase === 'unsupported' ||
    phase === 'tech' ||
    phase === 'listening' ||
    (phase === 'wrong' && wrongCount >= 2)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slovo-green-light/80">
          Say this
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <h2 className="text-center text-4xl font-extrabold tracking-tight text-white">
            {target}
          </h2>
          <SpeakButton text={target} size="lg" label={`Hear ${target}`} />
        </div>
        <p className="mt-2 text-center text-lg text-slate-400">{meaning}</p>
      </div>

      <div className="flex flex-col items-center gap-4 py-2">
        {phase === 'listening' ? (
          <button
            type="button"
            onClick={stopListening}
            aria-label="Stop listening"
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-slovo-red text-white shadow-lg shadow-red-900/40"
          >
            <span className="mic-pulse absolute inset-0 rounded-full bg-slovo-red/40" />
            <span className="mic-pulse-delay absolute inset-0 rounded-full bg-slovo-red/30" />
            <Mic size={44} strokeWidth={2.5} className="relative z-10" />
          </button>
        ) : (
          <button
            type="button"
            disabled={locked || phase === 'unsupported'}
            onClick={startListening}
            aria-label="Tap to speak"
            className={`flex h-28 w-28 items-center justify-center rounded-full border-4 shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              phase === 'correct'
                ? 'border-slovo-green bg-green-950 text-slovo-green-light'
                : phase === 'wrong'
                  ? 'border-slovo-red bg-red-950/60 text-red-200'
                  : 'border-slovo-green/70 bg-slovo-green/20 text-slovo-green-light hover:bg-slovo-green/30'
            }`}
          >
            {phase === 'unsupported' ? (
              <MicOff size={44} strokeWidth={2.5} />
            ) : (
              <Mic size={44} strokeWidth={2.5} />
            )}
          </button>
        )}

        <p className="min-h-6 text-center text-sm text-slate-400">
          {phase === 'listening' &&
            (interim ? `Heard: “${interim}”…` : 'Listening…')}
          {phase === 'ready' && 'Tap the mic and say the phrase'}
          {phase === 'wrong' && (
            <span className="text-red-300">
              Try again{heard ? ` — heard “${heard}”` : ''}
            </span>
          )}
          {phase === 'correct' && (
            <span className="font-semibold text-slovo-green-light">
              Nice pronunciation!
            </span>
          )}
          {(phase === 'tech' || phase === 'unsupported') && (
            <span className="text-amber-200">{techMessage}</span>
          )}
        </p>
      </div>

      {!locked && (
        <div className="flex flex-col items-center gap-2">
          {phase === 'listening' && (
            <button
              type="button"
              onClick={stopListening}
              className="w-full rounded-2xl border-2 border-slate-600 bg-slate-800 py-3 text-base font-bold text-white transition active:scale-[0.98]"
            >
              Cancel
            </button>
          )}
          {phase === 'wrong' && wrongCount < 2 && (
            <button
              type="button"
              onClick={startListening}
              className="w-full rounded-2xl border-2 border-slate-600 bg-slate-800 py-3 text-base font-bold text-white transition active:scale-[0.98]"
            >
              Try again
            </button>
          )}
          {phase === 'tech' && (
            <button
              type="button"
              onClick={startListening}
              className="w-full rounded-2xl border-2 border-slate-600 bg-slate-800 py-3 text-base font-bold text-white transition active:scale-[0.98]"
            >
              Try again
            </button>
          )}
          {canSkip && (
            <button
              type="button"
              onClick={() => finish('skipped')}
              className="w-full rounded-2xl border-2 border-slate-600 bg-slate-800/80 py-3 text-base font-semibold text-slate-300 transition active:scale-[0.98] hover:border-slate-400"
            >
              {phase === 'unsupported' || phase === 'tech' || phase === 'listening'
                ? "Can't use mic — skip"
                : 'Skip'}
            </button>
          )}
          {phase === 'unsupported' && (
            <p className="mt-1 text-center text-xs text-slate-500">
              Tip: Chrome / Edge usually support speech best. iOS Safari needs a
              user tap and may lack Slovak (sk-SK) recognition.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
