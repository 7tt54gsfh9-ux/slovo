import { curriculum, getAllLessonIds, getLessonById } from '../../../content/curriculum'
import { useProgressStore } from '../../../store/progressStore'
import type { Exercise } from '../../../types/lesson'
import { useMemo, useState } from 'react'
import { MultipleChoice } from '../../exercises/MultipleChoice'
import { WordMatch } from '../../exercises/WordMatch'
import { FillBlank } from '../../exercises/FillBlank'
import { TranslateTiles } from '../../exercises/TranslateTiles'
import { MatchPairs } from '../../exercises/MatchPairs'
import { SpeakButton } from '../../ui/SpeakButton'

interface Props {
  onExit: () => void
  onNeedHearts: () => void
}

function pickPracticeExercises(completed: string[], count = 8): Exercise[] {
  const pool: Exercise[] = []
  const ids = completed.length ? completed : [getAllLessonIds()[0]]
  for (const id of ids) {
    const found = getLessonById(id)
    if (found) pool.push(...found.lesson.exercises.filter((e) => e.type !== 'say_this'))
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(count, pool.length))
}

export function MixedReview({ onExit, onNeedHearts }: Props) {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const loseHeart = useProgressStore((s) => s.loseHeart)
  const getHeartsDisplay = useProgressStore((s) => s.getHeartsDisplay)
  const earnXp = useProgressStore((s) => s.earnXp)

  const [session, setSession] = useState<Exercise[] | null>(null)
  const [index, setIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [tileWords, setTileWords] = useState<string[]>([])
  const [tilesReady, setTilesReady] = useState(false)
  const [pairsDone, setPairsDone] = useState(false)
  const [pairsCorrect, setPairsCorrect] = useState(true)
  const [done, setDone] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const start = () => {
    if (getHeartsDisplay() <= 0) {
      onNeedHearts()
      return
    }
    setSession(pickPracticeExercises(completedLessons))
    setIndex(0)
    setFeedback('idle')
    setSelectedIndex(null)
    setDone(false)
    setCorrectCount(0)
    setPairsDone(false)
    setTilesReady(false)
  }

  const exercise = session?.[index]

  const canCheck = useMemo(() => {
    if (!exercise || feedback !== 'idle') return false
    if (exercise.type === 'translate_tiles') return tilesReady
    if (exercise.type === 'match_pairs') return pairsDone
    if (exercise.type === 'say_this') return false
    return selectedIndex !== null
  }, [exercise, feedback, selectedIndex, tilesReady, pairsDone])

  const handleCheck = () => {
    if (!exercise) return
    let ok = false
    if (exercise.type === 'match_pairs') ok = pairsCorrect
    else if (exercise.type === 'translate_tiles') {
      ok =
        tileWords.length === exercise.answer.length &&
        tileWords.every((w, i) => w === exercise.answer[i])
    } else if (
      exercise.type === 'multiple_choice' ||
      exercise.type === 'word_match' ||
      exercise.type === 'fill_blank'
    ) {
      ok = selectedIndex === exercise.correctIndex
    }
    setFeedback(ok ? 'correct' : 'wrong')
    if (ok) setCorrectCount((c) => c + 1)
    else {
      loseHeart()
      if (getHeartsDisplay() <= 0) onNeedHearts()
    }
  }

  const handleContinue = () => {
    if (!session) return
    if (index >= session.length - 1) {
      earnXp(10)
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
    setFeedback('idle')
    setSelectedIndex(null)
    setTileWords([])
    setTilesReady(false)
    setPairsDone(false)
    setPairsCorrect(true)
  }

  if (done && session) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-4 px-6 pb-28 text-center">
        <div className="text-6xl">💪</div>
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-2xl font-black">Výborne!</h2>
          <SpeakButton text="Výborne!" size="lg" label="Pronounce Výborne" />
        </div>
        <p className="text-slate-300">Practice done!</p>
        <p className="text-slate-400">
          {correctCount}/{session.length} correct · +10 XP
        </p>
        <button
          type="button"
          onClick={() => {
            setSession(null)
            setDone(false)
          }}
          className="rounded-2xl bg-slovo-green px-8 py-3 font-extrabold text-slate-900"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-2xl border-2 border-slate-600 px-8 py-3 font-bold text-slate-200"
        >
          Back to games
        </button>
      </div>
    )
  }

  if (!session) {
    const unitsDone = curriculum.filter((u) =>
      u.lessons.every((l) => completedLessons.includes(l.id)),
    ).length

    return (
      <div className="mx-auto max-w-lg px-4 pb-28 pt-6">
        <button
          type="button"
          onClick={onExit}
          className="mb-4 rounded-xl px-3 py-2 text-sm font-bold text-slate-400 hover:text-white"
        >
          ← Back to games
        </button>
        <h1 className="text-2xl font-black text-white">Mixed Review</h1>
        <p className="mt-2 text-slate-400">
          Classic exercise mix from lessons you&apos;ve unlocked.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
          <p className="text-sm text-slate-400">
            Completed lessons:{' '}
            {completedLessons.filter((id) => id !== 'practice-bonus').length}
          </p>
          <p className="text-sm text-slate-400">Units fully done: {unitsDone}</p>
          <p className="mt-2 text-xs text-slate-500">Uses lesson hearts on wrong answers.</p>
          <button
            type="button"
            onClick={start}
            className="mt-5 w-full rounded-2xl bg-slovo-sky py-4 text-lg font-extrabold text-white"
          >
            Start review
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-28 pt-4">
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full bg-slovo-sky transition-all"
          style={{ width: `${((index + 1) / session.length) * 100}%` }}
        />
      </div>
      <div className="flex-1">
        {exercise?.type === 'multiple_choice' && (
          <MultipleChoice
            prompt={exercise.prompt}
            promptHint={exercise.promptHint}
            options={exercise.options}
            correctIndex={exercise.correctIndex}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            showResult={feedback !== 'idle'}
            disabled={feedback !== 'idle'}
          />
        )}
        {exercise?.type === 'word_match' && (
          <WordMatch
            prompt={exercise.prompt}
            promptHint={exercise.promptHint}
            options={exercise.options}
            correctIndex={exercise.correctIndex}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            showResult={feedback !== 'idle'}
            disabled={feedback !== 'idle'}
          />
        )}
        {exercise?.type === 'fill_blank' && (
          <FillBlank
            sentence={exercise.sentence}
            translation={exercise.translation}
            promptHint={exercise.promptHint}
            options={exercise.options}
            correctIndex={exercise.correctIndex}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            showResult={feedback !== 'idle'}
            disabled={feedback !== 'idle'}
          />
        )}
        {exercise?.type === 'translate_tiles' && (
          <TranslateTiles
            prompt={exercise.prompt}
            promptHint={exercise.promptHint}
            answer={exercise.answer}
            distractors={exercise.distractors}
            onChange={(w, c) => {
              setTileWords(w)
              setTilesReady(c)
            }}
            showResult={feedback !== 'idle'}
            disabled={feedback !== 'idle'}
            resetKey={exercise.id + index}
          />
        )}
        {exercise?.type === 'match_pairs' && (
          <MatchPairs
            prompt={exercise.prompt}
            pairs={exercise.pairs}
            onComplete={(c) => {
              setPairsDone(true)
              setPairsCorrect(c)
            }}
            showResult={feedback !== 'idle'}
            disabled={feedback !== 'idle'}
            resetKey={exercise.id + index}
          />
        )}
      </div>
      <div className="mt-4">
        {feedback === 'idle' ? (
          <button
            type="button"
            disabled={!canCheck}
            onClick={handleCheck}
            className="w-full rounded-2xl bg-slovo-green py-4 font-extrabold uppercase text-slate-900 disabled:bg-slate-700 disabled:text-slate-500"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            onClick={handleContinue}
            className={`w-full rounded-2xl py-4 font-extrabold uppercase ${
              feedback === 'correct' ? 'bg-slovo-green text-slate-900' : 'bg-slovo-red text-white'
            }`}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
