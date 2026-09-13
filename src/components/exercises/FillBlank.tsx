import { SpeakButton } from '../ui/SpeakButton'
import { resolveSlovakSpeech } from '../../lib/speak'

interface Props {
  sentence: string
  translation?: string
  promptHint?: string
  options: string[]
  correctIndex: number
  disabled?: boolean
  selectedIndex: number | null
  onSelect: (index: number) => void
  showResult?: boolean
}

export function FillBlank({
  sentence,
  translation,
  promptHint,
  options,
  correctIndex,
  disabled,
  selectedIndex,
  onSelect,
  showResult,
}: Props) {
  const parts = sentence.split('___')
  const filled =
    selectedIndex !== null ? options[selectedIndex] : '______'

  const completeCorrect = sentence.replace('___', options[correctIndex] ?? '')
  // Speak filled Slovak sentence / blank option — never the English translation gloss.
  const speakText = resolveSlovakSpeech(
    completeCorrect,
    options[correctIndex],
    promptHint,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slovo-green-light/80">
          Fill in the blank
        </p>
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-800/70 px-5 py-6">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold leading-relaxed text-white">
              {parts[0]}
              <span
                className={`mx-1 inline-block min-w-[4rem] border-b-4 px-1 text-center ${
                  showResult
                    ? selectedIndex === correctIndex
                      ? 'border-slovo-green text-slovo-green-light'
                      : 'border-slovo-red text-red-300'
                    : selectedIndex !== null
                      ? 'border-slovo-sky text-sky-300'
                      : 'border-slate-500 text-slate-500'
                }`}
              >
                {filled}
              </span>
              {parts[1] ?? ''}
            </p>
            {translation && (
              <p className="mt-3 text-sm text-slate-400">{translation}</p>
            )}
            {promptHint && (
              <p className="mt-2 text-sm text-slate-500">💡 {promptHint}</p>
            )}
          </div>
          {speakText && <SpeakButton text={speakText} size="lg" />}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {options.map((opt, i) => {
          let ring = 'border-slate-600 bg-slate-800 hover:border-slate-400'
          if (selectedIndex === i && !showResult) ring = 'border-slovo-sky bg-sky-950/50'
          if (showResult) {
            if (i === correctIndex) ring = 'border-slovo-green bg-green-950/60'
            else if (selectedIndex === i) ring = 'border-slovo-red bg-red-950/50'
          }
          const optSpeak = resolveSlovakSpeech(opt)
          return (
            <div key={i} className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={disabled || showResult}
                onClick={() => onSelect(i)}
                className={`min-h-12 rounded-xl border-2 px-5 py-3 text-lg font-bold transition active:scale-[0.97] disabled:cursor-default ${ring}`}
              >
                {opt}
              </button>
              {optSpeak && (
                <SpeakButton
                  text={optSpeak}
                  size="sm"
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
