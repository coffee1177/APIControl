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


def test_destroy_specific_database(client: TestClient) -> None:
    created = client.post("/web/categories", json={"name": "开发", "parentId": None})
    assert created.status_code == 201

    destroyed = client.delete("/destroy/web-categories")
    assert destroyed.status_code == 200
    assert destroyed.json()["destroyed"] == ["web-categories"]
    assert client.get("/web/categories").json() == []


def test_destroy_all_resets_system_data(client: TestClient) -> None:
    created = client.post("/web/categories", json={"name": "运营", "parentId": None})
    assert created.status_code == 201

    destroyed = client.delete("/destroy/all")
    assert destroyed.status_code == 200
    assert destroyed.json()["reset_all"] is True
    assert client.get("/web/categories").json() == []
