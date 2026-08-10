from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.web.categories.service import get_category_or_404, get_descendants
from app.api.web.list.schemas import BookmarkPage, BookmarkRead
from app.db.models import Category, WebList


def get_bookmark_or_404(db: Session, bookmark_id: int) -> WebList:
    bookmark = db.get(WebList, bookmark_id)
    if bookmark is None:
        raise HTTPException(status_code=404, detail="网址不存在")
    return bookmark


def ensure_category_exists(db: Session, category_id: int | None) -> Category | None:
    if category_id is None:
        return None
    return get_category_or_404(db, category_id)


def to_bookmark_read(bookmark: WebList, category_name: str | None) -> BookmarkRead:
    return BookmarkRead(
        id=bookmark.id,
        title=bookmark.title,
        url=bookmark.url,
        description=bookmark.description,
        categoryId=bookmark.categoryId,
        categoryName=category_name,
        createdAt=bookmark.createdAt,
        updatedAt=bookmark.updatedAt,
    )


def get_bookmark_read_or_404(db: Session, bookmark_id: int) -> BookmarkRead:
    statement = (
        select(WebList, Category.name)
        .outerjoin(Category, WebList.categoryId == Category.id)
        .where(WebList.id == bookmark_id)
    )
    row = db.execute(statement).first()
    if row is None:
        raise HTTPException(status_code=404, detail="网址不存在")
    web_list_item, category_name = row
    return to_bookmark_read(web_list_item, category_name)


def list_bookmarks(
    db: Session,
    page: int,
    size: int,
    category_id: int | None = None,
    is_all: bool = False,
) -> BookmarkPage:
    statement = select(WebList, Category.name).outerjoin(
        Category,
        WebList.categoryId == Category.id,
    )
    count_statement = select(func.count()).select_from(WebList)

    if not is_all:
        if category_id is None:
            statement = statement.where(WebList.categoryId.is_(None))
            count_statement = count_statement.where(WebList.categoryId.is_(None))
        else:
            category_ids = [
                category_id,
                *(category.id for category in get_descendants(db, category_id)),
            ]
            statement = statement.where(WebList.categoryId.in_(category_ids))
            count_statement = count_statement.where(
                WebList.categoryId.in_(category_ids)
            )

    total = db.scalar(count_statement) or 0
    rows = db.execute(
        statement.order_by(WebList.id.desc()).offset((page - 1) * size).limit(size)
    ).all()
    items = [
        to_bookmark_read(web_list_item, category_name)
        for web_list_item, category_name in rows
    ]
    return BookmarkPage(items=items, page=page, size=size, total=total)
