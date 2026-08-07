from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.web.categories.router import router as web_categories_router
from app.api.health.router import router as health_router
from app.core.config import settings
from app.db.init_db import init_database


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    init_database()
    yield


app = FastAPI(
    title="APIControl",
    version="0.0.1",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "web", "description": "网站记录相关接口"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(web_categories_router)
