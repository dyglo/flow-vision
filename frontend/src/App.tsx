import { useMemo, useState } from 'react'
import { PrimaryNav } from './components/layout/PrimaryNav'
import {
  BatchProcessing,
  LiveDetection,
  ModelManagement,
  SingleImage,
  VideoProcessing,
} from './pages'

const tabs = [
  { id: 'single', label: 'Single Image', component: SingleImage },
  { id: 'batch', label: 'Batch Processing', component: BatchProcessing },
  { id: 'video', label: 'Video Processing', component: VideoProcessing },
  { id: 'live', label: 'Live Detection', component: LiveDetection },
  { id: 'model', label: 'Model Management', component: ModelManagement },
]

const heroChips = [
  { label: 'CPU', value: 'CPU' },
  { label: 'Confidence', value: '25%' },
  { label: 'Model', value: 'yolo11n' },
  { label: 'Max Size', value: '640px' },
]

type Tab = (typeof tabs)[number]

function App() {
  const [activeTab, setActiveTab] = useState<Tab['id']>('video')

  const ActivePage = useMemo(() => {
    const current = tabs.find((tab) => tab.id === activeTab)
    return current?.component ?? SingleImage
  }, [activeTab])

  return (
    <div className="min-h-screen bg-transparent pb-24 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-12">
        <header className="space-y-10 rounded-3xl bg-white/80 p-12 shadow-card backdrop-blur">
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-card">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.75a5.25 5.25 0 110 10.5m0-10.5c-2.9 0-5.25 2.35-5.25 5.25m5.25-5.25c2.9 0 5.25 2.35 5.25 5.25"
                />
                <circle cx="12" cy="12" r="1.75" />
              </svg>
            </span>
            <div className="space-y-2">
              <h1 className="font-display text-4xl font-semibold tracking-tight">
                VisionFlow
              </h1>
              <p className="max-w-2xl text-base text-slate-600">
                Advanced AI-powered object detection with custom models, batch pipelines, and
                detailed analytics. Scaffolded for phased delivery across single image, video, and
                live workloads.
              </p>
            </div>
          </div>

          <dl className="flex flex-wrap justify-center gap-3">
            {heroChips.map((chip) => (
              <div
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
              >
                <span className="text-slate-400">{chip.label}</span>
                <span className="text-slate-900">{chip.value}</span>
              </div>
            ))}
          </dl>

          <PrimaryNav
            items={tabs.map((tab) => ({
              id: tab.id,
              label: tab.label,
              active: tab.id === activeTab,
              onSelect: setActiveTab,
            }))}
          />
        </header>

        <main className="space-y-10">
          <ActivePage />
        </main>
      </div>
    </div>
  )
}

export default App
