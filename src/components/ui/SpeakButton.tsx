import { useEffect, useState, type MouseEvent } from 'react'
import { Volume2 } from 'lucide-react'
import {
  isSpeechSupported,
  looksEnglish,
  looksSlovak,
  speakSlovak,
  warmVoices,
} from '../../lib/speak'

interface Props {
  text: string
  /** Accessible label override */
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Large mobile-friendly speaker control for Slovak TTS.
 * Hidden when the text is English / empty; no-ops when SpeechSynthesis is missing.
 */
export function SpeakButton({
  text,
  label = 'Pronounce in Slovak',
  className = '',
  size = 'md',
}: Props) {
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    warmVoices()
  }, [])

  const trimmed = text.trim()
  if (!trimmed) return null
  // Never offer a control that would speak English glosses.
  if (looksEnglish(trimmed) && !looksSlovak(trimmed)) return null

  const dim =
    size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-9 w-9 min-h-9 min-w-9' : 'h-11 w-11'
  const icon = size === 'lg' ? 26 : size === 'sm' ? 18 : 22

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const result = speakSlovak(trimmed)
    if (result === 'unsupported') {
      setToast('Speech not supported on this device')
      window.setTimeout(() => setToast(null), 2200)
    }
  }

  const supported = isSpeechSupported()

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={supported ? label : 'Speech not supported'}
        className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full border-2 border-slovo-green/60 bg-slovo-green/15 text-slovo-green-light shadow-sm transition active:scale-95 hover:bg-slovo-green/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slovo-green ${
          supported ? '' : 'opacity-60'
        }`}
      >
        <Volume2 size={icon} strokeWidth={2.5} />
      </button>
      {toast && (
        <span
          role="status"
          className="absolute left-1/2 top-full z-20 mt-1 w-max -translate-x-1/2 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg"
        >
          {toast}
        </span>
      )}
    </span>
  )
}
