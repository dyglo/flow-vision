from __future__ import annotations

from datetime import datetime
from typing import List, Sequence

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x_min: float = Field(..., description="Top-left X coordinate")
    y_min: float = Field(..., description="Top-left Y coordinate")
    x_max: float = Field(..., description="Bottom-right X coordinate")
    y_max: float = Field(..., description="Bottom-right Y coordinate")

    def width(self) -> float:
        return max(self.x_max - self.x_min, 0.0)

    def height(self) -> float:
        return max(self.y_max - self.y_min, 0.0)

    def area(self) -> float:
        return self.width() * self.height()


class DetectionItem(BaseModel):
    detection_id: str
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox


class DetectionMetadata(BaseModel):
    width: int
    height: int
    channels: int
    processed_at: datetime = Field(default_factory=datetime.utcnow)


class DetectionSummary(BaseModel):
    total_detections: int
    detected_classes: List[str]
    selected_classes: List[str]
    processing_ms: float


class DetectionResponsePayload(BaseModel):
    detections: Sequence[DetectionItem]


class DetectionResponse(BaseModel):
    metadata: DetectionMetadata
    summary: DetectionSummary
    payload: DetectionResponsePayload


class DetectionHistoryItem(BaseModel):
    id: str
    source_name: str | None
    source_type: str
    metadata: DetectionMetadata
    summary: DetectionSummary
    created_at: datetime


class DetectionHistoryResponse(BaseModel):
    page: int
    page_size: int
    total: int
    pages: int
    items: List[DetectionHistoryItem]


class ClassFrequencyItem(BaseModel):
    class_name: str
    detections: int
    last_seen: datetime | None = None


class ClassFrequencyResponse(BaseModel):
    total_detections: int
    total_classes: int
    items: List[ClassFrequencyItem]
