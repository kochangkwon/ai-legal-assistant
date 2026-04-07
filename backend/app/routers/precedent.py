import logging

from fastapi import APIRouter, HTTPException, Query

from app.models.common import APIResponse
from app.services.law_mcp_service import LawMCPService
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter()
law_mcp_service = LawMCPService()
supabase_service = SupabaseService()


@router.get("/precedent/{precedent_id}", response_model=APIResponse)
async def get_precedent(precedent_id: str) -> APIResponse:
    """판례 상세 조회 (캐시 우선, 없으면 MCP 조회)"""
    try:
        # 1. 캐시 확인
        cached = await supabase_service.get_cached_precedent(precedent_id)
        if cached:
            return APIResponse(success=True, data=cached)

        # 2. MCP에서 조회
        result = await law_mcp_service.get_precedent_text(precedent_id)
        if not result:
            raise HTTPException(status_code=404, detail="판례를 찾을 수 없습니다")

        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("판례 조회 실패 (id=%s): %s", precedent_id, e)
        raise HTTPException(status_code=500, detail="판례 조회 중 오류가 발생했습니다") from e


@router.get("/precedent/search/{query}", response_model=APIResponse)
async def search_precedents(query: str, count: int = Query(default=5, ge=1, le=20)) -> APIResponse:
    """판례 검색"""
    try:
        results = await law_mcp_service.search_precedents(query, count=count)
        return APIResponse(success=True, data=results)
    except Exception as e:
        logger.error("판례 검색 실패: %s", e)
        raise HTTPException(status_code=500, detail="판례 검색 중 오류가 발생했습니다") from e
