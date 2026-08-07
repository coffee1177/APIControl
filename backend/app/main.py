from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health.router import router as health_router
from app.core.config import settings

app = FastAPI(title="APIControl", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
