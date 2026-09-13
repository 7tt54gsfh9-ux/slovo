import { BookOpen, Dumbbell, User } from 'lucide-react'

export type TabId = 'learn' | 'practice' | 'profile'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: Dumbbell },
  { id: 'profile', label: 'Profile', icon: User },
]

export function BottomTabs({ active, onChange }: Props) {
  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700/80 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-xs font-bold transition ${
                isActive ? 'text-slovo-green' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-slovo-green' : ''}
              />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
