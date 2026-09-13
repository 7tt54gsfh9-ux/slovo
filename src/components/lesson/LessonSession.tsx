import { useCallback, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { getLessonById } from '../../content/curriculum'
import type { Exercise } from '../../types/lesson'
import { useProgressStore } from '../../store/progressStore'
import { MultipleChoice } from '../exercises/MultipleChoice'
import { WordMatch } from '../exercises/WordMatch'
import { FillBlank } from '../exercises/FillBlank'
import { TranslateTiles } from '../exercises/TranslateTiles'
import { MatchPairs } from '../exercises/MatchPairs'
import { SayThis } from '../exercises/SayThis'
import { LessonComplete } from './LessonComplete'
import { OutOfHearts } from './OutOfHearts'
import { HeartsDisplay } from '../layout/HeartsDisplay'
import { SpeakButton } from '../ui/SpeakButton'
import { resolveSlovakSpeech } from '../../lib/speak'

interface Props {
  lessonId: string
  onExit: () => void
}

type Feedback = 'idle' | 'correct' | 'wrong'

export function LessonSession({ lessonId, onExit }: Props) {
  const found = getLessonById(lessonId)
  const loseHeart = useProgressStore((s) => s.loseHeart)
  const completeLesson = useProgressStore((s) => s.completeLesson)
  const getHeartsDisplay = useProgressStore((s) => s.getHeartsDisplay)
  const refillHeartsIfNeeded = useProgressStore((s) => s.refillHeartsIfNeeded)
  const refillHeartsNow = useProgressStore((s) => s.refillHeartsNow)

  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>('idle')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tileWords, setTileWords] = useState<string[]>([])
  const [tilesReady, setTilesReady] = useState(false)
  const [pairsDone, setPairsDone] = useState(false)
  const [pairsCorrect, setPairsCorrect] = useState(true)
  const [finished, setFinished] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const lesson = found?.lesson
  const exercises = lesson?.exercises ?? []
  const exercise: Exercise | undefined = exercises[index]
  const progress = exercises.length ? ((index + (feedback !== 'idle' ? 1 : 0)) / exercises.length) * 100 : 0

  const hearts = getHeartsDisplay()

  const checkChoice = (correctIdx: number, chosen: number) => {
    const ok = chosen === correctIdx
    setFeedback(ok ? 'correct' : 'wrong')
    if (ok) setCorrectCount((c) => c + 1)
    else {
      refillHeartsIfNeeded()
      loseHeart()
      if (getHeartsDisplay() <= 0) setBlocked(true)
    }
  }

  const onTileChange = useCallback((words: string[], complete: boolean) => {
    setTileWords(words)
    setTilesReady(complete)
  }, [])

  const onPairsComplete = useCallback((correct: boolean) => {
    setPairsDone(true)
    setPairsCorrect(correct)
  }, [])

  const canCheck = useMemo(() => {
    if (!exercise || feedback !== 'idle') return false
    switch (exercise.type) {
      case 'multiple_choice':
      case 'word_match':
      case 'fill_blank':
        return selectedIndex !== null
      case 'translate_tiles':
        return tilesReady
      case 'match_pairs':
        return pairsDone
      case 'say_this':
        return false
      default:
        return false
    }
  }, [exercise, feedback, selectedIndex, tilesReady, pairsDone])

  const handleCheck = () => {
    if (!exercise || feedback !== 'idle') return

    if (exercise.type === 'match_pairs') {
      setFeedback(pairsCorrect ? 'correct' : 'wrong')
      if (pairsCorrect) setCorrectCount((c) => c + 1)
      else {
        loseHeart()
        if (getHeartsDisplay() <= 0) setBlocked(true)
      }
      return
    }

    if (exercise.type === 'translate_tiles') {
      const ok =
        tileWords.length === exercise.answer.length &&
        tileWords.every((w, i) => w === exercise.answer[i])
      setFeedback(ok ? 'correct' : 'wrong')
      if (ok) setCorrectCount((c) => c + 1)
      else {
        loseHeart()
        if (getHeartsDisplay() <= 0) setBlocked(true)
      }
      return
    }

    if (
      exercise.type === 'multiple_choice' ||
      exercise.type === 'word_match' ||
      exercise.type === 'fill_blank'
    ) {
      if (selectedIndex === null) return
      checkChoice(exercise.correctIndex, selectedIndex)
    }
  }

  const handleContinue = () => {
    if (blocked) return
    if (index >= exercises.length - 1) {
      if (lesson) {
        completeLesson(lesson.id, lesson.xp)
      }
      setFinished(true)
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

  if (!found || !lesson) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6">
        <p>Lesson not found.</p>
        <button type="button" onClick={onExit} className="text-slovo-green">
          Go back
        </button>
      </div>
    )
  }

  if (blocked || (hearts <= 0 && feedback === 'wrong')) {
    return (
      <OutOfHearts
        onRefill={() => {
          refillHeartsNow()
          setBlocked(false)
          setFeedback('idle')
          setSelectedIndex(null)
          setTilesReady(false)
          setPairsDone(false)
        }}
        onExit={onExit}
      />
    )
  }

  if (finished) {
    return (
      <LessonComplete
        lessonTitle={lesson.title}
        xp={lesson.xp}
        correctCount={correctCount}
        total={exercises.length}
        onContinue={onExit}
      />
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-slate-900">
      <header className="flex items-center gap-3 px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={onExit}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Exit lesson"
        >
          <X size={24} />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-slovo-green transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <HeartsDisplay hearts={getHeartsDisplay()} compact />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
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
            onChange={onTileChange}
            showResult={feedback !== 'idle'}
            disabled={feedback !== 'idle'}
            resetKey={exercise.id}
          />
        )}
        {exercise?.type === 'match_pairs' && (
          <MatchPairs
            prompt={exercise.prompt}
            pairs={exercise.pairs}
            onComplete={onPairsComplete}
            showResult={feedback !== 'idle'}
            disabled={feedback !== 'idle'}
            resetKey={exercise.id}
          />
        )}

        {exercise?.type === 'say_this' && (
          <SayThis
            target={exercise.target}
            meaning={exercise.meaning}
            acceptedAnswers={exercise.acceptedAnswers}
            onFinish={(result) => {
              if (result === 'correct') {
                setFeedback('correct')
                setCorrectCount((c) => c + 1)
              } else {
                // Skipped — continue without counting as correct; no extra heart
                setFeedback('wrong')
              }
            }}
            onWrongAttempt={() => {
              refillHeartsIfNeeded()
              loseHeart()
              if (getHeartsDisplay() <= 0) setBlocked(true)
            }}
            showResult={feedback !== 'idle'}
            disabled={feedback !== 'idle'}
            resetKey={exercise.id}
          />
        )}
      </div>

      <div className="border-t border-slate-800 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {feedback === 'idle' ? (
          exercise?.type === 'say_this' ? (
            <p className="py-2 text-center text-sm text-slate-500">
              Use the mic above — or skip if speech isn’t available
            </p>
          ) : (
            <button
              type="button"
              disabled={!canCheck}
              onClick={handleCheck}
              className="w-full rounded-2xl bg-slovo-green py-4 text-lg font-extrabold uppercase tracking-wide text-slate-900 shadow-lg transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
            >
              Check
            </button>
          )
        ) : (
          <div
            className={`animate-bounce-in rounded-2xl p-4 ${
              feedback === 'correct' ? 'bg-green-950/80' : 'bg-red-950/80'
            }`}
          >
            <p
              className={`mb-3 text-xl font-extrabold ${
                feedback === 'correct' ? 'text-slovo-green-light' : 'text-red-300'
              }`}
            >
              {feedback === 'correct'
                ? 'Correct!'
                : exercise?.type === 'say_this'
                  ? 'Skipped'
                  : 'Not quite…'}
            </p>
            {exercise && (() => {
              const answer = correctAnswerSpeak(exercise)
              const label = correctAnswerText(exercise)
              // Show answer + TTS on wrong; on correct still allow pronounce when Slovak
              if (feedback === 'wrong') {
                return (
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                    <span className="flex-1">{label}</span>
                    {answer && <SpeakButton text={answer} size="sm" />}
                  </div>
                )
              }
              if (answer) {
                return (
                  <div className="mb-3 flex justify-end">
                    <SpeakButton text={answer} size="sm" />
                  </div>
                )
              }
              return null
            })()}
            <button
              type="button"
              onClick={handleContinue}
              className={`w-full rounded-2xl py-4 text-lg font-extrabold uppercase tracking-wide text-slate-900 ${
                feedback === 'correct' ? 'bg-slovo-green' : 'bg-slovo-red text-white'
              }`}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function correctAnswerText(ex: Exercise): string {
  switch (ex.type) {
    case 'multiple_choice':
    case 'word_match':
    case 'fill_blank':
      return `Answer: ${ex.options[ex.correctIndex]}`
    case 'translate_tiles':
      return `Answer: ${ex.answer.join(' ')}`
    case 'match_pairs':
      return 'Keep matching — practice makes perfect!'
    case 'say_this':
      return `Say: ${ex.target}`
    default:
      return ''
  }
}

function correctAnswerSpeak(ex: Exercise): string | null {
  switch (ex.type) {
    case 'multiple_choice':
    case 'word_match':
    case 'fill_blank':
      return resolveSlovakSpeech(ex.options[ex.correctIndex])
    case 'translate_tiles':
      return resolveSlovakSpeech(ex.answer.join(' '))
    case 'match_pairs':
      return null
    case 'say_this':
      return resolveSlovakSpeech(ex.target)
    default:
      return null
  }
}
