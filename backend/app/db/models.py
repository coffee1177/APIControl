from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Category(Base):
    __tablename__ = "web-categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parentId: Mapped[int | None] = mapped_column(
        "parentId",
        ForeignKey("web-categories.id", ondelete="RESTRICT"),
        nullable=True,
    )
    floor: Mapped[int] = mapped_column(Integer, nullable=False)
