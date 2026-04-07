from typing import Any

from pydantic import BaseModel


class APIResponse(BaseModel):
    """통일된 API 응답 포맷"""
    success: bool
    data: Any = None
    error: str | None = None
    message: str | None = None
