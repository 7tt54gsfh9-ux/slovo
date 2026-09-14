import { useState } from 'react'
import { useProgressStore } from '../../store/progressStore'
import { SpeedRound } from './games/SpeedRound'
import { MemoryMatch } from './games/MemoryMatch'
import { Scramble } from './games/Scramble'
import { TapWhatYouHear } from './games/TapWhatYouHear'
import { MixedReview } from './games/MixedReview'
import { Zap, Brain, Puzzle, Ear, Dumbbell } from 'lucide-react'

type GameId = 'speed' | 'memory' | 'scramble' | 'listen' | 'mixed'

interface GameCard {
  id: GameId
  name: string
  blurb: string
  emoji: string
  accent: string
  Icon: typeof Zap
}

const GAMES: GameCard[] = [
  {
    id: 'speed',
    name: 'Speed Round',
    blurb: 'Race the clock — pick meanings fast for XP.',
    emoji: '⚡',
    accent: 'border-slovo-gold/50 bg-amber-950/30',
    Icon: Zap,
  },
  {
    id: 'memory',
    name: 'Memory Match',
    blurb: 'Flip cards and pair Slovak ↔ English.',
    emoji: '🧠',
    accent: 'border-slovo-sky/50 bg-sky-950/30',
    Icon: Brain,
  },
  {
    id: 'scramble',
    name: 'Scramble',
    blurb: 'Unscramble letters into Slovak words. Hear it!',
    emoji: '🔤',
    accent: 'border-purple-400/50 bg-purple-950/30',
    Icon: Puzzle,
  },
  {
    id: 'listen',
    name: 'Tap what you hear',
    blurb: 'Listen to Slovak TTS and tap the meaning.',
    emoji: '👂',
    accent: 'border-slovo-green/50 bg-green-950/30',
    Icon: Ear,
  },
  {
    id: 'mixed',
    name: 'Mixed Review',
    blurb: 'Classic practice mix from your lessons.',
    emoji: '💪',
    accent: 'border-slate-500/50 bg-slate-800/40',
    Icon: Dumbbell,
  },
]

interface Props {
  onNeedHearts: () => void
}

export function PracticeView({ onNeedHearts }: Props) {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const [active, setActive] = useState<GameId | null>(null)

  if (active === 'speed') return <SpeedRound onExit={() => setActive(null)} />
  if (active === 'memory') return <MemoryMatch onExit={() => setActive(null)} />
  if (active === 'scramble') return <Scramble onExit={() => setActive(null)} />
  if (active === 'listen') return <TapWhatYouHear onExit={() => setActive(null)} />
  if (active === 'mixed') {
    return <MixedReview onExit={() => setActive(null)} onNeedHearts={onNeedHearts} />
  }

  const doneCount = completedLessons.filter((id) => id !== 'practice-bonus').length

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <h1 className="text-2xl font-black text-white">Practice</h1>
      <p className="mt-2 text-slate-400">
        Mini-games powered by your vocab. Soft lives only — your lesson hearts stay safe.
      </p>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        Vocab from {doneCount > 0 ? `${doneCount} completed lesson${doneCount === 1 ? '' : 's'}` : 'beginner bank'}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActive(g.id)}
            className={`flex items-stretch gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${g.accent}`}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900/50 text-3xl">
              {g.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <g.Icon size={16} className="shrink-0 text-slate-300" />
                <h2 className="text-lg font-extrabold text-white">{g.name}</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">{g.blurb}</p>
            </div>
            <span className="self-center rounded-xl bg-slovo-green px-3 py-2 text-xs font-extrabold uppercase text-slate-900">
              Play
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
