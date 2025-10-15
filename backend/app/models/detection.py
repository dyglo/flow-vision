from datetime import datetime

try:
    from beanie import Document
except ImportError:  # pragma: no cover - allows importing without beanie during unit tests
    class Document:  # type: ignore[override]
        def __init_subclass__(cls, **kwargs):
            pass
from pydantic import Field
from pymongo import IndexModel

from app.schemas.detection import DetectionMetadata, DetectionResponsePayload, DetectionSummary


class DetectionResultDocument(Document):
    source_name: str | None = Field(default=None, description="Original filename")
    source_type: str = Field(default="upload", description="Type of detection source")
    metadata: DetectionMetadata
    summary: DetectionSummary
    payload: DetectionResponsePayload
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "detection_results"
        indexes = [
            IndexModel([("summary.detected_classes", 1)]),
            IndexModel([("summary.selected_classes", 1)]),
            IndexModel([("payload.detections.class_name", 1)]),
            IndexModel([("created_at", -1)]),
        ]
