import { useEffect } from 'react'
import { Check, Lock, Star } from 'lucide-react'
import { curriculum } from '../../content/curriculum'
import { useProgressStore } from '../../store/progressStore'
import { HeartsDisplay } from '../layout/HeartsDisplay'

interface Props {
  onStartLesson: (lessonId: string) => void
}

export function LearningPath({ onStartLesson }: Props) {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const isLessonUnlocked = useProgressStore((s) => s.isLessonUnlocked)
  const xp = useProgressStore((s) => s.xp)
  const streak = useProgressStore((s) => s.streak)
  const getHeartsDisplay = useProgressStore((s) => s.getHeartsDisplay)
  const getDailyProgress = useProgressStore((s) => s.getDailyProgress)
  const refillHeartsIfNeeded = useProgressStore((s) => s.refillHeartsIfNeeded)

  useEffect(() => {
    refillHeartsIfNeeded()
  }, [refillHeartsIfNeeded])

  const hearts = getHeartsDisplay()
  const daily = getDailyProgress()

  return (
    <div className="mx-auto min-h-full max-w-lg px-4 pb-28 pt-4">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Slovo
          </h1>
          <p className="text-sm text-slate-400">Learn Slovak, one word at a time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-orange-950/50 px-2.5 py-1.5">
            <span className="text-base">🔥</span>
            <span className="text-sm font-extrabold text-orange-400">{streak}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-950/40 px-2.5 py-1.5">
            <span className="text-base">⚡</span>
            <span className="text-sm font-extrabold text-amber-400">{xp}</span>
          </div>
          <HeartsDisplay hearts={hearts} />
        </div>
      </header>

      <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-300">Daily goal</span>
          <span className="font-bold text-slovo-green-light">
            {daily.current}/{daily.goal} XP
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-slovo-green to-emerald-400 transition-all"
            style={{ width: `${Math.min(100, (daily.current / daily.goal) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {curriculum.map((unit, uIdx) => (
          <section key={unit.id}>
            <div
              className="mb-5 rounded-2xl px-4 py-3 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${unit.color}, ${unit.color}99)` }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                Unit {uIdx + 1}
              </p>
              <h2 className="text-xl font-black text-white">{unit.title}</h2>
              <p className="text-sm text-white/85">{unit.description}</p>
            </div>

            <div className="relative flex flex-col items-center gap-5 py-2">
              <div className="absolute bottom-4 top-4 w-1 rounded-full bg-slate-700" />
              {unit.lessons.map((lesson, lIdx) => {
                const done = completedLessons.includes(lesson.id)
                const unlocked = isLessonUnlocked(lesson.id)
                const offset = lIdx % 2 === 0 ? '-translate-x-8' : 'translate-x-8'

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => unlocked && onStartLesson(lesson.id)}
                    className={`relative z-10 flex ${offset} flex-col items-center gap-2 transition active:scale-95 disabled:opacity-60`}
                  >
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-lg ${
                        done
                          ? 'border-yellow-400 bg-slovo-gold text-slate-900'
                          : unlocked
                            ? 'border-slovo-green bg-slovo-green text-white'
                            : 'border-slate-600 bg-slate-700 text-slate-400'
                      }`}
                    >
                      {done ? (
                        <Check size={28} strokeWidth={3} />
                      ) : unlocked ? (
                        <Star size={28} fill="currentColor" />
                      ) : (
                        <Lock size={24} />
                      )}
                    </div>
                    <div className="max-w-[9rem] text-center">
                      <p className="text-sm font-bold text-white">{lesson.title}</p>
                      <p className="text-xs text-slate-400">{lesson.xp} XP</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
