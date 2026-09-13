import { useEffect, useState } from 'react'
import { BottomTabs, type TabId } from './components/layout/BottomTabs'
import { LearningPath } from './components/home/LearningPath'
import { PracticeView } from './components/practice/PracticeView'
import { ProfileView } from './components/profile/ProfileView'
import { LessonSession } from './components/lesson/LessonSession'
import { OutOfHearts } from './components/lesson/OutOfHearts'
import { useProgressStore } from './store/progressStore'

export default function App() {
  const [tab, setTab] = useState<TabId>('learn')
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [showOutOfHearts, setShowOutOfHearts] = useState(false)
  const refillHeartsIfNeeded = useProgressStore((s) => s.refillHeartsIfNeeded)
  const refillHeartsNow = useProgressStore((s) => s.refillHeartsNow)
  const getHeartsDisplay = useProgressStore((s) => s.getHeartsDisplay)

  useEffect(() => {
    refillHeartsIfNeeded()
    const t = setInterval(() => refillHeartsIfNeeded(), 60_000)
    return () => clearInterval(t)
  }, [refillHeartsIfNeeded])

  const startLesson = (lessonId: string) => {
    refillHeartsIfNeeded()
    if (getHeartsDisplay() <= 0) {
      setShowOutOfHearts(true)
      return
    }
    setActiveLessonId(lessonId)
  }

  if (showOutOfHearts) {
    return (
      <OutOfHearts
        onRefill={() => {
          refillHeartsNow()
          setShowOutOfHearts(false)
        }}
        onExit={() => setShowOutOfHearts(false)}
      />
    )
  }

  if (activeLessonId) {
    return (
      <LessonSession
        lessonId={activeLessonId}
        onExit={() => setActiveLessonId(null)}
      />
    )
  }

  return (
    <div className="min-h-full bg-slate-900 text-slate-100">
      {tab === 'learn' && <LearningPath onStartLesson={startLesson} />}
      {tab === 'practice' && (
        <PracticeView onNeedHearts={() => setShowOutOfHearts(true)} />
      )}
      {tab === 'profile' && <ProfileView />}
      <BottomTabs active={tab} onChange={setTab} />
    </div>
  )
}
