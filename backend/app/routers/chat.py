import logging

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models.chat import ChatRequest
from app.models.common import APIResponse
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
chat_service = ChatService()


@router.post("/chat", response_model=APIResponse)
@limiter.limit("10/minute")
async def chat(request: Request, body: ChatRequest) -> APIResponse:
    """법률 상담 채팅 엔드포인트 (분당 10회 제한)"""
    try:
        result = await chat_service.process_chat(
            session_id=body.session_id,
            category=body.category,
            message=body.message,
        )
        return APIResponse(success=True, data=result.model_dump())
    except Exception as e:
        logger.error("채팅 처리 실패: %s", e)
        raise HTTPException(status_code=500, detail="채팅 처리 중 오류가 발생했습니다") from e
