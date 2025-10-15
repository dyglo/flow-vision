from __future__ import annotations

import threading
import time
import uuid
from typing import Callable, Iterable, Sequence

import numpy as np

try:  # pragma: no cover - fallback for environments without loguru
    from loguru import logger
except ImportError:  # pragma: no cover
    import logging

    logger = logging.getLogger("visionflow")

from app.core.config import get_settings
from app.schemas.detection import (
    BoundingBox,
    DetectionItem,
    DetectionMetadata,
    DetectionResponse,
    DetectionResponsePayload,
    DetectionSummary,
)

try:
    from ultralytics import YOLO  # type: ignore[attr-defined]
except Exception as exc:  # pragma: no cover - import guarded for environments without ultralytics
    YOLO = None
    logger.warning("Ultralytics YOLO import failed: {}", exc)


def _to_list(value: Sequence | np.ndarray) -> list:
    if hasattr(value, "tolist"):
        return value.tolist()
    if isinstance(value, np.ndarray):
        return value.tolist()
    return list(value)


class YOLOService:
    def __init__(
        self,
        model_path: str | None = None,
        confidence: float | None = None,
        device: str | None = None,
        model_factory: Callable[[str], object] | None = None,
    ) -> None:
        settings = get_settings()
        self.model_path = model_path or settings.yolo_model_path
        self.confidence = confidence or settings.yolo_confidence
        self.device = device or settings.yolo_device
        self._model_factory = model_factory or YOLO  # type: ignore[assignment]
        self._model: object | None = None
        self._lock = threading.Lock()

        if self._model_factory is None:
            raise RuntimeError(
                "Ultralytics is not available. Install it or provide a custom model_factory."
            )

    def _load_model(self) -> object:
        if self._model is None:
            with self._lock:
                if self._model is None:
                    logger.info("Loading YOLO model from {}", self.model_path)
                    model = self._model_factory(self.model_path)
                    if hasattr(model, "to"):
                        model.to(self.device)
                    self._model = model
        return self._model

    def predict_image(
        self,
        image: np.ndarray,
        selected_classes: Iterable[str] | None = None,
    ) -> DetectionResponse:
        model = self._load_model()
        start = time.perf_counter()
        results = model.predict(image, conf=self.confidence, verbose=False)  # type: ignore[attr-defined]
        elapsed_ms = (time.perf_counter() - start) * 1000

        selected_original = list({c.strip(): None for c in selected_classes or [] if c.strip()}.keys())
        selected_set = {c.lower() for c in selected_original}
        detections: list[DetectionItem] = []
        detected_classes: set[str] = set()

        if not isinstance(results, (list, tuple)):
            results = [results]

        for result in results:
            boxes = getattr(result, "boxes", None)
            names = getattr(result, "names", {})
            if boxes is None:
                continue

            cls_list = _to_list(getattr(boxes, "cls", []))
            conf_list = _to_list(getattr(boxes, "conf", []))
            xyxy_list = _to_list(getattr(boxes, "xyxy", []))

            for cls_id, conf, xyxy in zip(cls_list, conf_list, xyxy_list):
                class_id = int(cls_id)
                class_name = str(names.get(class_id, f"class_{class_id}"))
                if selected_set and class_name.lower() not in selected_set:
                    continue

                detected_classes.add(class_name)
                bbox = BoundingBox(
                    x_min=float(xyxy[0]),
                    y_min=float(xyxy[1]),
                    x_max=float(xyxy[2]),
                    y_max=float(xyxy[3]),
                )

                detections.append(
                    DetectionItem(
                        detection_id=str(uuid.uuid4()),
                        class_id=class_id,
                        class_name=class_name,
                        confidence=float(conf),
                        bbox=bbox,
                    )
                )

        metadata = DetectionMetadata(
            width=int(image.shape[1]),
            height=int(image.shape[0]),
            channels=int(image.shape[2]) if image.ndim == 3 else 1,
        )
        summary = DetectionSummary(
            total_detections=len(detections),
            detected_classes=sorted(detected_classes),
            selected_classes=selected_original,
            processing_ms=elapsed_ms,
        )

        payload = DetectionResponsePayload(detections=detections)

        return DetectionResponse(metadata=metadata, summary=summary, payload=payload)


_yolo_instance: YOLOService | None = None


def get_yolo_service() -> YOLOService:
    global _yolo_instance
    if _yolo_instance is None:
        _yolo_instance = YOLOService()
    return _yolo_instance
