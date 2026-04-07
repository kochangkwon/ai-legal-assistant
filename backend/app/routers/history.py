import logging

from fastapi import APIRouter, HTTPException

from app.models.common import APIResponse
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter()
supabase_service = SupabaseService()


@router.get("/history", response_model=APIResponse)
async def get_history() -> APIResponse:
    """대화 이력 목록 조회 (세션 + 메시지 수)"""
    try:
        sessions = await supabase_service.get_session_with_message_count()
        return APIResponse(success=True, data=sessions)
    except Exception as e:
        logger.error("이력 조회 실패: %s", e)
        raise HTTPException(status_code=500, detail="이력 조회 중 오류가 발생했습니다") from e


@router.get("/history/{session_id}", response_model=APIResponse)
async def get_session_messages(session_id: str) -> APIResponse:
    """특정 세션의 메시지 목록 조회"""
    try:
        # 세션 존재 확인
        session = await supabase_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")

        messages = await supabase_service.get_session_messages(session_id)
        return APIResponse(
            success=True,
            data={
                "session": session,
                "messages": messages,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("세션 메시지 조회 실패: %s", e)
        raise HTTPException(status_code=500, detail="메시지 조회 중 오류가 발생했습니다") from e
