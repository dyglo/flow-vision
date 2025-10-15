import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Check } from 'lucide-react'
import clsx from 'clsx'

import { YOLOV11_CLASSES } from '@/constants/yoloClasses'
import { getClassColor } from '@/utils/colors'
import { useDetectionStore, selectSelectedClasses } from '@/store/detectionStore'

const FILTER_PLACEHOLDER = 'Search classes...'

export function ClassSelector() {
  const selectedClasses = useDetectionStore(selectSelectedClasses)
  const setSelectedClasses = useDetectionStore((state) => state.setSelectedClasses)
  const selectAllClasses = useDetectionStore((state) => state.selectAllClasses)
  const deselectAllClasses = useDetectionStore((state) => state.deselectAllClasses)
  const [searchTerm, setSearchTerm] = useState('')
  const allSelected = selectedClasses.length === YOLOV11_CLASSES.length

  const filteredClasses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return YOLOV11_CLASSES
    return YOLOV11_CLASSES.filter((className) => className.toLowerCase().includes(term))
  }, [searchTerm])

  const toggleClass = (className: string) => {
    const exists = selectedClasses.includes(className)
    if (exists) {
      setSelectedClasses(selectedClasses.filter((name) => name !== className))
    } else {
      const updated = [...selectedClasses, className]
      setSelectedClasses(updated)
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-card backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Class Selection</h3>
          <p className="text-sm text-slate-500">Filter detections to focus on specific objects.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => selectAllClasses()}
            disabled={allSelected}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => deselectAllClasses()}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-primary-200 hover:text-primary-600"
          >
            Deselect All
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={FILTER_PLACEHOLDER}
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-600 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          aria-label="Filter classes"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
        <AnimatePresence initial={false}>
          {filteredClasses.map((className) => {
            const isSelected = selectedClasses.includes(className)
            return (
              <motion.button
                layout
                type="button"
                key={className}
                onClick={() => toggleClass(className)}
                className={clsx(
                  'flex w-full items-center justify-between rounded-2xl border px-4 py-2 text-left transition-all',
                  isSelected
                    ? 'border-transparent bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-card'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600',
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getClassColor(className) }}
                  />
                  <span className="text-sm font-medium capitalize">{className}</span>
                </span>
                <span
                  className={clsx(
                    'flex h-5 w-5 items-center justify-center rounded-full border text-xs',
                    isSelected ? 'border-white text-white/90' : 'border-slate-200 text-slate-400',
                  )}
                >
                  {isSelected ? <Check className="h-3 w-3" /> : null}
                </span>
              </motion.button>
            )
          })}
          {filteredClasses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-500"
            >
              No classes match "{searchTerm}".
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="flex items-center justify-between text-xs text-slate-400">
        <span>{selectedClasses.length} classes selected</span>
        <span>{YOLOV11_CLASSES.length} total classes</span>
      </footer>
    </div>
  )
}
