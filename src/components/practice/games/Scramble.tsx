import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProgressStore } from '../../../store/progressStore'
import { getGameVocab, pickN, shuffle, type VocabPair } from '../../../lib/gameVocab'
import { SpeakButton } from '../../ui/SpeakButton'
import { GameResult } from '../GameResult'

const ROUND_SIZE = 8
const LIVES = 3

interface Props {
  onExit: () => void
}

interface Tile {
  id: string
  char: string
}

function scrambleWord(word: string): Tile[] {
  // Keep spaces as fixed separators; scramble letters only within the phrase
  const chars = [...word]
  const letterIndexes: number[] = []
  chars.forEach((c, i) => {
    if (c !== ' ') letterIndexes.push(i)
  })
  const letters = shuffle(letterIndexes.map((i) => chars[i]))
  // Avoid identical scramble when possible
  let attempts = 0
  while (attempts < 8 && letters.join('') === letterIndexes.map((i) => chars[i]).join('')) {
    const reshuffled = shuffle(letters)
    letters.splice(0, letters.length, ...reshuffled)
    attempts++
  }
  return letters.map((char, i) => ({ id: `${i}-${char}`, char }))
}

export function Scramble({ onExit }: Props) {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const earnXp = useProgressStore((s) => s.earnXp)

  const pool = useMemo(
    () =>
      getGameVocab(completedLessons).filter(
        (p) => p.sk.replace(/\s/g, '').length >= 3 && p.sk.length <= 18,
      ),
    [completedLessons],
  )

  const [items, setItems] = useState<VocabPair[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [bank, setBank] = useState<Tile[]>([])
  const [built, setBuilt] = useState<Tile[]>([])
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [finished, setFinished] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(0)

  const startRound = useCallback(() => {
    const qs = pickN(pool, ROUND_SIZE)
    setItems(qs)
    setIndex(0)
    setScore(0)
    setLives(LIVES)
    setFeedback('idle')
    setFinished(false)
    setXpAwarded(0)
    if (qs[0]) {
      setBank(scrambleWord(qs[0].sk))
      setBuilt([])
    }
  }, [pool])

  useEffect(() => {
    startRound()
  }, [startRound])

  const current = items[index]

  const loadIndex = (i: number, list: VocabPair[]) => {
    const item = list[i]
    if (!item) return
    setBank(scrambleWord(item.sk))
    setBuilt([])
    setFeedback('idle')
  }

  const finish = (finalScore: number) => {
    const xp = Math.min(16, 4 + finalScore * 2)
    earnXp(xp)
    setXpAwarded(xp)
    setFinished(true)
  }

  const builtText = built.map((t) => t.char).join('')
  // Reconstruct with spaces from target
  const answerWithSpaces = (() => {
    if (!current) return builtText
    const target = current.sk
    if (!target.includes(' ')) return builtText
    // Insert spaces at same positions as target while mapping letters
    let li = 0
    let out = ''
    for (const ch of target) {
      if (ch === ' ') out += ' '
      else {
        out += builtText[li] ?? ''
        li++
      }
    }
    return out
  })()

  const check = () => {
    if (!current || feedback !== 'idle') return
    const targetLetters = current.sk.replace(/\s/g, '')
    const ok = builtText === targetLetters
    setFeedback(ok ? 'correct' : 'wrong')
    const nextScore = ok ? score + 1 : score
    const nextLives = ok ? lives : lives - 1
    if (ok) setScore(nextScore)
    else setLives(nextLives)

    window.setTimeout(() => {
      if (!ok && nextLives <= 0) {
        finish(nextScore)
        return
      }
      if (index >= items.length - 1) {
        finish(nextScore)
        return
      }
      const next = index + 1
      setIndex(next)
      setScore(nextScore)
      setLives(nextLives)
      loadIndex(next, items)
    }, 650)
  }

  const tapBank = (tile: Tile) => {
    if (feedback !== 'idle') return
    setBank((b) => b.filter((t) => t.id !== tile.id))
    setBuilt((b) => [...b, tile])
  }

  const tapBuilt = (tile: Tile) => {
    if (feedback !== 'idle') return
    setBuilt((b) => b.filter((t) => t.id !== tile.id))
    setBank((b) => [...b, tile])
  }

  const clearBuilt = () => {
    if (feedback !== 'idle' || !current) return
    setBank(scrambleWord(current.sk))
    setBuilt([])
  }

  if (finished) {
    const won = score >= Math.ceil(items.length * 0.5)
    return (
      <GameResult
        title={won ? 'Unscrambled!' : 'Keep going'}
        subtitle={won ? 'Písmená v poradí — výborne!' : 'Those letters are tricky — try again.'}
        scoreLabel={`${score}/${items.length} words`}
        xpEarned={xpAwarded}
        won={won}
        emoji={won ? '🔤' : '🧩'}
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

      <p className="text-sm font-semibold uppercase tracking-wide text-purple-300/90">
        Scramble · {index + 1}/{items.length}
      </p>
      <h2 className="mt-1 text-xl font-black text-white">Unscramble the Slovak</h2>
      <p className="mt-2 text-slate-400">Hint: {current.en}</p>
      <div className="mt-2">
        <SpeakButton text={current.sk} size="md" label="Hear the word" />
      </div>

      <div
        className={`mt-6 flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-3 py-4 ${
          feedback === 'correct'
            ? 'border-slovo-green bg-green-950/30'
            : feedback === 'wrong'
              ? 'border-slovo-red bg-red-950/30 animate-shake'
              : 'border-slate-600 bg-slate-800/50'
        }`}
      >
        {built.length === 0 ? (
          <span className="text-sm text-slate-500">Tap letters below</span>
        ) : (
          built.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => tapBuilt(t)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slovo-sky bg-sky-950/40 text-lg font-black text-white"
            >
              {t.char}
            </button>
          ))
        )}
      </div>
      {current.sk.includes(' ') && built.length > 0 && (
        <p className="mt-2 text-center text-sm text-slate-500">{answerWithSpaces}</p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {bank.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => tapBank(t)}
            disabled={feedback !== 'idle'}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-600 bg-slate-800 text-lg font-black text-white transition active:scale-95 disabled:opacity-50"
          >
            {t.char}
          </button>
        ))}
      </div>

      <div className="mt-auto flex gap-3 pt-8">
        <button
          type="button"
          onClick={clearBuilt}
          disabled={feedback !== 'idle'}
          className="rounded-2xl border-2 border-slate-600 px-4 py-3 font-bold text-slate-300 disabled:opacity-40"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={check}
          disabled={feedback !== 'idle' || builtText.length === 0}
          className="flex-1 rounded-2xl bg-slovo-green py-3 font-extrabold uppercase text-slate-900 disabled:bg-slate-700 disabled:text-slate-500"
        >
          Check
        </button>
      </div>
    </div>
  )
}
