from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.mongo import close_mongo, init_mongo


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(level=settings.log_level)

    app = FastAPI(title=settings.project_name, version=settings.version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def on_startup() -> None:
        logger.info("Starting VisionFlow backend")
        await init_mongo()

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        logger.info("Stopping VisionFlow backend")
        await close_mongo()

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/health", tags=["Health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok", "environment": settings.environment}

    return app


app = create_app()
