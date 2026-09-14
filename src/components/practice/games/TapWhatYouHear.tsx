import { useCallback, useEffect, useMemo, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { useProgressStore } from '../../../store/progressStore'
import {
  getGameVocab,
  meaningOptions,
  pickN,
  type VocabPair,
} from '../../../lib/gameVocab'
import { speakSlovak, warmVoices } from '../../../lib/speak'
import { GameResult } from '../GameResult'

const ROUND_SIZE = 10
const LIVES = 3

interface Props {
  onExit: () => void
}

export function TapWhatYouHear({ onExit }: Props) {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const earnXp = useProgressStore((s) => s.earnXp)

  const pool = useMemo(() => getGameVocab(completedLessons), [completedLessons])

  const [items, setItems] = useState<VocabPair[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [finished, setFinished] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(0)
  const [roundKey, setRoundKey] = useState(0)

  useEffect(() => {
    warmVoices()
  }, [])

  const startRound = useCallback(() => {
    const qs = pickN(pool, ROUND_SIZE)
    setItems(qs)
    setIndex(0)
    setScore(0)
    setLives(LIVES)
    setSelected(null)
    setFeedback('idle')
    setFinished(false)
    setXpAwarded(0)
    setRoundKey((k) => k + 1)
  }, [pool])

  useEffect(() => {
    startRound()
  }, [startRound])

  const current = items[index]

  // Auto-speak when question changes (user-gesture may be needed on iOS —
  // also offer big replay button)
  useEffect(() => {
    if (!current || finished) return
    // Slight delay so UI paints first
    const t = window.setTimeout(() => speakSlovak(current.sk), 280)
    return () => window.clearTimeout(t)
  }, [current, finished, roundKey, index])

  const options = useMemo(() => {
    if (!current) return []
    return meaningOptions(current, pool, 4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pool, roundKey, index])

  const finish = (finalScore: number) => {
    const xp = Math.min(18, 5 + finalScore * 2)
    earnXp(xp)
    setXpAwarded(xp)
    setFinished(true)
  }

  const pick = (optIndex: number) => {
    if (!current || feedback !== 'idle' || finished) return
    const correct = options[optIndex] === current.en
    setSelected(optIndex)
    setFeedback(correct ? 'correct' : 'wrong')
    const nextScore = correct ? score + 1 : score
    const nextLives = correct ? lives : lives - 1
    if (correct) setScore(nextScore)
    else setLives(nextLives)

    window.setTimeout(() => {
      if (!correct && nextLives <= 0) {
        finish(nextScore)
        return
      }
      if (index >= items.length - 1) {
        finish(nextScore)
        return
      }
      setIndex((i) => i + 1)
      setSelected(null)
      setFeedback('idle')
    }, 500)
  }

  if (finished) {
    const won = score >= Math.ceil(items.length * 0.5)
    return (
      <GameResult
        title={won ? 'Sharp ears!' : 'Listen again'}
        subtitle={won ? 'Počúvam ťa — great listening!' : 'Replay the audio and try once more.'}
        scoreLabel={`${score}/${items.length} correct`}
        xpEarned={xpAwarded}
        won={won}
        emoji={won ? '👂' : '🔊'}
        onPlayAgain={startRound}
        onBack={onExit}
      />
    )
  }

  if (!current) {
    return (
      <div className="flex min-h-full items-center justify-center pb-28 text-slate-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-28 pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400 hover:text-white"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3 text-sm font-bold">
          <span className="text-slovo-gold">★ {score}</span>
          <span className="text-slovo-heart">{'❤️'.repeat(Math.max(0, lives))}</span>
        </div>
      </div>

      <p className="text-sm font-semibold uppercase tracking-wide text-slovo-green-light/80">
        Tap what you hear · {index + 1}/{items.length}
      </p>
      <h2 className="mt-1 text-xl font-black text-white">Listen & pick the meaning</h2>

      <button
        type="button"
        onClick={() => speakSlovak(current.sk)}
        className="mx-auto mt-8 flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-full border-4 border-slovo-green/50 bg-slovo-green/15 text-slovo-green-light shadow-lg transition active:scale-95 hover:bg-slovo-green/25"
        aria-label="Play Slovak audio"
      >
        <Volume2 size={40} strokeWidth={2.5} />
        <span className="text-xs font-bold uppercase tracking-wide">Replay</span>
      </button>
      <p className="mt-3 text-center text-sm text-slate-500">Slovak only — tap to hear again</p>

      <div className="mt-8 flex flex-col gap-3">
        {options.map((opt, i) => {
          const isSel = selected === i
          const isCorrect = opt === current.en
          let cls =
            'border-slate-600 bg-slate-800 hover:border-slate-500 active:scale-[0.98]'
          if (feedback !== 'idle' && isSel && feedback === 'correct') {
            cls = 'border-slovo-green bg-green-950/50 text-slovo-green-light'
          } else if (feedback !== 'idle' && isSel && feedback === 'wrong') {
            cls = 'border-slovo-red bg-red-950/50'
          } else if (feedback !== 'idle' && isCorrect) {
            cls = 'border-slovo-green bg-green-950/40'
          }
          return (
            <button
              key={`${roundKey}-${index}-${opt}`}
              type="button"
              disabled={feedback !== 'idle'}
              onClick={() => pick(i)}
              className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition ${cls}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
