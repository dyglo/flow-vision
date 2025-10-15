from __future__ import annotations

import numpy as np
import pytest

from app.schemas.detection import DetectionResponse
from app.services.detection import DetectionService, DetectionRepository
from app.services.yolo import YOLOService


class DummyBoxes:
    def __init__(self):
        self.cls = [0, 1]
        self.conf = [0.92, 0.81]
        self.xyxy = [
            [10, 20, 110, 220],
            [15, 30, 60, 120],
        ]


class DummyResult:
    def __init__(self):
        self.boxes = DummyBoxes()
        self.names = {0: "car", 1: "person"}


class DummyModel:
    def __init__(self):
        self.result = DummyResult()
        self.device = None

    def to(self, device: str) -> None:  # pragma: no cover - trivial setter
        self.device = device

    def predict(self, image: np.ndarray, conf: float, verbose: bool = False):
        return [self.result]


class InMemoryRepository(DetectionRepository):
    def __init__(self) -> None:
        self.saved: list[DetectionResponse] = []

    async def persist(
        self,
        response: DetectionResponse,
        *,
        source_name: str | None,
        source_type: str = "upload",
    ):
        self.saved.append(response)
        return None


def build_service() -> YOLOService:
    return YOLOService(model_factory=lambda _: DummyModel())


def random_image() -> np.ndarray:
    return np.zeros((256, 256, 3), dtype=np.uint8)


def test_yolo_service_filters_classes() -> None:
    service = build_service()

    response = service.predict_image(random_image(), selected_classes=["car"])

    assert response.summary.total_detections == 1
    assert response.summary.detected_classes == ["car"]
    assert response.summary.selected_classes == ["car"]
    assert all(det.class_name == "car" for det in response.payload.detections)


def test_yolo_service_returns_all_when_no_filter() -> None:
    service = build_service()

    response = service.predict_image(random_image(), selected_classes=None)

    assert response.summary.total_detections == 2
    assert set(response.summary.detected_classes) == {"car", "person"}
    assert len(response.payload.detections) == 2


@pytest.mark.asyncio
async def test_detection_service_persists_results() -> None:
    yolo = build_service()
    repository = InMemoryRepository()
    service = DetectionService(yolo, repository=repository)

    await service.run_detection(random_image(), selected_classes=["car"], source_name="sample.jpg")

    assert len(repository.saved) == 1
    saved_response = repository.saved[0]
    assert saved_response.summary.total_detections == 1
