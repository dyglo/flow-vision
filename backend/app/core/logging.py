import logging
from typing import Literal

LOG_FORMAT = (
    "%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s"
)


def configure_logging(level: str | Literal["TRACE", "DEBUG", "INFO", "WARNING", "ERROR"]) -> None:
    logging.basicConfig(
        level=level.upper(),
        format=LOG_FORMAT,
    )
