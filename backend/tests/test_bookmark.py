import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
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


def test_bookmark_crud_and_category_block(client: TestClient) -> None:
    category = client.post("/web/categories", json={"name": "development", "parentId": None})
    assert category.status_code == 201
    category_id = category.json()["id"]

    created = client.post(
        "/web/list",
        json={
            "title": "FastAPI",
            "url": "https://fastapi.tiangolo.com/",
            "description": "Python web framework",
            "categoryId": category_id,
        },
    )
    assert created.status_code == 201
    bookmark = created.json()
    assert bookmark["title"] == "FastAPI"
    assert bookmark["categoryName"] == "development"
    assert bookmark["createdAt"] is not None
    assert bookmark["updatedAt"] is not None

    listed = client.get("/web/list")
    assert listed.status_code == 200
    page = listed.json()
    assert page["total"] == 0
    assert page["items"] == []

    all_listed = client.get("/web/list?isAll=true")
    assert all_listed.status_code == 200
    all_page = all_listed.json()
    assert all_page["total"] == 1
    assert all_page["items"][0]["id"] == bookmark["id"]

    blocked = client.delete(f"/web/categories/{category_id}")
    assert blocked.status_code == 409

    updated = client.put(
        f"/web/list/{bookmark['id']}",
        json={
            "title": "FastAPI Docs",
            "categoryId": None,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "FastAPI Docs"
    assert updated.json()["categoryId"] is None
    assert updated.json()["categoryName"] is None

    deleted = client.delete(f"/web/list/{bookmark['id']}")
    assert deleted.status_code == 204

    assert client.delete(f"/web/categories/{category_id}").status_code == 204


def test_bookmark_pagination_and_filter(client: TestClient) -> None:
    root = client.post("/web/categories", json={"name": "tools", "parentId": None}).json()
    child = client.post(
        "/web/categories",
        json={"name": "docs", "parentId": root["id"]},
    ).json()

    client.post(
        "/web/list",
        json={"title": "FastAPI", "url": "https://fastapi.tiangolo.com/"},
    )
    client.post(
        "/web/list",
        json={
            "title": "SQLAlchemy",
            "url": "https://www.sqlalchemy.org/",
            "categoryId": root["id"],
        },
    )
    client.post(
        "/web/list",
        json={
            "title": "Python",
            "url": "https://www.python.org/",
            "categoryId": child["id"],
        },
    )

    page = client.get("/web/list?page=1&size=2&isAll=true")
    assert page.status_code == 200
    data = page.json()
    assert data["page"] == 1
    assert data["size"] == 2
    assert data["total"] == 3
    assert len(data["items"]) == 2

    filtered = client.get(f"/web/list?categoryId={root['id']}")
    assert filtered.status_code == 200
    filtered_data = filtered.json()
    assert filtered_data["total"] == 1
    assert filtered_data["items"][0]["title"] == "SQLAlchemy"
