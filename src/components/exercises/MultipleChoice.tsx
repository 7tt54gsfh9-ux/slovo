import { SpeakButton } from '../ui/SpeakButton'
import {
  extractQuotedPhrase,
  looksEnglish,
  looksSlovak,
  resolveSlovakSpeech,
} from '../../lib/speak'

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

export function MultipleChoice({
  prompt,
  promptHint,
  options,
  correctIndex,
  disabled,
  selectedIndex,
  onSelect,
  showResult,
}: Props) {
  const quoted = extractQuotedPhrase(prompt)
  // Prefer hint / correct option / quoted Slovak — never English prompt glosses.
  const speakText = resolveSlovakSpeech(
    promptHint,
    options[correctIndex],
    quoted,
    looksSlovak(prompt) && !looksEnglish(prompt) ? prompt : null,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slovo-green-light/80">
          Choose the correct answer
        </p>
        <div className="mt-2 flex items-start gap-3">
          <h2 className="flex-1 text-2xl font-bold leading-snug text-white">{prompt}</h2>
          {speakText && <SpeakButton text={speakText} size="lg" />}
        </div>
        {promptHint && (
          <p className="mt-2 text-sm text-slate-400">💡 {promptHint}</p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          let ring = 'border-slate-600 bg-slate-800/80 hover:border-slate-400'
          if (selectedIndex === i && !showResult) {
            ring = 'border-slovo-sky bg-sky-950/50'
          }
          if (showResult) {
            if (i === correctIndex) ring = 'border-slovo-green bg-green-950/60'
            else if (selectedIndex === i) ring = 'border-slovo-red bg-red-950/50'
          }
          const optSpeak = resolveSlovakSpeech(opt)
          return (
            <div key={i} className="flex items-stretch gap-2">
              <button
                type="button"
                disabled={disabled || showResult}
                onClick={() => onSelect(i)}
                className={`min-h-14 min-w-0 flex-1 rounded-2xl border-2 px-4 py-3 text-left text-lg font-semibold transition active:scale-[0.98] disabled:cursor-default ${ring}`}
              >
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm text-slate-300">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
              {optSpeak && (
                <SpeakButton
                  text={optSpeak}
                  size="sm"
                  className="self-center"
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
