from app.db import models  # noqa: F401
from app.db.base import Base
from app.db.session import engine
from sqlalchemy import inspect, text


LEGACY_BOOKMARK_TABLE = "web-bookmarks"
WEB_LIST_TABLE = "web-list"


def _migrate_legacy_web_list_table() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if LEGACY_BOOKMARK_TABLE not in tables:
        return

    with engine.begin() as conn:
        if WEB_LIST_TABLE not in tables:
            conn.execute(
                text(
                    f'ALTER TABLE "{LEGACY_BOOKMARK_TABLE}" RENAME TO "{WEB_LIST_TABLE}"'
                )
            )
            return

        legacy_count = conn.execute(
            text(f'SELECT COUNT(*) FROM "{LEGACY_BOOKMARK_TABLE}"')
        ).scalar_one()
        if legacy_count:
            conn.execute(text("PRAGMA foreign_keys=OFF"))
            conn.execute(
                text(
                    f"""
                    INSERT OR IGNORE INTO "{WEB_LIST_TABLE}"
                        (id, title, url, description, categoryId, createdAt, updatedAt)
                    SELECT
                        id, title, url, description, categoryId, createdAt, updatedAt
                    FROM "{LEGACY_BOOKMARK_TABLE}"
                    """
                )
            )
            conn.execute(text(f'DROP TABLE "{LEGACY_BOOKMARK_TABLE}"'))
            conn.execute(text("PRAGMA foreign_keys=ON"))
            return

        conn.execute(text(f'DROP TABLE "{LEGACY_BOOKMARK_TABLE}"'))


def init_database() -> None:
    _migrate_legacy_web_list_table()
    Base.metadata.create_all(bind=engine)
