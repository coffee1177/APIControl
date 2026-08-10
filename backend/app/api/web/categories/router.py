from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.web.categories.schemas import (
    CategoryCreate,
    CategoryNode,
    CategoryRead,
    CategoryUpdate,
)
from app.api.web.categories.service import (
    build_category_tree,
    calculate_floor,
    ensure_name_available,
    get_category_or_404,
    validate_move,
)
from app.db.models import Category, WebList
from app.db.session import get_db

router = APIRouter(prefix="/web/categories", tags=["web"])


@router.get(
    "",
    response_model=list[CategoryNode],
    summary="查询网站分类",
    description="按层级整理网站记录分类，并返回带 children 的分类树。",
)
def list_categories(db: Session = Depends(get_db)) -> list[CategoryNode]:
    categories = list(
        db.scalars(select(Category).order_by(Category.floor, Category.id)).all()
    )
    return build_category_tree(categories)


@router.post(
    "",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="新增网站分类",
    description="创建一级或二级网站记录分类，floor 由后端自动计算。",
)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="分类名称不能为空")
    floor = calculate_floor(db, payload.parentId)
    ensure_name_available(db, name, payload.parentId)

    category = Category(name=name, parentId=payload.parentId, floor=floor)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put(
    "/{category_id}",
    response_model=CategoryRead,
    summary="修改网站分类",
    description="修改分类名称或父分类，并同步重新计算分类层级。",
)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
) -> Category:
    category = get_category_or_404(db, category_id)
    new_name = payload.name.strip() if payload.name is not None else category.name
    if not new_name:
        raise HTTPException(status_code=422, detail="分类名称不能为空")

    parent_changed = "parentId" in payload.model_fields_set
    new_parent_id = payload.parentId if parent_changed else category.parentId
    ensure_name_available(db, new_name, new_parent_id, category.id)

    if parent_changed and new_parent_id != category.parentId:
        floor_offset, descendants = validate_move(db, category, new_parent_id)
        category.parentId = new_parent_id
        category.floor += floor_offset
        for descendant in descendants:
            descendant.floor += floor_offset

    category.name = new_name
    db.commit()
    db.refresh(category)
    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除网站分类",
    description="删除空分类；存在子分类时不允许删除。",
)
def delete_category(category_id: int, db: Session = Depends(get_db)) -> Response:
    category = get_category_or_404(db, category_id)
    has_children = db.scalar(
        select(Category.id).where(Category.parentId == category.id).limit(1)
    )
    if has_children is not None:
        raise HTTPException(status_code=409, detail="分类下存在子分类，不能删除")
    has_bookmarks = db.scalar(
        select(WebList.id).where(WebList.categoryId == category.id).limit(1)
    )
    if has_bookmarks is not None:
        raise HTTPException(status_code=409, detail="分类下存在网址，不能删除")

    db.delete(category)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
