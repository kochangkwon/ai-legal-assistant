import logging
import uuid

from fastapi import APIRouter, HTTPException

from app.models.chat import ChatRequest, ChatResponse, MessageResponse, PrecedentInfo
from app.models.common import APIResponse
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)
router = APIRouter()
chat_service = ChatService()


@router.post("/chat", response_model=APIResponse)
async def chat(request: ChatRequest) -> APIResponse:
    """법률 상담 채팅 엔드포인트"""
    try:
        result = await chat_service.process_chat(
            session_id=request.session_id,
            category=request.category,
            message=request.message,
        )
        return APIResponse(success=True, data=result.model_dump())
    except Exception as e:
        logger.error("채팅 처리 실패: %s", e)
        raise HTTPException(status_code=500, detail="채팅 처리 중 오류가 발생했습니다") from e
