import { Heart } from 'lucide-react'
import { MAX_HEARTS } from '../../store/progressStore'

interface Props {
  hearts: number
  compact?: boolean
}

export function HeartsDisplay({ hearts, compact }: Props) {
  return (
    <div className={`flex items-center gap-1 ${compact ? '' : 'rounded-full bg-slate-800/80 px-3 py-1.5'}`}>
      <Heart size={compact ? 18 : 20} className="fill-slovo-heart text-slovo-heart" />
      <span className="text-sm font-extrabold text-slovo-heart">
        {hearts}/{MAX_HEARTS}
      </span>
    </div>
  )
}
