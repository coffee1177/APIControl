from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Category(Base):
    __tablename__ = "web-categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parentId: Mapped[Optional[int]] = mapped_column(
        "parentId",
        ForeignKey("web-categories.id", ondelete="RESTRICT"),
        nullable=True,
    )
    floor: Mapped[int] = mapped_column(Integer, nullable=False)


class WebList(Base):
    __tablename__ = "web-list"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    categoryId: Mapped[Optional[int]] = mapped_column(
        "categoryId",
        ForeignKey("web-categories.id", ondelete="RESTRICT"),
        nullable=True,
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
