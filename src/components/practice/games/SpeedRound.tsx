import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProgressStore } from '../../../store/progressStore'
import {
  getGameVocab,
  meaningOptions,
  pickN,
  type VocabPair,
} from '../../../lib/gameVocab'
import { SpeakButton } from '../../ui/SpeakButton'
import { GameResult } from '../GameResult'

const ROUND_SECONDS = 45
const QUESTIONS = 12
const LIVES = 3

interface Props {
  onExit: () => void
}

export function SpeedRound({ onExit }: Props) {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const earnXp = useProgressStore((s) => s.earnXp)

  const pool = useMemo(() => getGameVocab(completedLessons), [completedLessons])

  const [roundKey, setRoundKey] = useState(0)
  const [questions, setQuestions] = useState<VocabPair[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [finished, setFinished] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(0)

  const startRound = useCallback(() => {
    const qs = pickN(pool, QUESTIONS)
    setQuestions(qs)
    setIndex(0)
    setScore(0)
    setLives(LIVES)
    setSecondsLeft(ROUND_SECONDS)
    setSelected(null)
    setFeedback('idle')
    setFinished(false)
    setXpAwarded(0)
    setRoundKey((k) => k + 1)
  }, [pool])

  useEffect(() => {
    startRound()
  }, [startRound])

  useEffect(() => {
    if (finished || questions.length === 0) return
    if (secondsLeft <= 0) {
      finish(score)
      return
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, finished, questions.length])

  const current = questions[index]
  const options = useMemo(() => {
    if (!current) return []
    return meaningOptions(current, pool, 4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pool, roundKey, index])

  const finish = (finalScore: number) => {
    if (finished) return
    const xp = Math.min(20, 5 + finalScore * 2)
    earnXp(xp)
    setXpAwarded(xp)
    setFinished(true)
  }

  const advance = (nextScore: number, nextLives: number) => {
    if (nextLives <= 0) {
      finish(nextScore)
      return
    }
    if (index >= questions.length - 1) {
      finish(nextScore)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setFeedback('idle')
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
    window.setTimeout(() => advance(nextScore, nextLives), 450)
  }

  if (finished) {
    const won = score >= Math.ceil(questions.length * 0.5) && lives > 0
    return (
      <GameResult
        title={won ? 'Speed star!' : 'Time\'s up!'}
        subtitle={won ? 'Rýchlo a správne — nice work!' : 'Keep practicing — you\'ll get faster.'}
        scoreLabel={`${score}/${questions.length} correct · ${ROUND_SECONDS - secondsLeft}s`}
        xpEarned={xpAwarded}
        won={won}
        emoji={won ? '⚡' : '⏱️'}
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
          <span className="rounded-full bg-slovo-sky/20 px-3 py-1 text-slovo-sky">
            ⏱ {secondsLeft}s
          </span>
          <span className="text-slovo-gold">★ {score}</span>
          <span className="text-slovo-heart">{'❤️'.repeat(Math.max(0, lives))}</span>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full bg-slovo-gold transition-all duration-1000 ease-linear"
          style={{ width: `${(secondsLeft / ROUND_SECONDS) * 100}%` }}
        />
      </div>

      <p className="text-sm font-semibold uppercase tracking-wide text-slovo-gold/80">
        Speed Round · {index + 1}/{questions.length}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <h2 className="text-3xl font-black text-white">{current.sk}</h2>
        <SpeakButton text={current.sk} size="md" label={`Pronounce ${current.sk}`} />
      </div>
      <p className="mt-1 text-slate-400">What does it mean?</p>

      <div className="mt-6 flex flex-col gap-3">
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
