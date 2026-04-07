import json
import logging
import uuid

from app.config import settings
from app.models.chat import ChatResponse, MessageResponse, PrecedentInfo
from app.services.keyword_extractor import extract_keywords
from app.services.law_mcp_service import LawMCPService
from app.services.llm_service import LLMService
from app.services.supabase_service import SupabaseService
from app.services.usage_tracker import usage_tracker

logger = logging.getLogger(__name__)


class ChatService:
    """채팅 비즈니스 로직"""

    def __init__(self):
        self.llm_service = LLMService()
        self.law_mcp_service = LawMCPService()
        self.supabase_service = SupabaseService()

    async def process_chat(
        self,
        session_id: str | None,
        category: str,
        message: str,
    ) -> ChatResponse:
        """채팅 처리 파이프라인: 키워드 추출(규칙) → 판례 검색 → 답변 생성 → 이력 저장"""

        is_new_session = session_id is None
        if not session_id:
            session_id = str(uuid.uuid4())

        # 새 세션이면 DB에 생성
        if is_new_session:
            await self.supabase_service.create_session(session_id, category)

        # 사용자 메시지 저장
        await self.supabase_service.save_message(session_id, "user", message)

        # 이전 대화 맥락 로드
        conversation_history = ""
        if not is_new_session:
            conversation_history = await self.supabase_service.get_conversation_history(
                session_id, limit=6
            )

        # 1. 키워드 추출 (규칙 기반, LLM 미사용)
        keywords = extract_keywords(message, category)
        logger.info("키워드 추출 (규칙 기반): %s", keywords)

        # 2. 판례 검색
        search_query = " ".join(keywords)
        logger.info("판례 검색: %s", search_query)
        precedent_results = await self.law_mcp_service.search_precedents(
            search_query, count=5
        )

        # 3. 상위 판례 전문 조회 (최대 3건, 캐시 우선)
        precedent_texts = []
        precedent_infos: list[PrecedentInfo] = []

        for item in precedent_results[:3]:
            if not isinstance(item, dict):
                continue

            text_data = item.get("text", "")
            try:
                parsed = json.loads(text_data) if isinstance(text_data, str) else text_data
            except json.JSONDecodeError:
                parsed = {"summary": text_data}

            prec_id = parsed.get("판례일련번호", "")
            if not prec_id:
                continue

            # 캐시 확인
            cached = await self.supabase_service.get_cached_precedent(prec_id)
            if cached:
                precedent_texts.append(
                    f"[{cached['court']}] {cached['case_number']} ({cached['decided_at']})\n"
                    f"{cached['summary']}"
                )
                precedent_infos.append(PrecedentInfo(
                    id=prec_id,
                    case_number=cached["case_number"],
                    court=cached["court"],
                    decided_at=cached["decided_at"],
                    summary=cached["summary"][:200],
                ))
                continue

            # MCP에서 전문 조회
            detail = await self.law_mcp_service.get_precedent_text(prec_id)
            if detail:
                precedent_texts.append(str(detail))

                case_number = parsed.get("사건번호", "")
                court = parsed.get("법원명", "")
                decided_at = parsed.get("선고일자", "")
                summary = parsed.get("판례내용", "")[:500]

                precedent_infos.append(PrecedentInfo(
                    id=prec_id,
                    case_number=case_number,
                    court=court,
                    decided_at=decided_at,
                    summary=summary[:200],
                ))

                # 캐시 저장
                await self.supabase_service.cache_precedent({
                    "id": prec_id,
                    "case_number": case_number,
                    "court": court,
                    "decided_at": decided_at,
                    "case_name": parsed.get("사건명", ""),
                    "summary": summary,
                    "full_text": str(detail)[:10000],
                    "category": category,
                })

        # 4. 답변 생성 (LLM 한도 확인)
        precedents_context = (
            "\n\n---\n\n".join(precedent_texts)
            if precedent_texts
            else "관련 판례를 찾지 못했습니다."
        )

        mode = "ai_analysis"

        if await usage_tracker.try_consume():
            remaining = await usage_tracker.remaining()
            logger.info(
                "LLM 답변 생성 (%s, 남은 횟수: %d)",
                self.llm_service.provider_name,
                remaining,
            )
            answer = await self.llm_service.generate_legal_response(
                question=message,
                precedents=precedents_context,
                laws="",
                category=category,
                conversation_history=conversation_history,
            )

            # LLM 사용량 DB 기록
            await self.supabase_service.record_llm_usage(
                provider=self.llm_service.provider_name,
                model=getattr(settings, f"{self.llm_service.provider_name}_model", ""),
            )
        else:
            # 한도 초과 → 판례 나열 모드
            logger.warning("LLM 일일 한도 초과 — 판례 나열 모드로 전환")
            answer = self._fallback_response(precedent_infos, precedents_context)
            mode = "precedent_only"

        # 5. AI 답변 저장
        precedent_dicts = [p.model_dump() for p in precedent_infos]
        saved_msg = await self.supabase_service.save_message(
            session_id,
            "assistant",
            answer,
            precedent_dicts,
            llm_provider=self.llm_service.provider_name,
        )

        # 6. 첫 메시지면 세션 제목 자동 생성
        if is_new_session:
            title = message[:30] + ("..." if len(message) > 30 else "")
            await self.supabase_service.update_session_title(session_id, title)

        return ChatResponse(
            session_id=session_id,
            message=MessageResponse(
                id=saved_msg.get("id", str(uuid.uuid4())),
                role="assistant",
                content=answer,
                precedents=precedent_infos,
            ),
            mode=mode,
            llm_provider=self.llm_service.provider_name,
        )

    def _fallback_response(
        self, precedent_infos: list[PrecedentInfo], precedents_context: str
    ) -> str:
        """LLM 한도 초과 시 판례 나열 응답"""
        if not precedent_infos:
            return (
                "현재 AI 분석 서비스가 일시적으로 제한되어 있습니다. "
                "관련 판례를 찾지 못했습니다. 잠시 후 다시 시도해주세요.\n\n"
                "본 내용은 법률 정보 제공 목적이며, 변호사의 법률 자문을 대체하지 않습니다."
            )

        lines = ["**검색된 관련 판례**\n"]
        for i, p in enumerate(precedent_infos, 1):
            lines.append(
                f"{i}. [{p.court}] {p.case_number} ({p.decided_at})\n"
                f"   {p.summary}\n"
            )
        lines.append(
            "\n> AI 분석 서비스가 일일 한도에 도달하여 판례 원문만 제공합니다. "
            "자세한 분석이 필요하시면 내일 다시 이용해 주세요.\n\n"
            "본 내용은 법률 정보 제공 목적이며, 변호사의 법률 자문을 대체하지 않습니다."
        )
        return "\n".join(lines)
