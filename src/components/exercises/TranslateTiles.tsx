import { useMemo, useState, useEffect, useCallback } from 'react'
import { SpeakButton } from '../ui/SpeakButton'
import { looksEnglish, resolveSlovakSpeech } from '../../lib/speak'

interface Props {
  prompt: string
  promptHint?: string
  answer: string[]
  distractors?: string[]
  disabled?: boolean
  showResult?: boolean
  onChange: (words: string[], isComplete: boolean) => void
  resetKey?: string | number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function TranslateTiles({
  prompt,
  promptHint,
  answer,
  distractors = [],
  disabled,
  showResult,
  onChange,
  resetKey,
}: Props) {
  const bank = useMemo(
    () => shuffle([...answer, ...distractors]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetKey],
  )
  const [selected, setSelected] = useState<string[]>([])
  const [usedIndices, setUsedIndices] = useState<number[]>([])

  useEffect(() => {
    setSelected([])
    setUsedIndices([])
  }, [resetKey])

  const notify = useCallback(
    (words: string[]) => {
      onChange(words, words.length === answer.length)
    },
    [onChange, answer.length],
  )

  useEffect(() => {
    notify(selected)
  }, [selected, notify])

  const pick = (word: string, index: number) => {
    if (disabled || showResult || usedIndices.includes(index)) return
    setSelected((s) => [...s, word])
    setUsedIndices((u) => [...u, index])
  }

  const unpick = (selIndex: number) => {
    if (disabled || showResult) return
    setSelected((s) => s.filter((_, i) => i !== selIndex))
    setUsedIndices((u) => u.filter((_, i) => i !== selIndex))
  }

  const isCorrect =
    showResult &&
    selected.length === answer.length &&
    selected.every((w, i) => w === answer[i])

  // Answer tiles are Slovak; never speak the English prompt/translation.
  const speakText = resolveSlovakSpeech(answer.join(' '), promptHint)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slovo-green-light/80">
          Translate with tiles
        </p>
        <div className="mt-2 flex items-start gap-3">
          <h2 className="flex-1 text-2xl font-bold text-white">{prompt}</h2>
          {speakText && <SpeakButton text={speakText} size="lg" />}
        </div>
        {promptHint && (
          <p className="mt-2 text-sm text-slate-400">💡 {promptHint}</p>
        )}
      </div>

      <div
        className={`min-h-24 rounded-2xl border-2 border-dashed px-3 py-4 ${
          showResult
            ? isCorrect
              ? 'border-slovo-green bg-green-950/30'
              : 'border-slovo-red bg-red-950/30'
            : 'border-slate-600 bg-slate-800/40'
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {selected.length === 0 && (
            <span className="text-slate-500">Tap tiles below…</span>
          )}
          {selected.map((w, i) => (
            <button
              key={`${w}-${i}`}
              type="button"
              disabled={disabled || showResult}
              onClick={() => unpick(i)}
              className="rounded-xl border-2 border-slovo-sky bg-sky-950/40 px-3 py-2 text-lg font-bold text-white"
            >
              {w}
            </button>
          ))}
        </div>
        {showResult && !isCorrect && (
          <p className="mt-3 text-sm text-slovo-green-light">
            Correct: {answer.join(' ')}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {bank.map((word, i) => {
          const used = usedIndices.includes(i)
          const canSpeak = !used && !looksEnglish(word)
          return (
            <div key={`${word}-${i}`} className="flex items-center gap-1">
              <button
                type="button"
                disabled={disabled || showResult || used}
                onClick={() => pick(word, i)}
                className={`rounded-xl border-2 px-4 py-3 text-lg font-bold transition active:scale-[0.97] ${
                  used
                    ? 'border-transparent bg-slate-800/30 text-transparent'
                    : 'border-slate-600 bg-slate-800 text-white hover:border-slate-400'
                }`}
              >
                {word}
              </button>
              {canSpeak && (
                <SpeakButton
                  text={word}
                  size="sm"
                  label={`Pronounce ${word}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
