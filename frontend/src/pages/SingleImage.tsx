import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'

import { ClassSelector } from '@/components/detection/ClassSelector'
import { UploadDropzone } from '@/components/detection/UploadDropzone'
import { DetectionResults } from '@/components/detection/DetectionResults'
import { detectSingleImage } from '@/services/detection'
import { YOLOV11_CLASSES } from '@/constants/yoloClasses'
import {
  selectError,
  selectPreviewUrl,
  selectProcessingStatus,
  selectResults,
  selectSelectedClasses,
  useDetectionStore,
} from '@/store/detectionStore'
import { getClassColor } from '@/utils/colors'

type ProcessingButtonState = 'idle' | 'processing' | 'disabled'

export function SingleImage() {
  const selectedClasses = useDetectionStore(selectSelectedClasses)
  const processingStatus = useDetectionStore(selectProcessingStatus)
  const previewUrl = useDetectionStore(selectPreviewUrl)
  const results = useDetectionStore(selectResults)
  const error = useDetectionStore(selectError)

  const setProcessingStatus = useDetectionStore((state) => state.setProcessingStatus)
  const setResults = useDetectionStore((state) => state.setResults)
  const setError = useDetectionStore((state) => state.setError)
  const setPreviewUrl = useDetectionStore((state) => state.setPreviewUrl)
  const resetStore = useDetectionStore((state) => state.reset)

  const [file, setFile] = useState<File | null>(null)
  const [downloadBusy, setDownloadBusy] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const classesForRequest = useMemo(
    () => (selectedClasses.length > 0 ? selectedClasses : [...YOLOV11_CLASSES]),
    [selectedClasses],
  )

  const handleFileAccepted = useCallback(
    (newFile: File | null, preview: string | null) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setFile(newFile)
      setPreviewUrl(preview)
      setResults(null)
      setError(null)
      setProcessingStatus('idle')
    },
    [previewUrl, setPreviewUrl, setResults, setError, setProcessingStatus],
  )

  const handleRunDetection = useCallback(async () => {
    if (!file) {
      setError('Please upload an image before running detection.')
      return
    }

    setProcessingStatus('processing')
    setError(null)

    try {
      const response = await detectSingleImage({
        file,
        classes: classesForRequest,
      })
      setResults(response)
      setProcessingStatus('completed')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An error occurred while processing the image. Please try again.'
      setError(message)
      setProcessingStatus('error')
    }
  }, [file, classesForRequest, setProcessingStatus, setError, setResults])

  const handleDownload = useCallback(async () => {
    if (!results || !previewUrl || downloadBusy) return
    setDownloadBusy(true)

    try {
      const image = await loadImage(previewUrl)
      const canvas = document.createElement('canvas')
      canvas.width = results.metadata.width
      canvas.height = results.metadata.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      ctx.lineJoin = 'round'

      results.payload.detections.forEach((detection) => {
        const { bbox, class_name: name, confidence } = detection
        const color = getClassColor(name)
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.strokeRect(bbox.x_min, bbox.y_min, bbox.x_max - bbox.x_min, bbox.y_max - bbox.y_min)

        const label = `${name} ${(confidence * 100).toFixed(1)}%`
        const padding = 8
        ctx.font = '600 14px Inter, system-ui, sans-serif'
        const textWidth = ctx.measureText(label).width + padding * 2
        const labelX = bbox.x_min
        const labelY = Math.max(bbox.y_min - 28, 0)

        ctx.fillStyle = color
        ctx.globalAlpha = 0.9
        ctx.fillRect(labelX, labelY, textWidth, 24)
        ctx.globalAlpha = 1
        ctx.fillStyle = '#ffffff'
        ctx.fillText(label, labelX + padding, labelY + 17)
      })

      const downloadLink = document.createElement('a')
      downloadLink.href = canvas.toDataURL('image/png')
      downloadLink.download = `visionflow-detections-${Date.now()}.png`
      downloadLink.click()
    } catch (downloadError) {
      console.error(downloadError)
    } finally {
      setDownloadBusy(false)
    }
  }, [results, previewUrl, downloadBusy])

  const buttonState: ProcessingButtonState = useMemo(() => {
    if (processingStatus === 'processing') return 'processing'
    if (!file) return 'disabled'
    return 'idle'
  }, [processingStatus, file])

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-600">
          <Sparkles className="h-4 w-4" />
          Phase 3 · Single Image Detection
        </div>
        <h2 className="text-3xl font-semibold text-slate-950">Single Image Detection</h2>
        <p className="max-w-3xl text-sm text-slate-600">
          Upload an image to run YOLOv11 detection. Filter objects by class, review high-level metrics, and download the
          annotated results for reporting or further analysis.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <UploadDropzone disabled={processingStatus === 'processing'} onFileAccepted={handleFileAccepted} />
        <ClassSelector />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <motion.button
          type="button"
          onClick={handleRunDetection}
          disabled={buttonState !== 'idle'}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-card transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          whileTap={{ scale: buttonState === 'idle' ? 0.98 : 1 }}
        >
          {buttonState === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {buttonState === 'processing' ? 'Processing...' : 'Run Detection'}
        </motion.button>

        <button
          type="button"
          onClick={() => {
            resetStore()
            setFile(null)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:border-primary-200 hover:text-primary-600"
        >
          Reset
        </button>

        <p className="text-xs text-slate-400">Selections persist locally so you can pick up where you left off.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {processingStatus === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-600"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing image with YOLOv11...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results && previewUrl && processingStatus === 'completed' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
            <DetectionResults response={results} previewUrl={previewUrl} onDownload={handleDownload} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}
