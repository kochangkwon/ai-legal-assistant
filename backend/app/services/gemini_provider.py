import asyncio
import logging

from app.config import settings
from app.services.llm_service import LLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """Google Gemini 구현체"""

    def __init__(self):
        import google.generativeai as genai
        from google.generativeai.types import HarmCategory, HarmBlockThreshold

        genai.configure(api_key=settings.gemini_api_key)

        # 법률 콘텐츠 안전 필터 완화
        self._safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
        self._model_name = settings.gemini_model

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        import google.generativeai as genai

        def _call():
            model = genai.GenerativeModel(
                model_name=self._model_name,
                system_instruction=system_prompt if system_prompt else None,
                safety_settings=self._safety_settings,
            )
            return model.generate_content(prompt)

        try:
            response = await asyncio.to_thread(_call)

            # 안전 필터 차단 확인
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                logger.warning(
                    "Gemini 안전 필터 차단: %s", response.prompt_feedback.block_reason
                )
                return self._safety_fallback_message()

            # candidates 빈 배열 방어
            if not response.candidates:
                logger.warning("Gemini 응답에 candidates가 없습니다")
                return self._safety_fallback_message()

            candidate = response.candidates[0]
            if not candidate.content or not candidate.content.parts:
                logger.warning("Gemini candidate에 content/parts가 없습니다")
                return self._safety_fallback_message()

            return response.text

        except Exception as e:
            logger.error("Gemini API 호출 실패: %s", e)
            raise

    async def is_available(self) -> bool:
        try:
            await self.generate("test", "respond with 'ok'")
            return True
        except Exception:
            return False

    def _safety_fallback_message(self) -> str:
        return (
            "죄송합니다. 해당 질문에 대해 AI가 답변을 생성하지 못했습니다.\n"
            "검색된 판례 정보를 직접 확인해 주시거나, "
            "전문 변호사 상담을 권유드립니다."
        )
