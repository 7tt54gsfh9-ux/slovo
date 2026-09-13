import { SpeakButton } from '../ui/SpeakButton'

interface Props {
  lessonTitle: string
  xp: number
  correctCount: number
  total: number
  onContinue: () => void
}

export function LessonComplete({
  lessonTitle,
  xp,
  correctCount,
  total,
  onContinue,
}: Props) {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="animate-bounce-in text-7xl">🎉</div>
      <div className="flex items-center justify-center gap-3">
        <h1 className="text-3xl font-black text-white">Výborne!</h1>
        <SpeakButton text="Výborne!" size="lg" label="Pronounce Výborne" />
      </div>
      <p className="text-lg text-slate-300">Lesson complete — {lessonTitle}</p>
      <div className="flex gap-4">
        <div className="rounded-2xl bg-amber-950/50 px-6 py-4">
          <p className="text-3xl font-black text-amber-400">+{xp}</p>
          <p className="text-sm font-semibold text-amber-200/80">XP</p>
        </div>
        <div className="rounded-2xl bg-green-950/50 px-6 py-4">
          <p className="text-3xl font-black text-slovo-green-light">
            {correctCount}/{total}
          </p>
          <p className="text-sm font-semibold text-green-200/80">Correct</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-4 w-full max-w-xs rounded-2xl bg-slovo-green py-4 text-lg font-extrabold uppercase text-slate-900"
      >
        Continue
      </button>
    </div>
  )
}
