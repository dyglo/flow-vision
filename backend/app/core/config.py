from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), env_ignore_empty=True)

    project_name: str = "VisionFlow"
    version: str = "0.1.0"
    environment: str = "development"
    api_prefix: str = "/api/v1"

    backend_cors_origins: list[AnyHttpUrl] | str = "http://localhost:5173"
    database_url: str = "sqlite:///./backend/data/visionflow.db"
    sqlite_echo: bool = False

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str | None = None
    celery_result_backend: str | None = None

    models_dir: Path = Path("./backend/models")
    uploads_dir: Path = Path("./backend/uploads")

    log_level: str = "INFO"

    @validator("backend_cors_origins", pre=True)
    def assemble_cors(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def cors_origins(self) -> List[str]:
        return list(self.backend_cors_origins)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.models_dir.mkdir(parents=True, exist_ok=True)
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    return settings
