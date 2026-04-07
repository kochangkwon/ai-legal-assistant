import logging

from app.config import settings
from app.services.llm_service import LLMProvider

logger = logging.getLogger(__name__)


class ClaudeProvider(LLMProvider):
    """Anthropic Claude 구현체 (교체 대비)"""

    def __init__(self):
        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.claude_model

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        response = await self.client.messages.create(
            model=self._model,
            max_tokens=2048,
            system=system_prompt if system_prompt else "",
            messages=[{"role": "user", "content": prompt}],
        )
        if not response.content:
            logger.error("Claude 응답이 비어있습니다")
            return "죄송합니다. 답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요."
        return response.content[0].text

    async def is_available(self) -> bool:
        try:
            await self.generate("test", "respond with 'ok'")
            return True
        except Exception:
            return False
