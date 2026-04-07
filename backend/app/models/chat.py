from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """채팅 요청 모델"""
    session_id: str | None = None
    category: str = Field(..., description="법률 분야: civil, criminal, family, labor, realestate")
    message: str = Field(..., min_length=1, max_length=2000)


class PrecedentInfo(BaseModel):
    """판례 정보 (응답에 포함)"""
    id: str
    case_number: str
    court: str
    decided_at: str
    summary: str
    link: str = ""


class MessageResponse(BaseModel):
    """메시지 응답 모델"""
    id: str
    role: str
    content: str
    precedents: list[PrecedentInfo] = []


class ChatResponse(BaseModel):
    """채팅 응답 모델"""
    session_id: str
    message: MessageResponse
