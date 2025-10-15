from __future__ import annotations

from typing import Iterable

import numpy as np

try:  # pragma: no cover - fallback for environments without loguru
    from loguru import logger
except ImportError:  # pragma: no cover
    import logging

    logger = logging.getLogger("visionflow")

from app.models.detection import DetectionResultDocument
from app.schemas.detection import DetectionResponse
from app.services.yolo import YOLOService


class DetectionRepository:
    async def persist(
        self,
        response: DetectionResponse,
        *,
        source_name: str | None,
        source_type: str = "upload",
    ) -> DetectionResultDocument:
        document = DetectionResultDocument(
            source_name=source_name,
            source_type=source_type,
            metadata=response.metadata,
            summary=response.summary,
            payload=response.payload,
        )
        await document.insert()
        return document


class DetectionService:
    def __init__(
        self,
        yolo_service: YOLOService,
        repository: DetectionRepository | None = None,
    ) -> None:
        self._yolo = yolo_service
        self._repository = repository or DetectionRepository()

    async def run_detection(
        self,
        image: np.ndarray,
        *,
        selected_classes: Iterable[str] | None,
        source_name: str | None = None,
    ) -> DetectionResponse:
        logger.debug("Running detection (classes=%s)", selected_classes)
        response = self._yolo.predict_image(image, selected_classes)
        await self._repository.persist(response, source_name=source_name)
        return response


_yolo_service: YOLOService | None = None
_detection_service: DetectionService | None = None


def get_yolo_service() -> YOLOService:
    global _yolo_service
    if _yolo_service is None:
        _yolo_service = YOLOService()
    return _yolo_service


def get_detection_service() -> DetectionService:
    global _detection_service
    if _detection_service is None:
        _detection_service = DetectionService(get_yolo_service())
    return _detection_service
