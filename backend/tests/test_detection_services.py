from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np
import pytest

from app.schemas.detection import DetectionResponse
from app.services.detection import DetectionRepository, DetectionService
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


class HistoryRepository(InMemoryRepository):
    def __init__(self, history_docs, analytics_items):
        super().__init__()
        self.history_docs = history_docs
        self.analytics_items = analytics_items

    async def fetch_history(
        self,
        *,
        page: int,
        page_size: int,
        class_name: str | None = None,
    ):
        return self.history_docs, len(self.history_docs)

    async def class_frequency(
        self,
        *,
        class_names=None,
    ):
        total_detections = sum(item["detections"] for item in self.analytics_items)
        return {
            "items": self.analytics_items,
            "total_detections": total_detections,
            "total_classes": len(self.analytics_items),
        }


class FakeDocument:
    def __init__(self, identifier: str, response: DetectionResponse, created_at: datetime):
        self.id = identifier
        self.source_name = "sample.jpg"
        self.source_type = "upload"
        self.metadata = response.metadata
        self.summary = response.summary
        self.payload = response.payload
        self.created_at = created_at


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


@pytest.mark.asyncio
async def test_detection_history_response_shape() -> None:
    yolo = build_service()
    detection_response = yolo.predict_image(random_image(), selected_classes=None)
    created_at = datetime.utcnow()
    fake_doc = FakeDocument("123", detection_response, created_at)
    analytics_items = [{"_id": "car", "detections": 5, "last_seen": created_at}]

    repository = HistoryRepository([fake_doc], analytics_items)
    service = DetectionService(yolo, repository=repository)

    history = await service.list_detection_history(page=1, page_size=10)

    assert history.total == 1
    assert history.pages == 1
    assert history.items[0].id == "123"
    assert history.items[0].summary.total_detections == detection_response.summary.total_detections


@pytest.mark.asyncio
async def test_class_frequency_response() -> None:
    yolo = build_service()
    now = datetime.utcnow()
    analytics_items = [
        {"_id": "car", "detections": 5, "last_seen": now},
        {"_id": "person", "detections": 2, "last_seen": now - timedelta(minutes=5)},
    ]
    repository = HistoryRepository([], analytics_items)
    service = DetectionService(yolo, repository=repository)

    response = await service.class_frequency(limit=1)

    assert response.total_detections == 7
    assert response.total_classes == 2
    assert len(response.items) == 1
    assert response.items[0].class_name == "car"
