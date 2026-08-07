import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.web.categories.service import build_category_tree
from app.db.base import Base
from app.db.models import Category
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_category_crud_and_tree(client: TestClient) -> None:
    root = client.post("/web/categories", json={"name": "开发", "parentId": None})
    assert root.status_code == 201
    root_data = root.json()
    assert root_data["floor"] == 1

    child = client.post(
        "/web/categories",
        json={"name": "API 文档", "parentId": root_data["id"]},
    )
    assert child.status_code == 201
    child_data = child.json()
    assert child_data["floor"] == 2

    tree = client.get("/web/categories")
    assert tree.status_code == 200
    assert tree.json()[0]["children"][0]["name"] == "API 文档"

    renamed = client.put(
        f"/web/categories/{child_data['id']}",
        json={"name": "接口文档"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "接口文档"

    blocked = client.delete(f"/web/categories/{root_data['id']}")
    assert blocked.status_code == 409
    assert client.delete(f"/web/categories/{child_data['id']}").status_code == 204
    assert client.delete(f"/web/categories/{root_data['id']}").status_code == 204


def test_category_validation_and_move(client: TestClient) -> None:
    first_root = client.post("/web/categories", json={"name": "开发"}).json()
    second_root = client.post("/web/categories", json={"name": "生活"}).json()
    child = client.post(
        "/web/categories",
        json={"name": "工具", "parentId": first_root["id"]},
    ).json()

    duplicate = client.post("/web/categories", json={"name": "开发"})
    assert duplicate.status_code == 409

    third_floor = client.post(
        "/web/categories",
        json={"name": "三级", "parentId": child["id"]},
    )
    assert third_floor.status_code == 400

    cycle = client.put(
        f"/web/categories/{first_root['id']}",
        json={"parentId": child["id"]},
    )
    assert cycle.status_code == 400

    moved = client.put(
        f"/web/categories/{child['id']}",
        json={"parentId": second_root["id"]},
    )
    assert moved.status_code == 200
    assert moved.json()["parentId"] == second_root["id"]
    assert moved.json()["floor"] == 2

    moved_to_root = client.put(
        f"/web/categories/{child['id']}",
        json={"parentId": None},
    )
    assert moved_to_root.status_code == 200
    assert moved_to_root.json()["parentId"] is None
    assert moved_to_root.json()["floor"] == 1


def test_tree_builder_supports_more_than_two_floors() -> None:
    categories = [
        Category(id=1, name="第一层", parentId=None, floor=1),
        Category(id=2, name="第二层", parentId=1, floor=2),
        Category(id=3, name="第三层", parentId=2, floor=3),
        Category(id=4, name="第四层", parentId=3, floor=4),
    ]

    tree = build_category_tree(categories)

    assert tree[0].children[0].children[0].children[0].name == "第四层"
