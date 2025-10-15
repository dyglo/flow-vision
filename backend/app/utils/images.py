from __future__ import annotations

import io
from typing import Final

import cv2
import numpy as np
from fastapi import UploadFile

SUPPORTED_IMAGE_TYPES: Final[set[str]] = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


async def read_upload_image(upload: UploadFile) -> np.ndarray:
    if upload.content_type not in SUPPORTED_IMAGE_TYPES:
        raise ValueError(f"Unsupported content type: {upload.content_type}")

    raw_bytes = await upload.read()
    if not raw_bytes:
        raise ValueError("Uploaded file is empty")

    image_array = np.frombuffer(raw_bytes, np.uint8)
    decoded = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if decoded is None:
        raise ValueError("Could not decode image")

    rgb_image = cv2.cvtColor(decoded, cv2.COLOR_BGR2RGB)
    return rgb_image


def to_bytes(image: np.ndarray, extension: str = ".jpg") -> bytes:
    success, buffer = cv2.imencode(extension, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    if not success:
        raise ValueError("Unable to encode image")
    return io.BytesIO(buffer).getvalue()
