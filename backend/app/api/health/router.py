from fastapi import APIRouter

router = APIRouter(tags=["系统"])


@router.get("/health")
async def health_check() -> dict[str, object]:
    return {"success": True, "message": "APIControl 后端运行正常"}
