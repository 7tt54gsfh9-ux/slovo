import { Heart } from 'lucide-react'

interface Props {
  onRefill: () => void
  onExit: () => void
}

export function OutOfHearts({ onRefill, onExit }: Props) {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <Heart size={72} className="fill-slate-600 text-slate-600" />
      <h1 className="text-3xl font-black text-white">Out of hearts</h1>
      <p className="text-slate-400">
        Hearts refill over time (about 30 minutes each). For this demo you can
        refill instantly and keep practicing.
      </p>
      <button
        type="button"
        onClick={onRefill}
        className="w-full max-w-xs rounded-2xl bg-slovo-heart py-4 text-lg font-extrabold text-white"
      >
        Refill hearts
      </button>
      <button
        type="button"
        onClick={onExit}
        className="text-sm font-semibold text-slate-400 underline"
      >
        Back to path
      </button>
    </div>
  )
}
