from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.params import Query

from app.schemas.detection import DetectionResponse
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
