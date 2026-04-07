import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from supabase import create_client, Client

from app.config import settings

logger = logging.getLogger(__name__)


def _get_client() -> Client:
    """Supabase 클라이언트 생성 (모듈 레벨 캐시)"""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key or settings.supabase_key,
    )


class SupabaseService:
    """Supabase 데이터베이스 연동 서비스 (asyncio.to_thread로 비동기 래핑)"""

    def __init__(self):
        self._client: Client | None = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = _get_client()
        return self._client

    # ============================================
    # 채팅 세션
    # ============================================

    async def create_session(
        self, session_id: str, category: str, user_id: str | None = None
    ) -> dict[str, Any]:
        """새 채팅 세션 생성"""
        data: dict[str, Any] = {
            "id": session_id,
            "category": category,
        }
        if user_id:
            data["user_id"] = user_id

        result = await asyncio.to_thread(
            lambda: self.client.table("chat_sessions").insert(data).execute()
        )
        logger.info("세션 생성: %s", session_id)
        return result.data[0] if result.data else data

    async def update_session_title(self, session_id: str, title: str) -> None:
        """세션 제목 업데이트 (첫 질문에서 자동 생성)"""
        await asyncio.to_thread(
            lambda: self.client.table("chat_sessions")
            .update({"title": title})
            .eq("id", session_id)
            .execute()
        )

    async def get_user_sessions(self, user_id: str | None = None) -> list[dict]:
        """사용자의 채팅 세션 목록 조회"""

        def _query():
            q = (
                self.client.table("chat_sessions")
                .select("id, category, title, created_at")
                .order("created_at", desc=True)
            )
            if user_id:
                q = q.eq("user_id", user_id)
            return q.limit(50).execute()

        result = await asyncio.to_thread(_query)
        return result.data or []

    async def get_session(self, session_id: str) -> dict | None:
        """특정 세션 조회"""
        result = await asyncio.to_thread(
            lambda: self.client.table("chat_sessions")
            .select("*")
            .eq("id", session_id)
            .maybe_single()
            .execute()
        )
        return result.data

    # ============================================
    # 메시지
    # ============================================

    async def save_message(
        self,
        session_id: str,
        role: str,
        content: str,
        precedents: list[dict] | None = None,
        llm_provider: str | None = None,
    ) -> dict[str, Any]:
        """메시지 저장"""
        data: dict[str, Any] = {
            "session_id": session_id,
            "role": role,
            "content": content,
        }
        if precedents:
            data["precedents"] = precedents
        if llm_provider:
            data["llm_provider"] = llm_provider

        result = await asyncio.to_thread(
            lambda: self.client.table("messages").insert(data).execute()
        )
        return result.data[0] if result.data else data

    async def get_session_messages(self, session_id: str) -> list[dict]:
        """세션의 메시지 목록 조회"""
        result = await asyncio.to_thread(
            lambda: self.client.table("messages")
            .select("id, role, content, precedents, created_at")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .execute()
        )
        return result.data or []

    async def get_conversation_history(
        self, session_id: str, limit: int = 10
    ) -> str:
        """대화 맥락 문자열로 반환 (Claude 프롬프트용)"""
        messages = await self.get_session_messages(session_id)
        recent = messages[-limit:]
        if not recent:
            return ""

        lines = []
        for msg in recent:
            prefix = "사용자" if msg["role"] == "user" else "AI"
            content = msg["content"][:300]
            lines.append(f"{prefix}: {content}")
        return "\n".join(lines)

    # ============================================
    # 판례 캐시
    # ============================================

    async def get_cached_precedent(self, precedent_id: str) -> dict | None:
        """캐시된 판례 조회 (만료 확인)"""
        now = datetime.now(timezone.utc).isoformat()
        result = await asyncio.to_thread(
            lambda: self.client.table("precedent_cache")
            .select("*")
            .eq("id", precedent_id)
            .gte("expires_at", now)
            .maybe_single()
            .execute()
        )
        if result.data:
            logger.debug("판례 캐시 히트: %s", precedent_id)
        return result.data

    async def cache_precedent(self, precedent: dict) -> None:
        """판례 캐시 저장 (upsert)"""
        await asyncio.to_thread(
            lambda: self.client.table("precedent_cache").upsert(precedent).execute()
        )
        logger.debug("판례 캐시 저장: %s", precedent.get("id"))

    # ============================================
    # LLM 사용량
    # ============================================

    async def record_llm_usage(
        self, provider: str, model: str,
        input_tokens: int | None = None, output_tokens: int | None = None,
    ) -> None:
        """LLM 사용량 기록"""
        await asyncio.to_thread(
            lambda: self.client.table("llm_usage").insert({
                "provider": provider,
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
            }).execute()
        )

    # ============================================
    # 세션 + 메시지 수
    # ============================================

    async def get_session_with_message_count(
        self, user_id: str | None = None
    ) -> list[dict]:
        """세션 목록 + 메시지 수 조회"""
        sessions = await self.get_user_sessions(user_id)
        for session in sessions:
            count_result = await asyncio.to_thread(
                lambda sid=session["id"]: self.client.table("messages")
                .select("id", count="exact")
                .eq("session_id", sid)
                .execute()
            )
            session["message_count"] = count_result.count or 0
        return sessions
