export interface BoundingBox {
  x_min: number
  y_min: number
  x_max: number
  y_max: number
}

export interface DetectionItem {
  detection_id: string
  class_id: number
  class_name: string
  confidence: number
  bbox: BoundingBox
}

export interface DetectionMetadata {
  width: number
  height: number
  channels: number
  processed_at: string
}

export interface DetectionSummary {
  total_detections: number
  detected_classes: string[]
  selected_classes: string[]
  processing_ms: number
}

export interface DetectionResponsePayload {
  detections: DetectionItem[]
}

export interface DetectionResponse {
  metadata: DetectionMetadata
  summary: DetectionSummary
  payload: DetectionResponsePayload
}
