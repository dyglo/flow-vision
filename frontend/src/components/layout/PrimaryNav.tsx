import type { ReactNode } from 'react'

type NavItem = {
  id: string
  label: string
  icon?: ReactNode
  active: boolean
  onSelect: (id: string) => void
}

const baseChipStyles =
  'inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium transition-all'

export function PrimaryNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="flex flex-wrap items-center justify-center gap-3 rounded-full bg-white/80 p-2 shadow-card backdrop-blur">
      {items.map(({ id, label, icon, active, onSelect }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={`${baseChipStyles} ${
            active
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
              : 'bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600'
          }`}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
