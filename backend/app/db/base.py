"""
Centralised SQLAlchemy model imports so Alembic can discover metadata.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
