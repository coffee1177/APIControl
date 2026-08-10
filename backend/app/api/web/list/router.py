from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.web.list.schemas import BookmarkCreate, BookmarkPage, BookmarkRead, BookmarkUpdate
from app.api.web.list.service import (
    ensure_category_exists,
    get_bookmark_or_404,
    get_bookmark_read_or_404,
    list_bookmarks,
)
from app.db.models import WebList
from app.db.session import get_db

router = APIRouter(prefix="/web/list", tags=["web"])


@router.get(
    "",
    response_model=BookmarkPage,
    summary="查询网址列表",
    description="按分页查询网址记录，可按分类筛选，也可通过 isAll 查看全部网址。",
)
def read_bookmarks(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    categoryId: int | None = None,
    isAll: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> BookmarkPage:
    return list_bookmarks(db, page=page, size=size, category_id=categoryId, is_all=isAll)


@router.post(
    "",
    response_model=BookmarkRead,
    status_code=status.HTTP_201_CREATED,
    summary="新增网址",
    description="创建一条网址记录，标题、链接、创建时间和更新时间为必备字段，分类可为空。",
)
def create_bookmark(payload: BookmarkCreate, db: Session = Depends(get_db)) -> BookmarkRead:
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="网址名称不能为空")
    description = payload.description.strip() if payload.description is not None else None
    if description == "":
        description = None

    ensure_category_exists(db, payload.categoryId)

    bookmark = WebList(
        title=title,
        url=str(payload.url),
        description=description,
        categoryId=payload.categoryId,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return get_bookmark_read_or_404(db, bookmark.id)


@router.put(
    "/{bookmark_id}",
    response_model=BookmarkRead,
    summary="修改网址",
    description="修改网址名称、链接、简介或所属分类，分类可切换为空。",
)
def update_bookmark(
    bookmark_id: int,
    payload: BookmarkUpdate,
    db: Session = Depends(get_db),
) -> BookmarkRead:
    bookmark = get_bookmark_or_404(db, bookmark_id)

    if "title" in payload.model_fields_set:
        title = payload.title.strip() if payload.title is not None else None
        if not title:
            raise HTTPException(status_code=422, detail="网址名称不能为空")
        bookmark.title = title

    if "url" in payload.model_fields_set and payload.url is not None:
        bookmark.url = str(payload.url)

    if "description" in payload.model_fields_set:
        description = (
            payload.description.strip() if payload.description is not None else None
        )
        bookmark.description = description or None

    if "categoryId" in payload.model_fields_set:
        ensure_category_exists(db, payload.categoryId)
        bookmark.categoryId = payload.categoryId

    db.commit()
    db.refresh(bookmark)
    return get_bookmark_read_or_404(db, bookmark.id)


@router.delete(
    "/{bookmark_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除网址",
    description="删除单条网址记录，删除前由前端确认。",
)
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db)) -> None:
    bookmark = get_bookmark_or_404(db, bookmark_id)
    db.delete(bookmark)
    db.commit()
