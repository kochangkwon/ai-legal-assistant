from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routers import chat, history, precedent

# 로깅 설정
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Rate Limiter (전역 — 모든 엔드포인트에 기본 적용)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.rate_limit],
)

app = FastAPI(
    title=settings.app_name,
    description="한국 법률 판례 기반 AI 법률 정보 제공 서비스",
    version="1.0.0",
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "data": None,
            "error": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
        },
    )


# CORS 설정 (환경변수 기반)
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(precedent.router, prefix="/api", tags=["precedent"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
