import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAllLessonIds } from '../content/curriculum'

const MAX_HEARTS = 5
const HEART_REFILL_MS = 30 * 60 * 1000 // 30 minutes per heart
const DAILY_GOAL_XP = 30

interface ProgressState {
  xp: number
  streak: number
  lastPracticeDate: string | null
  completedLessons: string[]
  hearts: number
  lastHeartLossAt: number | null
  dailyXp: number
  dailyXpDate: string | null
  completeLesson: (lessonId: string, xpEarned: number) => void
  earnXp: (amount: number) => void
  loseHeart: () => void
  refillHeartsIfNeeded: () => void
  refillHeartsNow: () => void
  isLessonUnlocked: (lessonId: string) => boolean
  getHeartsDisplay: () => number
  getDailyProgress: () => { current: number; goal: number }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function computeHearts(hearts: number, lastHeartLossAt: number | null): number {
  if (hearts >= MAX_HEARTS || !lastHeartLossAt) return hearts
  const elapsed = Date.now() - lastHeartLossAt
  const gained = Math.floor(elapsed / HEART_REFILL_MS)
  return Math.min(MAX_HEARTS, hearts + gained)
}

function nextStreak(lastPracticeDate: string | null, streak: number): number {
  const today = todayKey()
  if (lastPracticeDate === today) return Math.max(streak, 1)
  if (lastPracticeDate === yesterdayKey()) return streak + 1
  return 1
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      lastPracticeDate: null,
      completedLessons: [],
      hearts: MAX_HEARTS,
      lastHeartLossAt: null,
      dailyXp: 0,
      dailyXpDate: null,

      refillHeartsIfNeeded: () => {
        const { hearts, lastHeartLossAt } = get()
        const next = computeHearts(hearts, lastHeartLossAt)
        if (next !== hearts) {
          const gained = next - hearts
          set({
            hearts: next,
            lastHeartLossAt:
              next >= MAX_HEARTS
                ? null
                : (lastHeartLossAt ?? Date.now()) + gained * HEART_REFILL_MS,
          })
        }
      },

      refillHeartsNow: () => set({ hearts: MAX_HEARTS, lastHeartLossAt: null }),

      getHeartsDisplay: () => {
        const { hearts, lastHeartLossAt } = get()
        return computeHearts(hearts, lastHeartLossAt)
      },

      getDailyProgress: () => {
        const { dailyXp, dailyXpDate } = get()
        const today = todayKey()
        return {
          current: dailyXpDate === today ? dailyXp : 0,
          goal: DAILY_GOAL_XP,
        }
      },

      loseHeart: () => {
        get().refillHeartsIfNeeded()
        const hearts = get().getHeartsDisplay()
        if (hearts <= 0) return
        const next = hearts - 1
        set({
          hearts: next,
          lastHeartLossAt: next < MAX_HEARTS ? Date.now() : null,
        })
      },

      isLessonUnlocked: (lessonId: string) => {
        const ids = getAllLessonIds()
        const idx = ids.indexOf(lessonId)
        if (idx <= 0) return true
        const { completedLessons } = get()
        const prev = ids[idx - 1]
        return completedLessons.includes(prev) || completedLessons.includes(lessonId)
      },

      earnXp: (amount: number) => {
        const state = get()
        const today = todayKey()
        const streak = nextStreak(state.lastPracticeDate, state.streak)
        const dailyXp = state.dailyXpDate === today ? state.dailyXp : 0
        set({
          xp: state.xp + amount,
          streak,
          lastPracticeDate: today,
          dailyXp: dailyXp + amount,
          dailyXpDate: today,
        })
      },

      completeLesson: (lessonId: string, xpEarned: number) => {
        const state = get()
        state.refillHeartsIfNeeded()
        const today = todayKey()
        const already = state.completedLessons.includes(lessonId)
        const streak = nextStreak(state.lastPracticeDate, state.streak)
        const dailyXp = state.dailyXpDate === today ? state.dailyXp : 0

        set({
          xp: state.xp + xpEarned,
          streak,
          lastPracticeDate: today,
          completedLessons: already
            ? state.completedLessons
            : [...state.completedLessons, lessonId],
          dailyXp: dailyXp + xpEarned,
          dailyXpDate: today,
        })
      },
    }),
    {
      name: 'slovo-progress',
      version: 1,
    },
  ),
)

export { MAX_HEARTS, HEART_REFILL_MS, DAILY_GOAL_XP }
