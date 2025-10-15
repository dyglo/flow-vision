from __future__ import annotations

import math
from typing import Iterable, Sequence

import numpy as np

try:  # pragma: no cover - fallback for environments without loguru
    from loguru import logger
except ImportError:  # pragma: no cover
    import logging

    logger = logging.getLogger("visionflow")

from app.models.detection import DetectionResultDocument
from app.schemas.detection import (
    ClassFrequencyItem,
    ClassFrequencyResponse,
    DetectionHistoryItem,
    DetectionHistoryResponse,
    DetectionResponse,
)
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

    async def fetch_history(
        self,
        *,
        page: int,
        page_size: int,
        class_name: str | None = None,
    ) -> tuple[list[DetectionResultDocument], int]:
        query: dict[str, object] = {}
        if class_name:
            query["payload.detections.class_name"] = class_name

        total = await DetectionResultDocument.find(query).count()
        offset = (page - 1) * page_size
        documents = (
            await DetectionResultDocument.find(query)
            .sort(-DetectionResultDocument.created_at)
            .skip(offset)
            .limit(page_size)
            .to_list()
        )
        return documents, total

    async def class_frequency(
        self,
        *,
        class_names: Sequence[str] | None = None,
    ) -> dict[str, object]:
        collection = DetectionResultDocument.get_motor_collection()
        pipeline: list[dict[str, object]] = [{"$unwind": "$payload.detections"}]
        if class_names:
            pipeline.append({"$match": {"payload.detections.class_name": {"$in": list(set(class_names))}}})
        pipeline.extend(
            [
                {
                    "$group": {
                        "_id": "$payload.detections.class_name",
                        "detections": {"$sum": 1},
                        "last_seen": {"$max": "$created_at"},
                    }
                },
                {"$sort": {"detections": -1}},
            ]
        )

        aggregated = await collection.aggregate(pipeline).to_list(None)
        total_detections = sum(item["detections"] for item in aggregated)
        total_classes = len(aggregated)
        return {
            "items": aggregated,
            "total_detections": total_detections,
            "total_classes": total_classes,
        }


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

    async def list_detection_history(
        self,
        *,
        page: int,
        page_size: int,
        class_name: str | None = None,
    ) -> DetectionHistoryResponse:
        documents, total = await self._repository.fetch_history(page=page, page_size=page_size, class_name=class_name)
        pages = math.ceil(total / page_size) if page_size else 0
        items = [
            DetectionHistoryItem(
                id=str(document.id),
                source_name=document.source_name,
                source_type=document.source_type,
                metadata=document.metadata,
                summary=document.summary,
                created_at=document.created_at,
            )
            for document in documents
        ]
        return DetectionHistoryResponse(page=page, page_size=page_size, total=total, pages=pages, items=items)

    async def class_frequency(
        self,
        *,
        class_names: Sequence[str] | None = None,
        limit: int | None = 50,
    ) -> ClassFrequencyResponse:
        filtered_class_names = [name for name in class_names or [] if name]
        aggregation = await self._repository.class_frequency(class_names=filtered_class_names or None)
        aggregated_items: list[dict[str, object]] = aggregation["items"]  # type: ignore[assignment]
        items = [
            ClassFrequencyItem(
                class_name=str(item["_id"]),
                detections=int(item["detections"]),
                last_seen=item.get("last_seen"),
            )
            for item in aggregated_items
        ]
        if limit is not None:
            items = items[:limit]

        return ClassFrequencyResponse(
            total_detections=int(aggregation["total_detections"]),  # type: ignore[arg-type]
            total_classes=int(aggregation["total_classes"]),  # type: ignore[arg-type]
            items=items,
        )


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
