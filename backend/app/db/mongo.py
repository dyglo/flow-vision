from __future__ import annotations

from typing import Iterable

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.models.detection import DetectionResultDocument

_client: AsyncIOMotorClient | None = None


async def init_mongo() -> None:
    global _client
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.mongo_url)
    await init_beanie(
        database=_client[settings.mongo_db_name],
        document_models=cast_models(
            [
                DetectionResultDocument,
            ]
        ),
    )


async def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def cast_models(models: Iterable[type]) -> list[type]:
    # Helper function only to improve readability when the list grows
    return list(models)
