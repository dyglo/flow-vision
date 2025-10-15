import { useMemo } from 'react'
import { Download, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

import type { DetectionResponse } from '@/types/detection'
import { BoundingBoxOverlay } from './BoundingBoxOverlay'
import { getClassColor } from '@/utils/colors'

type DetectionResultsProps = {
  response: DetectionResponse
  previewUrl: string
  onDownload: () => Promise<void>
}

export function DetectionResults({ response, previewUrl, onDownload }: DetectionResultsProps) {
  const classCounts = useMemo(() => {
    const counts = response.payload.detections.reduce<Record<string, number>>((acc, detection) => {
      acc[detection.class_name] = (acc[detection.class_name] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .map(([className, count]) => ({ className, count, color: getClassColor(className) }))
      .sort((a, b) => b.count - a.count)
  }, [response.payload.detections])

  const metrics = useMemo(
    () => [
      {
        label: 'Processing Time',
        value: `${(response.summary.processing_ms / 1000).toFixed(2)}s`,
      },
      {
        label: 'Resolution',
        value: `${response.metadata.width} × ${response.metadata.height}`,
      },
      {
        label: 'Channels',
        value: response.metadata.channels === 3 ? 'RGB (3)' : String(response.metadata.channels),
      },
    ],
    [response.summary.processing_ms, response.metadata.width, response.metadata.height, response.metadata.channels],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Detection Results</h3>
          <p className="text-sm text-slate-500">
            {response.summary.total_detections} detections in {(response.summary.processing_ms / 1000).toFixed(2)}s
          </p>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-card transition hover:brightness-105"
        >
          <Download className="h-4 w-4" />
          Download Annotated Image
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <BoundingBoxOverlay
          imageUrl={previewUrl}
          detections={response.payload.detections}
          metadata={response.metadata}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-card backdrop-blur"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-primary-50 p-4 text-primary-600">
            <Sparkles className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">Model Insights</p>
              <p className="text-xs text-primary-500">
                {response.summary.detected_classes.length} unique classes detected out of{' '}
                {response.summary.selected_classes.length || 'all'} selected.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700">Processing Metrics</h4>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-center shadow-sm"
                >
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{metric.label}</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700">Class Distribution</h4>
            <ul className="mt-3 space-y-2">
              {classCounts.map(({ className, count, color }) => (
                <li
                  key={className}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-600"
                >
                  <span className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="capitalize">{className}</span>
                  </span>
                  <span className="font-medium text-slate-800">{count}</span>
                </li>
              ))}
              {classCounts.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-4 text-center text-sm text-slate-400">
                  No detections found for the selected classes.
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700">Selection Summary</h4>
            <div className="mt-3 grid gap-3 text-xs text-slate-500">
              <div className="rounded-2xl border border-slate-100 bg-white p-3">
                <p className="font-medium text-slate-700">Selected Classes</p>
                <p className="mt-1 text-slate-500">
                  {response.summary.selected_classes.length > 0
                    ? response.summary.selected_classes.join(', ')
                    : 'All classes'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-3">
                <p className="font-medium text-slate-700">Detected Classes</p>
                <p className="mt-1 text-slate-500">
                  {response.summary.detected_classes.length > 0
                    ? response.summary.detected_classes.join(', ')
                    : 'No detected classes'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
