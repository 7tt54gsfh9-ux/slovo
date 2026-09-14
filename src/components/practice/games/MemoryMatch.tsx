import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProgressStore } from '../../../store/progressStore'
import { getGameVocab, pickN, type VocabPair } from '../../../lib/gameVocab'
import { GameResult } from '../GameResult'

const PAIR_COUNT = 6
const LIVES = 5

type CardSide = 'sk' | 'en'

interface Card {
  id: string
  pairId: number
  text: string
  side: CardSide
}

interface Props {
  onExit: () => void
}

function buildCards(pairs: VocabPair[]): Card[] {
  const cards: Card[] = []
  pairs.forEach((p, i) => {
    cards.push({ id: `sk-${i}`, pairId: i, text: p.sk, side: 'sk' })
    cards.push({ id: `en-${i}`, pairId: i, text: p.en, side: 'en' })
  })
  // shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

export function MemoryMatch({ onExit }: Props) {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const earnXp = useProgressStore((s) => s.earnXp)

  const pool = useMemo(() => getGameVocab(completedLessons), [completedLessons])

  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<string[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [lives, setLives] = useState(LIVES)
  const [moves, setMoves] = useState(0)
  const [busy, setBusy] = useState(false)
  const [finished, setFinished] = useState(false)
  const [won, setWon] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(0)

  const startRound = useCallback(() => {
    const pairs = pickN(pool, PAIR_COUNT)
    setCards(buildCards(pairs))
    setFlipped([])
    setMatched(new Set())
    setLives(LIVES)
    setMoves(0)
    setBusy(false)
    setFinished(false)
    setWon(false)
    setXpAwarded(0)
  }, [pool])

  useEffect(() => {
    startRound()
  }, [startRound])

  const endGame = (didWin: boolean, moveCount: number) => {
    const xp = didWin ? Math.min(18, 8 + Math.max(0, 12 - moveCount)) : 3
    earnXp(xp)
    setXpAwarded(xp)
    setWon(didWin)
    setFinished(true)
  }

  const onCardClick = (card: Card) => {
    if (busy || finished) return
    if (matched.has(card.pairId)) return
    if (flipped.includes(card.id)) return
    if (flipped.length >= 2) return

    const next = [...flipped, card.id]
    setFlipped(next)

    if (next.length < 2) return

    setMoves((m) => m + 1)
    setBusy(true)
    const [aId, bId] = next
    const a = cards.find((c) => c.id === aId)!
    const b = cards.find((c) => c.id === bId)!

    if (a.pairId === b.pairId && a.side !== b.side) {
      const nextMatched = new Set([...matched, a.pairId])
      setMatched(nextMatched)
      setFlipped([])
      setBusy(false)
      if (nextMatched.size >= PAIR_COUNT) {
        endGame(true, moves + 1)
      }
    } else {
      const nextLives = lives - 1
      setLives(nextLives)
      window.setTimeout(() => {
        setFlipped([])
        setBusy(false)
        if (nextLives <= 0) endGame(false, moves + 1)
      }, 700)
    }
  }

  if (finished) {
    return (
      <GameResult
        title={won ? 'Memory master!' : 'Out of lives'}
        subtitle={won ? 'Všetky páry! Great matching.' : 'Flip carefully — try again!'}
        scoreLabel={`${matched.size}/${PAIR_COUNT} pairs · ${moves} moves`}
        xpEarned={xpAwarded}
        won={won}
        emoji={won ? '🧠' : '🃏'}
        onPlayAgain={startRound}
        onBack={onExit}
      />
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
          <span className="text-slate-300">Moves {moves}</span>
          <span className="text-slovo-heart">{'❤️'.repeat(Math.max(0, lives))}</span>
        </div>
      </div>

      <p className="text-sm font-semibold uppercase tracking-wide text-slovo-sky/80">
        Memory Match
      </p>
      <h2 className="mt-1 text-xl font-black text-white">Flip Slovak ↔ English</h2>
      <p className="mt-1 text-sm text-slate-400">
        {matched.size}/{PAIR_COUNT} pairs found
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {cards.map((card) => {
          const isOpen = flipped.includes(card.id) || matched.has(card.pairId)
          const isMatched = matched.has(card.pairId)
          return (
            <button
              key={card.id}
              type="button"
              disabled={isOpen || busy}
              onClick={() => onCardClick(card)}
              className={`relative flex min-h-[4.5rem] items-center justify-center rounded-2xl border-2 p-2 text-center text-xs font-bold leading-tight transition sm:min-h-[5.25rem] sm:text-sm ${
                isMatched
                  ? 'border-slovo-green bg-green-950/50 text-slovo-green-light'
                  : isOpen
                    ? card.side === 'sk'
                      ? 'border-slovo-sky bg-sky-950/40 text-white'
                      : 'border-slovo-gold bg-amber-950/40 text-white'
                    : 'border-slate-600 bg-slate-800 text-slovo-green active:scale-95'
              }`}
            >
              {isOpen ? (
                <span>{card.text}</span>
              ) : (
                <span className="text-2xl font-black text-slovo-green/80">S</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
