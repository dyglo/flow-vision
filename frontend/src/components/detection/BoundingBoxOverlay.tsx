import { motion } from 'framer-motion'

import type { DetectionItem, DetectionMetadata } from '@/types/detection'
import { getClassColor } from '@/utils/colors'

type BoundingBoxOverlayProps = {
  imageUrl: string
  detections: DetectionItem[]
  metadata: DetectionMetadata
}

export function BoundingBoxOverlay({ imageUrl, detections, metadata }: BoundingBoxOverlayProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-card">
      <img
        src={imageUrl}
        alt="Detection preview"
        className="h-auto w-full rounded-3xl object-contain"
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${metadata.width} ${metadata.height}`}
        preserveAspectRatio="none"
      >
        {detections.map((detection) => {
          const color = getClassColor(detection.class_name)
          const { bbox } = detection
          const width = Math.max(bbox.x_max - bbox.x_min, 1)
          const height = Math.max(bbox.y_max - bbox.y_min, 1)

          return (
            <motion.g key={detection.detection_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect
                x={bbox.x_min}
                y={bbox.y_min}
                width={width}
                height={height}
                stroke={color}
                strokeWidth={3}
                fill="transparent"
                rx={8}
              />
              <g transform={`translate(${bbox.x_min}, ${Math.max(bbox.y_min - 8, 0)})`}>
                <rect x={0} y={0} width={width} height={28} rx={8} fill={color} opacity={0.9} />
                <text
                  x={12}
                  y={19}
                  fill="#fff"
                  fontSize="14"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={600}
                >
                  {detection.class_name}
                </text>
                <text
                  x={width - 12}
                  y={19}
                  fill="#fff"
                  fontSize="14"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={500}
                  textAnchor="end"
                >
                  {(detection.confidence * 100).toFixed(1)}%
                </text>
              </g>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
