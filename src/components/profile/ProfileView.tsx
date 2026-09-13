import { useProgressStore, MAX_HEARTS, DAILY_GOAL_XP } from '../../store/progressStore'
import { curriculum } from '../../content/curriculum'
import { Smartphone } from 'lucide-react'

export function ProfileView() {
  const xp = useProgressStore((s) => s.xp)
  const streak = useProgressStore((s) => s.streak)
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const getHeartsDisplay = useProgressStore((s) => s.getHeartsDisplay)
  const getDailyProgress = useProgressStore((s) => s.getDailyProgress)
  const refillHeartsNow = useProgressStore((s) => s.refillHeartsNow)
  const lastPracticeDate = useProgressStore((s) => s.lastPracticeDate)

  const hearts = getHeartsDisplay()
  const daily = getDailyProgress()
  const realCompleted = completedLessons.filter((id) => id !== 'practice-bonus')
  const totalLessons = curriculum.reduce((n, u) => n + u.lessons.length, 0)

  const resetProgress = () => {
    if (confirm('Reset all Slovo progress on this device?')) {
      localStorage.removeItem('slovo-progress')
      window.location.reload()
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slovo-green to-emerald-700 text-3xl font-black text-white shadow-lg">
          S
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Your profile</h1>
          <p className="text-sm text-slate-400">Progress saved on this device</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total XP" value={String(xp)} emoji="⚡" />
        <Stat label="Streak" value={`${streak} day${streak === 1 ? '' : 's'}`} emoji="🔥" />
        <Stat label="Hearts" value={`${hearts}/${MAX_HEARTS}`} emoji="❤️" />
        <Stat
          label="Lessons"
          value={`${realCompleted.length}/${totalLessons}`}
          emoji="📚"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
        <p className="text-sm font-semibold text-slate-300">Daily goal</p>
        <p className="mt-1 text-2xl font-black text-slovo-green-light">
          {daily.current} / {DAILY_GOAL_XP} XP
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Last practice: {lastPracticeDate ?? 'Never'}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slovo-sky/50 bg-sky-950/30 p-4">
        <div className="mb-2 flex items-center gap-2 text-slovo-sky">
          <Smartphone size={20} />
          <h2 className="font-bold">Add to Home Screen</h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          Install Slovo as an app for offline practice:
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
          <li>
            <strong className="text-slate-300">iPhone:</strong> Share → Add to Home
            Screen
          </li>
          <li>
            <strong className="text-slate-300">Android:</strong> Menu → Install app /
            Add to Home screen
          </li>
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => refillHeartsNow()}
          className="rounded-2xl border border-slate-600 bg-slate-800 py-3 font-bold text-slate-200"
        >
          Refill hearts
        </button>
        <button
          type="button"
          onClick={resetProgress}
          className="rounded-2xl py-3 text-sm font-semibold text-red-400"
        >
          Reset progress
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-slate-600">
        Slovo — original Slovak learning content. Not affiliated with Duolingo.
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  emoji,
}: {
  label: string
  value: string
  emoji: string
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
      <p className="text-xs text-slate-400">
        {emoji} {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  )
}
