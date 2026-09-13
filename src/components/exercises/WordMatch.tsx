import { SpeakButton } from '../ui/SpeakButton'
import { looksEnglish, looksSlovak, resolveSlovakSpeech } from '../../lib/speak'

interface Props {
  prompt: string
  promptHint?: string
  options: string[]
  correctIndex: number
  disabled?: boolean
  selectedIndex: number | null
  onSelect: (index: number) => void
  showResult?: boolean
}

export function WordMatch({
  prompt,
  promptHint,
  options,
  correctIndex,
  disabled,
  selectedIndex,
  onSelect,
  showResult,
}: Props) {
  // Prompt is usually English (e.g. "soup"); speak the Slovak correct answer.
  // Never pass English prompt as a TTS candidate.
  const promptIsSlovak = looksSlovak(prompt) && !looksEnglish(prompt)
  const speakText = resolveSlovakSpeech(
    options[correctIndex],
    promptHint,
    promptIsSlovak ? prompt : null,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slovo-green-light/80">
          Tap the meaning
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/50 px-4 py-8">
          <div className="min-w-0 flex-1 text-center">
            <h2 className="text-3xl font-extrabold text-white">{prompt}</h2>
            {promptHint && (
              <p className="mt-2 text-sm text-slate-400">💡 {promptHint}</p>
            )}
          </div>
          {speakText && <SpeakButton text={speakText} size="lg" />}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          let ring = 'border-slate-600 bg-slate-800 hover:border-slate-400'
          if (selectedIndex === i && !showResult) ring = 'border-slovo-sky bg-sky-950/50'
          if (showResult) {
            if (i === correctIndex) ring = 'border-slovo-green bg-green-950/60'
            else if (selectedIndex === i) ring = 'border-slovo-red bg-red-950/50'
          }
          const optSpeak = resolveSlovakSpeech(opt)
          return (
            <div key={i} className="relative">
              <button
                type="button"
                disabled={disabled || showResult}
                onClick={() => onSelect(i)}
                className={`min-h-16 w-full rounded-2xl border-2 px-3 py-4 pr-12 text-center text-base font-bold transition active:scale-[0.97] disabled:cursor-default ${ring}`}
              >
                {opt}
              </button>
              {optSpeak && (
                <SpeakButton
                  text={optSpeak}
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  label={`Pronounce ${optSpeak}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
