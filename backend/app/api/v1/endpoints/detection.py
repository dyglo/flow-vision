from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.params import Query

from app.schemas.detection import (
    ClassFrequencyResponse,
    DetectionHistoryResponse,
    DetectionResponse,
)
from app.services.detection import DetectionService, get_detection_service
from app.utils.images import read_upload_image

router = APIRouter(prefix="/detection", tags=["Detection"])


@router.post(
    "/image",
    response_model=DetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Run object detection on a single image",
)
async def detect_single_image(
    file: UploadFile = File(..., description="Image file to analyze"),
    classes: list[str] | None = Query(
        default=None,
        description="Optional list of class names to filter detections (case-insensitive)",
    ),
    service: DetectionService = Depends(get_detection_service),
) -> DetectionResponse:
    try:
        image = await read_upload_image(file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    try:
        return await service.run_detection(
            image,
            selected_classes=classes,
            source_name=file.filename,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get(
    "/history",
    response_model=DetectionHistoryResponse,
    summary="List historical detections with pagination",
)
async def list_detection_history(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    class_name: str | None = Query(
        default=None,
        description="Filter history to only detections containing this class name",
    ),
    service: DetectionService = Depends(get_detection_service),
) -> DetectionHistoryResponse:
    return await service.list_detection_history(page=page, page_size=page_size, class_name=class_name)


@router.get(
    "/analytics/classes",
    response_model=ClassFrequencyResponse,
    summary="Aggregate detections per class across history",
)
async def class_frequency_analytics(
    class_name: list[str] | None = Query(
        default=None,
        description="Optional repeated query param to limit aggregation to specific class names",
    ),
    limit: int | None = Query(
        default=20,
        ge=1,
        le=200,
        description="Maximum number of classes to return (set to 0 to disable limit)",
    ),
    service: DetectionService = Depends(get_detection_service),
) -> ClassFrequencyResponse:
    applied_limit = None if limit == 0 else limit
    return await service.class_frequency(class_names=class_name, limit=applied_limit)
