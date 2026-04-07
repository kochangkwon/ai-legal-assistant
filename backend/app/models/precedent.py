from pydantic import BaseModel


class PrecedentDetail(BaseModel):
    """판례 상세 모델"""
    id: str
    case_number: str
    court: str
    decided_at: str
    case_name: str
    summary: str
    full_text: str
    related_laws: list[str] = []
    link: str = ""


class PrecedentSearchResult(BaseModel):
    """판례 검색 결과"""
    id: str
    case_number: str
    court: str
    decided_at: str
    case_name: str
    summary: str
