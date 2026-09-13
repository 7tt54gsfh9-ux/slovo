import { useMemo, useState, useEffect } from 'react'
import { SpeakButton } from '../ui/SpeakButton'
import { looksEnglish, looksSlovak } from '../../lib/speak'

interface Pair {
  left: string
  right: string
}

interface Props {
  prompt?: string
  pairs: Pair[]
  disabled?: boolean
  showResult?: boolean
  onComplete: (correct: boolean) => void
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

function canSpeakSlovak(text: string): boolean {
  if (!text.trim()) return false
  if (looksSlovak(text)) return true
  // Left column is Slovak by curriculum contract; allow ASCII-only Slovak.
  return !looksEnglish(text)
}

export function MatchPairs({
  prompt,
  pairs,
  disabled,
  showResult,
  onComplete,
  resetKey,
}: Props) {
  const leftItems = useMemo(() => pairs.map((p, i) => ({ text: p.left, id: i })), [pairs])
  const rightItems = useMemo(
    () => shuffle(pairs.map((p, i) => ({ text: p.right, id: i }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetKey],
  )

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrongFlash, setWrongFlash] = useState<[number, number] | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState(0)

  useEffect(() => {
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatched(new Set())
    setWrongFlash(null)
    setMistakes(0)
  }, [resetKey])

  useEffect(() => {
    if (matched.size === pairs.length && pairs.length > 0) {
      onComplete(mistakes === 0)
    }
  }, [matched, pairs.length, mistakes, onComplete])

  const tryMatch = (leftId: number, rightId: number) => {
    if (leftId === rightId) {
      setMatched((m) => new Set([...m, leftId]))
      setSelectedLeft(null)
      setSelectedRight(null)
    } else {
      setMistakes((n) => n + 1)
      setWrongFlash([leftId, rightId])
      setTimeout(() => {
        setWrongFlash(null)
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 500)
    }
  }

  const clickLeft = (id: number) => {
    if (disabled || showResult || matched.has(id)) return
    if (selectedRight !== null) {
      tryMatch(id, selectedRight)
    } else {
      setSelectedLeft(id)
    }
  }

  const clickRight = (id: number) => {
    if (disabled || showResult || matched.has(id)) return
    if (selectedLeft !== null) {
      tryMatch(selectedLeft, id)
    } else {
      setSelectedRight(id)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slovo-green-light/80">
          Match pairs
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">
          {prompt ?? 'Match Slovak ↔ English'}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {leftItems.map((item) => {
            const isMatched = matched.has(item.id)
            const isSel = selectedLeft === item.id
            const isWrong = wrongFlash?.[0] === item.id
            const canSpeak = canSpeakSlovak(item.text)
            return (
              <div key={`L-${item.id}`} className="flex items-stretch gap-1.5">
                <button
                  type="button"
                  disabled={disabled || showResult || isMatched}
                  onClick={() => clickLeft(item.id)}
                  className={`min-h-14 min-w-0 flex-1 rounded-xl border-2 px-2 py-3 text-sm font-bold transition ${
                    isMatched
                      ? 'border-slovo-green bg-green-950/50 text-slovo-green-light'
                      : isWrong
                        ? 'animate-shake border-slovo-red bg-red-950/50'
                        : isSel
                          ? 'border-slovo-sky bg-sky-950/50'
                          : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  {item.text}
                </button>
                {canSpeak && (
                  <SpeakButton
                    text={item.text}
                    size="sm"
                    className="self-center"
                    label={`Pronounce ${item.text}`}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex flex-col gap-2">
          {rightItems.map((item) => {
            const isMatched = matched.has(item.id)
            const isSel = selectedRight === item.id
            const isWrong = wrongFlash?.[1] === item.id
            // Right column is English — never offer TTS here.
            return (
              <button
                key={`R-${item.id}`}
                type="button"
                disabled={disabled || showResult || isMatched}
                onClick={() => clickRight(item.id)}
                className={`min-h-14 rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
                  isMatched
                    ? 'border-slovo-green bg-green-950/50 text-slovo-green-light'
                    : isWrong
                      ? 'animate-shake border-slovo-red bg-red-950/50'
                      : isSel
                        ? 'border-slovo-sky bg-sky-950/50'
                        : 'border-slate-600 bg-slate-800'
                }`}
              >
                {item.text}
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-center text-sm text-slate-500">
        {matched.size}/{pairs.length} matched
      </p>
    </div>
  )
}
