from __future__ import annotations

import logging
from abc import ABC, abstractmethod

from app.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """LLM 프로바이더 인터페이스"""

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        pass


class LLMService:
    """LLM 서비스 — 프로바이더 전환은 .env의 LLM_PROVIDER만 변경"""

    def __init__(self):
        provider_name = settings.llm_provider

        if provider_name == "gemini":
            from app.services.gemini_provider import GeminiProvider
            self.provider: LLMProvider = GeminiProvider()
        elif provider_name == "claude":
            from app.services.claude_provider import ClaudeProvider
            self.provider = ClaudeProvider()
        else:
            raise ValueError(f"지원하지 않는 LLM 프로바이더: {provider_name}")

        self.provider_name = provider_name
        logger.info("LLM 프로바이더 초기화: %s", provider_name)

    async def generate_legal_response(
        self,
        question: str,
        precedents: str,
        laws: str,
        category: str,
        conversation_history: str = "",
    ) -> str:
        """판례 기반 법률 답변 생성"""
        from app.prompts.legal_advisor import LEGAL_ADVISOR_PROMPT

        prompt = LEGAL_ADVISOR_PROMPT.format(
            category=category,
            precedents=precedents,
            laws=laws if laws else "관련 법령 정보 없음",
            user_message=question,
            conversation_history=conversation_history if conversation_history else "없음",
        )

        return await self.provider.generate(prompt)
