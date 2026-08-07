from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.schema import Table
from sqlalchemy.orm import Session

from app.db import models  # noqa: F401  # Ensure SQLAlchemy metadata is loaded.
from app.db.base import Base
from app.db.session import get_db

router = APIRouter(prefix="/destroy", tags=["系统"])


class DestroyResult(BaseModel):
    destroyed: list[str]
    reset_all: bool
    message: str


def _parse_database_names(raw_names: str) -> list[str]:
    names = [name.strip() for name in raw_names.split(",") if name.strip()]
    if not names:
        raise HTTPException(status_code=422, detail="数据库名称不能为空")
    unique_names: list[str] = []
    for name in names:
        if name not in unique_names:
            unique_names.append(name)
    return unique_names


def _resolve_tables(database_names: list[str]) -> list[Table]:
    sorted_tables = list(Base.metadata.sorted_tables)
    available_tables = {table.name: table for table in sorted_tables}
    missing_names = [name for name in database_names if name not in available_tables]
    if missing_names:
        raise HTTPException(
            status_code=404,
            detail=f"未找到数据库：{', '.join(missing_names)}",
        )
    requested_names = set(database_names)
    return [table for table in sorted_tables if table.name in requested_names]


def _reset_tables(db: Session, tables: list[Table]) -> None:
    is_sqlite = db.bind and db.bind.dialect.name == "sqlite"
    if is_sqlite:
        db.execute(text("PRAGMA foreign_keys=OFF"))

    try:
        for table in reversed(tables):
            db.execute(table.delete())
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        if is_sqlite:
            db.execute(text("PRAGMA foreign_keys=ON"))
            db.commit()


@router.delete(
    "/all",
    response_model=DestroyResult,
    summary="重置整个系统数据",
    description="清空当前系统全部表数据，但保留表结构。",
)
def destroy_all(db: Session = Depends(get_db)) -> DestroyResult:
    tables = list(Base.metadata.sorted_tables)
    _reset_tables(db, tables)
    return DestroyResult(
        destroyed=[table.name for table in tables],
        reset_all=True,
        message="系统数据已重置",
    )


@router.delete(
    "/{database_names}",
    response_model=DestroyResult,
    summary="重置指定数据库数据",
    description="按数据库名称清空数据，支持多个名称，使用英文逗号分隔。",
)
def destroy_databases(
    database_names: str,
    db: Session = Depends(get_db),
) -> DestroyResult:
    names = _parse_database_names(database_names)
    tables = _resolve_tables(names)
    _reset_tables(db, tables)
    return DestroyResult(
        destroyed=[table.name for table in tables],
        reset_all=False,
        message="指定数据库数据已重置",
    )
