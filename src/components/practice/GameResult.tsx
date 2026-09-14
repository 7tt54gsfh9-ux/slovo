interface Props {
  title: string
  subtitle?: string
  scoreLabel: string
  xpEarned: number
  won: boolean
  emoji?: string
  onPlayAgain: () => void
  onBack: () => void
}

export function GameResult({
  title,
  subtitle,
  scoreLabel,
  xpEarned,
  won,
  emoji,
  onPlayAgain,
  onBack,
}: Props) {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-4 px-6 pb-28 text-center animate-bounce-in">
      <div className="text-6xl">{emoji ?? (won ? '🎉' : '💪')}</div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      {subtitle && <p className="text-slate-300">{subtitle}</p>}
      <p className="text-slate-400">{scoreLabel}</p>
      <p className="rounded-full bg-slovo-gold/20 px-4 py-1.5 text-sm font-bold text-slovo-gold">
        +{xpEarned} XP
      </p>
      <div className="mt-4 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full rounded-2xl bg-slovo-green py-4 text-lg font-extrabold text-slate-900"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-2xl border-2 border-slate-600 bg-slate-800 py-3 font-bold text-slate-200"
        >
          Back to games
        </button>
      </div>
    </div>
  )
}
