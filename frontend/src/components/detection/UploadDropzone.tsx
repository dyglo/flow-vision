import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react'

type UploadDropzoneProps = {
  onFileAccepted: (file: File | null, previewUrl: string | null) => void
  disabled?: boolean
}

const ACCEPTED_TYPES = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp'] }
const MAX_SIZE = 25 * 1024 * 1024

export function UploadDropzone({ onFileAccepted, disabled = false }: UploadDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const [file] = acceptedFiles
      if (!file) return
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setFileName(file.name)
      onFileAccepted(file, objectUrl)
    },
    [onFileAccepted],
  )

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileName(null)
    onFileAccepted(null, null)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    disabled,
    maxFiles: 1,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
  })

  const rootProps = getRootProps()
  const inputProps = getInputProps()

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-card backdrop-blur">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Upload Image</h3>
          <p className="text-sm text-slate-500">Drop a single image or click to browse.</p>
        </div>
        {fileName && (
          <button
            type="button"
            onClick={clearFile}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary-200 hover:text-primary-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </header>

      <motion.div
        {...(rootProps as Record<string, unknown>)}
        className={`relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition ${
          isDragActive
            ? 'border-primary-400 bg-primary-50 text-primary-600'
            : 'border-slate-200 bg-white/60 text-slate-500 hover:border-primary-200 hover:text-primary-600'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <input {...inputProps} />
        {preview ? (
          <motion.img
            src={preview}
            alt="Image preview"
            className="h-full w-full rounded-3xl object-cover"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-primary-50 p-4 text-primary-500">
              {isDragActive ? <UploadCloud className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
            </div>
            <div>
              <p className="text-sm font-medium">Click to browse or drop an image</p>
              <p className="text-xs text-slate-400">Supported: JPG, PNG, WebP (max 25 MB)</p>
            </div>
          </div>
        )}
      </motion.div>

      {fileName && (
        <footer className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <span className="truncate font-medium text-slate-600">{fileName}</span>
          <span>Ready to process</span>
        </footer>
      )}
    </div>
  )
}
