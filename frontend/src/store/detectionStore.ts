import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { YOLOV11_CLASSES } from '@/constants/yoloClasses'
import type { DetectionResponse } from '@/types/detection'

const ALL_CLASSES = [...YOLOV11_CLASSES]

type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error'

type DetectionState = {
  selectedClasses: string[]
  processingStatus: ProcessingStatus
  results: DetectionResponse | null
  error: string | null
  previewUrl: string | null
}

type DetectionActions = {
  setSelectedClasses: (classes: string[]) => void
  selectAllClasses: () => void
  deselectAllClasses: () => void
  setProcessingStatus: (status: ProcessingStatus) => void
  setResults: (results: DetectionResponse | null) => void
  setError: (error: string | null) => void
  setPreviewUrl: (url: string | null) => void
  reset: () => void
}

type DetectionStore = DetectionState & DetectionActions

const SELECTED_CLASSES_STORAGE_KEY = 'visionflow:selected-classes'

export const useDetectionStore = create<DetectionStore>()(
  persist(
    (set) => ({
      selectedClasses: [...ALL_CLASSES],
      processingStatus: 'idle',
      results: null,
      error: null,
      previewUrl: null,
      setSelectedClasses: (classes) =>
        set((state) => {
          const normalized = normalizeClasses(classes)
          return arraysEqual(state.selectedClasses, normalized)
            ? state
            : {
                ...state,
                selectedClasses: normalized,
              }
        }),
      selectAllClasses: () =>
        set((state) =>
          arraysEqual(state.selectedClasses, ALL_CLASSES)
            ? state
            : { ...state, selectedClasses: [...ALL_CLASSES] },
        ),
      deselectAllClasses: () =>
        set((state) => (state.selectedClasses.length === 0 ? state : { ...state, selectedClasses: [] })),
      setProcessingStatus: (status) => set((state) => ({ ...state, processingStatus: status })),
      setResults: (results) => set((state) => ({ ...state, results })),
      setError: (error) => set((state) => ({ ...state, error })),
      setPreviewUrl: (url) => set((state) => ({ ...state, previewUrl: url })),
      reset: () =>
        set({
          selectedClasses: [...ALL_CLASSES],
          processingStatus: 'idle',
          results: null,
          error: null,
          previewUrl: null,
        }),
    }),
    {
      name: SELECTED_CLASSES_STORAGE_KEY,
      partialize: (state) => ({ selectedClasses: state.selectedClasses }),
    },
  ),
)

export const selectSelectedClasses = (state: DetectionStore) => state.selectedClasses
export const selectProcessingStatus = (state: DetectionStore) => state.processingStatus
export const selectResults = (state: DetectionStore) => state.results
export const selectError = (state: DetectionStore) => state.error
export const selectPreviewUrl = (state: DetectionStore) => state.previewUrl

function normalizeClasses(classes: string[]): string[] {
  const unique = Array.from(new Set(classes.filter(Boolean)))
  const getIndex = (value: string) => {
    const idx = YOLOV11_CLASSES.indexOf(value as (typeof YOLOV11_CLASSES)[number])
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
  }
  return unique.sort((a, b) => getIndex(a) - getIndex(b))
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}
