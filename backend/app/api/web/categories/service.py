from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.web.categories.schemas import CategoryNode
from app.db.models import Category

MAX_CATEGORY_FLOOR = 2


def get_category_or_404(db: Session, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="分类不存在")
    return category


def calculate_floor(db: Session, parent_id: int | None) -> int:
    if parent_id is None:
        return 1
    parent = get_category_or_404(db, parent_id)
    floor = parent.floor + 1
    if floor > MAX_CATEGORY_FLOOR:
        raise HTTPException(status_code=400, detail="分类最多支持两层")
    return floor


def ensure_name_available(
    db: Session,
    name: str,
    parent_id: int | None,
    current_id: int | None = None,
) -> None:
    query = select(Category).where(
        Category.name == name,
        Category.parentId == parent_id,
    )
    if current_id is not None:
        query = query.where(Category.id != current_id)
    if db.scalar(query) is not None:
        raise HTTPException(status_code=409, detail="同级分类名称已存在")


def get_descendants(db: Session, category_id: int) -> list[Category]:
    categories = list(db.scalars(select(Category)).all())
    children_by_parent: dict[int, list[Category]] = defaultdict(list)
    for category in categories:
        if category.parentId is not None:
            children_by_parent[category.parentId].append(category)

    descendants: list[Category] = []
    pending = list(children_by_parent.get(category_id, []))
    while pending:
        child = pending.pop()
        descendants.append(child)
        pending.extend(children_by_parent.get(child.id, []))
    return descendants


def validate_move(
    db: Session,
    category: Category,
    new_parent_id: int | None,
) -> tuple[int, list[Category]]:
    if new_parent_id == category.id:
        raise HTTPException(status_code=400, detail="分类不能将自己设为父分类")

    descendants = get_descendants(db, category.id)
    descendant_ids = {item.id for item in descendants}
    if new_parent_id in descendant_ids:
        raise HTTPException(status_code=400, detail="分类不能移动到自己的后代分类下")

    new_floor = calculate_floor(db, new_parent_id)
    floor_offset = new_floor - category.floor
    if any(item.floor + floor_offset > MAX_CATEGORY_FLOOR for item in descendants):
        raise HTTPException(status_code=400, detail="移动后会超过当前两层分类限制")
    return floor_offset, descendants


def build_category_tree(categories: list[Category]) -> list[CategoryNode]:
    categories_by_floor: dict[int, list[Category]] = defaultdict(list)
    for category in categories:
        categories_by_floor[category.floor].append(category)

    nodes_by_id: dict[int, CategoryNode] = {}
    for floor in sorted(categories_by_floor):
        for category in categories_by_floor[floor]:
            nodes_by_id[category.id] = CategoryNode.model_validate(category)

    roots: list[CategoryNode] = []
    for floor in sorted(categories_by_floor):
        for category in categories_by_floor[floor]:
            node = nodes_by_id[category.id]
            if category.parentId is None:
                roots.append(node)
                continue
            parent = nodes_by_id.get(category.parentId)
            if parent is not None:
                parent.children.append(node)
    return roots
