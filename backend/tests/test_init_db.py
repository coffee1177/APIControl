from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import StaticPool

from app.db import init_db


def test_init_database_renames_legacy_bookmark_table(monkeypatch) -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    with engine.begin() as conn:
        conn.execute(
            text(
                'CREATE TABLE "web-bookmarks" ('
                "id INTEGER PRIMARY KEY, "
                "title VARCHAR(200) NOT NULL, "
                "url VARCHAR(2048) NOT NULL, "
                "description VARCHAR(500), "
                'categoryId INTEGER, '
                'createdAt DATETIME NOT NULL, '
                'updatedAt DATETIME NOT NULL'
                ")"
            )
        )

    monkeypatch.setattr(init_db, "engine", engine)

    init_db.init_database()

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    assert "web-bookmarks" not in tables
    assert "web-list" in tables
