import json
import logging

import anthropic

from app.config import settings
from app.prompts.keyword_extraction import KEYWORD_EXTRACTION_PROMPT
from app.prompts.legal_advisor import LEGAL_ADVISOR_PROMPT

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-20250514"


class ClaudeService:
    """Claude API 연동 서비스"""

    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def extract_keywords(self, category: str, user_message: str) -> list[str]:
        """사용자 질문에서 법률 키워드 추출"""
        prompt = KEYWORD_EXTRACTION_PROMPT.format(
            category=category,
            user_message=user_message,
        )
        try:
            response = await self.client.messages.create(
                model=MODEL,
                max_tokens=256,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            keywords = json.loads(text)
            logger.info("키워드 추출 완료: %s", keywords)
            return keywords
        except (json.JSONDecodeError, IndexError) as e:
            logger.error("키워드 파싱 실패: %s", e)
            # 파싱 실패 시 원본 메시지를 키워드로 사용
            return [user_message]

    async def generate_legal_response(
        self,
        category: str,
        user_message: str,
        precedents: str,
        laws: str = "",
        conversation_history: str = "",
    ) -> str:
        """판례 기반 법률 답변 생성"""
        prompt = LEGAL_ADVISOR_PROMPT.format(
            category=category,
            user_message=user_message,
            precedents=precedents,
            laws=laws if laws else "관련 법령 정보 없음",
            conversation_history=conversation_history if conversation_history else "없음",
        )
        try:
            response = await self.client.messages.create(
                model=MODEL,
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        except Exception as e:
            logger.error("법률 답변 생성 실패: %s", e)
            raise
