# AI Legal Assistant (AI 법률 도우미) 개발지시서 v2.0

## 변경 이력
| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-04-07 | 초기 작성 (Claude API 기준) |
| v2.0 | 2026-04-07 | Gemini API로 변경, LLM 추상화 레이어 추가, 비용 최적화 |

---

## 1. 프로젝트 개요

### 1.1 서비스 설명
한국 법률 판례 기반 AI 법률 자문 모바일 앱. 사용자가 법률 관련 질문을 입력하면, 관련 판례와 법령을 검색하여 AI가 쉬운 말로 법률 정보를 제공하는 서비스.

### 1.2 핵심 면책 조항
> **⚠️ 본 서비스는 법률 정보 제공 목적이며, 변호사의 법률 자문을 대체하지 않습니다.**
> 앱 전체에 이 면책 고지를 반드시 포함할 것. (온보딩, 채팅 답변 하단, 설정 페이지)

### 1.3 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 모바일 앱 | React Native + Expo (TypeScript) | 네이티브 앱 (iOS/Android) |
| 백엔드 API | FastAPI (Python 3.11+) | REST API 서버 |
| 법률 데이터 | korean-law-mcp (chrisryugj) | Docker 자체 배포 |
| AI 엔진 | **Gemini 2.5 Flash** (Google AI Studio) | 무료 티어, LLM 추상화로 교체 가능 |
| 데이터베이스 | Supabase (PostgreSQL) | 대화이력, 사용자 관리 |
| 개발 환경 | Cursor IDE + Claude Code | macOS |

### 1.4 비용 구조

| 항목 | 비용 | 비고 |
|------|------|------|
| Gemini Flash API | **무료** | 일 250회 제한 (무료 티어) |
| korean-law-mcp | **무료** | 법제처 Open API (무료) |
| Supabase | **무료** | Free Plan (500MB, 50K 월 요청) |
| 서버 호스팅 | 월 ~₩5,000~10,000 | fly.io / Railway 등 |
| **합계** | **월 ~₩10,000 이하** | 초기 단계 기준 |

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌──────────────────────────┐
│  React Native + Expo     │
│  (TypeScript)            │
│  ┌────────────────────┐  │
│  │ 채팅 UI            │  │
│  │ 법률 분야 선택      │  │
│  │ 판례 상세 뷰       │  │
│  │ 대화 이력 목록      │  │
│  └────────┬───────────┘  │
└───────────┼──────────────┘
            │ REST API (HTTPS)
┌───────────▼──────────────┐
│  FastAPI Backend         │
│                          │
│  ┌─────────────────────┐ │
│  │ LLM 추상화 레이어    │ │
│  │ (llm_service.py)    │ │
│  │ ┌─────┬──────┬────┐ │ │
│  │ │Gemini│Claude│GPT │ │ │  ← 한 줄로 전환 가능
│  │ └─────┴──────┴────┘ │ │
│  └────────┬────────────┘ │
│           │              │
│  ┌────────▼───────────┐  │
│  │ LawMCP Client      │──┼──→ korean-law-mcp (Docker)
│  │ (판례/법령 검색)     │  │     localhost:3000/mcp
│  └────────────────────┘  │
│           │              │
│  ┌────────▼───────────┐  │
│  │ Supabase Client    │──┼──→ Supabase (PostgreSQL)
│  └────────────────────┘  │
└──────────────────────────┘
```

### 2.2 요청 처리 플로우

```
1. 사용자: "임대차 보증금을 못 돌려받고 있어요" 입력
   + 법률 분야: "부동산/임대차" 선택 상태

2. FastAPI: 키워드 추출 (규칙 기반, LLM 미사용)
   → 분야 "부동산/임대차" + 형태소 분석
   → ["임대차", "보증금 반환", "주택임대차보호법"]

3. FastAPI: korean-law-mcp 호출 → 판례 검색
   → search_precedents("임대차 보증금 반환")
   → get_precedent_text(판례ID) × 상위 3건

4. FastAPI: Gemini Flash API 호출 → 판례 기반 답변 생성
   → 시스템 프롬프트 + 판례 데이터 + 사용자 질문

5. FastAPI: 응답 반환 + Supabase에 대화 이력 저장

6. 앱: 답변 표시 (법률 분석 + 판례 카드 + 행동 단계)
```

### 2.3 키워드 추출 방식 (LLM 미사용 — 비용 절감)

LLM을 키워드 추출에 사용하지 않고, 규칙 기반으로 처리하여 API 호출을 1회로 줄인다.

```python
# keyword_extractor.py — 규칙 기반 키워드 추출

# 법률 분야별 키워드 매핑
CATEGORY_KEYWORDS = {
    "civil": ["계약", "손해배상", "채무", "채권", "불법행위"],
    "criminal": ["폭행", "사기", "절도", "횡령", "배임"],
    "family": ["이혼", "양육권", "위자료", "재산분할", "상속"],
    "labor": ["해고", "임금", "퇴직금", "근로계약", "산재"],
    "realestate": ["임대차", "보증금", "전세", "월세", "매매", "등기"],
}

# 법률 용어 변환 사전
LEGAL_TERM_MAP = {
    "월급 안 줘": "임금 체불",
    "보증금 안 줘": "보증금 반환",
    "잘렸어": "부당해고",
    "이혼하고 싶": "이혼 청구",
    "집주인이 안 줘": "임대차 보증금 반환",
    "사기 당했": "사기죄",
    "맞았": "폭행죄",
    "돈 안 갚": "채무불이행",
}

def extract_keywords(message: str, category: str) -> list[str]:
    """사용자 메시지에서 법률 키워드를 규칙 기반으로 추출"""
    keywords = []

    # 1. 법률 용어 변환
    for colloquial, legal in LEGAL_TERM_MAP.items():
        if colloquial in message:
            keywords.append(legal)

    # 2. 분야별 키워드 매칭
    for kw in CATEGORY_KEYWORDS.get(category, []):
        if kw in message:
            keywords.append(kw)

    # 3. 핵심 명사 추출 (간단한 규칙)
    # 실제 구현에서는 konlpy 등을 활용
    if not keywords:
        # fallback: 메시지 자체를 검색어로 사용
        keywords = [message[:30]]

    return list(set(keywords))[:5]
```

---

## 3. 프로젝트 디렉토리 구조

```
ai-legal-assistant/
├── .claude/                    # Claude Code Harness 설정
│   ├── settings.json
│   └── CLAUDE.md
├── .cursorrules                # Cursor IDE 규칙
├── mobile/                     # React Native (Expo) 앱
│   ├── app/                    # Expo Router (파일 기반 라우팅)
│   │   ├── (tabs)/
│   │   │   ├── index.tsx       # 홈 (법률 분야 선택)
│   │   │   ├── chat.tsx        # 채팅 화면
│   │   │   └── history.tsx     # 상담 이력
│   │   ├── chat/[id].tsx       # 개별 채팅방
│   │   ├── precedent/[id].tsx  # 판례 상세
│   │   └── _layout.tsx         # 루트 레이아웃
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── PrecedentCard.tsx
│   │   │   ├── LoadingSteps.tsx
│   │   │   └── DisclaimerBanner.tsx
│   │   ├── common/
│   │   │   ├── CategorySelector.tsx
│   │   │   └── Header.tsx
│   │   └── precedent/
│   │       └── PrecedentDetail.tsx
│   ├── hooks/
│   │   ├── useChat.ts
│   │   └── useHistory.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── supabase.ts
│   ├── types/
│   │   └── index.ts
│   ├── constants/
│   │   └── categories.ts
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routers/
│   │   │   ├── chat.py
│   │   │   ├── history.py
│   │   │   └── precedent.py
│   │   ├── services/
│   │   │   ├── llm_service.py      # ★ LLM 추상화 레이어
│   │   │   ├── gemini_provider.py   # Gemini 구현체
│   │   │   ├── claude_provider.py   # Claude 구현체 (교체 대비)
│   │   │   ├── law_mcp_service.py   # korean-law-mcp 연동
│   │   │   ├── keyword_extractor.py # 규칙 기반 키워드 추출
│   │   │   └── chat_service.py      # 채팅 비즈니스 로직
│   │   ├── models/
│   │   │   ├── chat.py
│   │   │   └── precedent.py
│   │   └── prompts/
│   │       └── legal_advisor.py     # 법률 자문 프롬프트
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## 4. 환경 설정

### 4.1 사전 준비 (필수)

1. **법제처 API 키 발급**
   - https://open.law.go.kr 회원가입
   - OPEN API 활용 신청
   - 승인 후 가입 아이디 = LAW_OC 값
   - 사용할 서버 IP 등록 (로컬 개발: 본인 공인IP)

2. **Google AI Studio API 키 발급**
   - https://aistudio.google.com 접속
   - Google 계정으로 로그인
   - API 키 생성 (무료, 신용카드 불필요)

3. **Supabase 프로젝트**
   - https://supabase.com 에서 프로젝트 생성
   - URL, anon key, service role key 확보

### 4.2 환경변수 (.env)

```env
# Backend (.env)
# --- LLM 설정 ---
LLM_PROVIDER=gemini                        # "gemini" | "claude" | "openai"
GEMINI_API_KEY=AIzaSyXXXXX                 # Google AI Studio에서 발급
GEMINI_MODEL=gemini-2.5-flash-preview-05-20

# Claude 대비용 (선택)
# ANTHROPIC_API_KEY=sk-ant-xxxxx
# CLAUDE_MODEL=claude-sonnet-4-20250514

# --- 법률 MCP ---
LAW_OC=your_law_api_id
LAW_MCP_URL=http://localhost:3000/mcp

# --- 데이터베이스 ---
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Mobile (.env)
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

### 4.3 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  law-mcp:
    build:
      context: ./korean-law-mcp
    environment:
      - LAW_OC=${LAW_OC}
      - PORT=3000
      - CORS_ORIGIN=http://localhost:8000
      - RATE_LIMIT_RPM=120
    ports:
      - "3000:3000"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
    environment:
      - LLM_PROVIDER=${LLM_PROVIDER}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GEMINI_MODEL=${GEMINI_MODEL}
      - LAW_MCP_URL=http://law-mcp:3000/mcp
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - law-mcp
    restart: unless-stopped
```

---

## 5. LLM 추상화 레이어 (핵심 설계)

### 5.1 설계 원칙

Gemini 무료 티어로 시작하되, 언제든 다른 LLM으로 교체할 수 있도록 추상화한다.
교체가 필요한 상황: Gemini 안전 필터 이슈, 너프, 할당량 초과, 품질 불만족.

### 5.2 구현

```python
# backend/app/services/llm_service.py
from abc import ABC, abstractmethod
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    """LLM 프로바이더 인터페이스"""

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        pass


class GeminiProvider(LLMProvider):
    """Google Gemini 구현체"""

    def __init__(self):
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=None  # generate 시 동적 설정
        )

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        import google.generativeai as genai

        try:
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=system_prompt if system_prompt else None
            )
            response = model.generate_content(prompt)

            if response.prompt_feedback and response.prompt_feedback.block_reason:
                logger.warning(f"Gemini 안전 필터 차단: {response.prompt_feedback.block_reason}")
                return self._safety_fallback_message()

            return response.text

        except Exception as e:
            logger.error(f"Gemini API 호출 실패: {e}")
            raise

    async def is_available(self) -> bool:
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = model.generate_content("test")
            return True
        except Exception:
            return False

    def _safety_fallback_message(self) -> str:
        return (
            "죄송합니다. 해당 질문에 대해 AI가 답변을 생성하지 못했습니다.\n"
            "검색된 판례 정보를 직접 확인해 주시거나, "
            "전문 변호사 상담을 권유드립니다."
        )


class ClaudeProvider(LLMProvider):
    """Anthropic Claude 구현체 (교체 대비)"""

    def __init__(self):
        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        response = await self.client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

    async def is_available(self) -> bool:
        try:
            await self.generate("test", "respond with 'ok'")
            return True
        except Exception:
            return False


class LLMService:
    """LLM 서비스 — 프로바이더 전환은 .env의 LLM_PROVIDER만 변경"""

    def __init__(self):
        provider_name = settings.LLM_PROVIDER  # "gemini" | "claude"

        if provider_name == "gemini":
            self.provider = GeminiProvider()
        elif provider_name == "claude":
            self.provider = ClaudeProvider()
        else:
            raise ValueError(f"지원하지 않는 LLM 프로바이더: {provider_name}")

        self.provider_name = provider_name
        logger.info(f"LLM 프로바이더 초기화: {provider_name}")

    async def generate_legal_response(
        self,
        question: str,
        precedents: str,
        laws: str,
        category: str,
        conversation_history: str = ""
    ) -> str:
        """판례 기반 법률 답변 생성"""
        from app.prompts.legal_advisor import LEGAL_ADVISOR_PROMPT

        prompt = LEGAL_ADVISOR_PROMPT.format(
            category=category,
            precedents=precedents,
            laws=laws,
            user_message=question,
            conversation_history=conversation_history
        )

        return await self.provider.generate(prompt)
```

### 5.3 교체 방법

```bash
# .env 파일에서 한 줄만 변경
LLM_PROVIDER=gemini   →   LLM_PROVIDER=claude

# 추가로 해당 프로바이더의 API 키 설정
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

서버 재시작하면 즉시 전환됨.

---

## 6. Gemini API 연동 상세

### 6.1 설치

```bash
pip3 install --break-system-packages google-generativeai
```

### 6.2 사용 가능 모델

| 모델 | 용도 | 무료 한도 | 비고 |
|------|------|----------|------|
| gemini-2.5-flash-preview-05-20 | **메인 (추천)** | 일 250회 | 가성비 최고 |
| gemini-2.5-pro-preview-06-05 | 고품질 필요 시 | 일 100회 | 성능 최고 |
| gemini-2.5-flash-lite | 대량 처리 | 제한 넉넉 | 성능 낮음 |

### 6.3 안전 필터 대응

Gemini는 법률 관련 키워드(폭행, 사기, 살인 등)에서 안전 필터가 작동할 수 있다.
대응 방법:

```python
# 안전 설정을 조정 (가장 느슨하게)
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash-preview-05-20",
    safety_settings={
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }
)
```

필터에 걸릴 경우 fallback:
1. 판례 원문(MCP 결과)을 그대로 구조화해서 보여줌
2. "AI 해석을 생성하지 못했습니다. 판례 원문을 확인해 주세요." 메시지 표시

### 6.4 비용 모니터링

```python
# 일일 사용량 추적
class UsageTracker:
    def __init__(self):
        self.daily_count = 0
        self.daily_limit = 240  # 250에서 여유분 10 확보
        self.last_reset = date.today()

    def can_call(self) -> bool:
        if date.today() > self.last_reset:
            self.daily_count = 0
            self.last_reset = date.today()
        return self.daily_count < self.daily_limit

    def record_call(self):
        self.daily_count += 1

    def remaining(self) -> int:
        return self.daily_limit - self.daily_count
```

한도 초과 시 → Mode A(MCP 판례 나열만)로 자동 전환.

---

## 7. korean-law-mcp 연동

### 7.1 MCP 호출 방식

```python
# backend/app/services/law_mcp_service.py
import httpx
import logging

logger = logging.getLogger(__name__)

class LawMCPService:
    def __init__(self, mcp_url: str):
        self.mcp_url = mcp_url

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        """MCP 도구 호출"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.mcp_url,
                json={
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": tool_name,
                        "arguments": arguments
                    },
                    "id": 1
                }
            )
            result = response.json()
            if "error" in result:
                logger.error(f"MCP 오류: {result['error']}")
                return {}
            return result

    async def search_precedents(self, query: str, count: int = 5) -> list:
        """판례 검색"""
        result = await self.call_tool("search_precedents", {
            "query": query,
            "display": count
        })
        return result.get("result", {}).get("content", [])

    async def get_precedent_text(self, prec_id: str) -> dict:
        """판례 전문 조회"""
        result = await self.call_tool("get_precedent_text", {
            "id": prec_id
        })
        return result.get("result", {}).get("content", [])

    async def search_law(self, query: str) -> list:
        """법령 검색"""
        result = await self.call_tool("search_law", {
            "query": query
        })
        return result.get("result", {}).get("content", [])

    async def get_law_text(self, mst: str, jo: str = None) -> dict:
        """법령 조문 조회"""
        args = {"mst": mst}
        if jo:
            args["jo"] = jo
        result = await self.call_tool("get_law_text", args)
        return result.get("result", {}).get("content", [])

    async def find_similar_precedents(self, prec_id: str) -> list:
        """유사 판례 검색"""
        result = await self.call_tool("find_similar_precedents", {
            "id": prec_id
        })
        return result.get("result", {}).get("content", [])
```

### 7.2 주요 도구별 파라미터

| 도구 | 필수 파라미터 | 선택 파라미터 |
|------|-------------|-------------|
| search_precedents | query (검색어) | display (건수, 기본5), page |
| get_precedent_text | id (판례일련번호) | - |
| search_law | query (법령명) | display, page |
| get_law_text | mst (법령MST) | jo (조문번호 코드) |
| find_similar_precedents | id (판례일련번호) | - |
| search_interpretations | query (검색어) | display, page |

---

## 8. Gemini 프롬프트 설계

### 8.1 법률 자문 프롬프트

```python
# backend/app/prompts/legal_advisor.py

LEGAL_ADVISOR_PROMPT = """당신은 한국 법률 정보를 제공하는 AI 법률 도우미입니다.
아래 판례와 법령을 참고하여 사용자의 질문에 대해 법률 정보를 제공하세요.

## 중요 규칙
1. 이 답변은 법률 자문이 아닌 법률 정보 제공입니다
2. 반드시 제공된 판례를 근거로 답변하세요
3. 판례 인용 시 사건번호와 판결요지를 명시하세요
4. 구체적인 행동 지침을 단계별로 제시하세요
5. 일반인이 이해할 수 있는 쉬운 한국어로 설명하세요
6. 법률 전문 용어는 괄호 안에 쉬운 설명을 추가하세요
7. 필요 시 전문 변호사 상담을 권유하세요
8. 확실하지 않은 내용은 추측하지 마세요

## 답변 구조 (이 순서를 반드시 지키세요)
1. **법률 분석**: 사안에 적용되는 법리를 쉬운 말로 2~3문장
2. **관련 판례**: 유사 판례를 인용하며 핵심 내용 요약 (사건번호 포함)
3. **지금 할 수 있는 조치**: 사용자가 바로 실행할 수 있는 구체적 단계 (번호 매기기)
4. **주의사항**: 예외 상황이나 주의할 점 1~2가지

## 법률 분야: {category}

## 관련 판례:
{precedents}

## 관련 법령:
{laws}

## 사용자 질문:
{user_message}

## 이전 대화 맥락:
{conversation_history}
"""
```

### 8.2 Gemini 특화 주의사항

- Gemini는 마크다운 포맷으로 응답하는 경향이 강함 → 앱에서 마크다운 렌더링 필요
- 한국어 법률 용어를 비교적 잘 처리하지만, 간혹 일본 법률 용어와 혼동함 → 프롬프트에 "대한민국 법률" 명시
- 안전 필터가 형사 관련 키워드에 민감함 → safety_settings 조정 필수

---

## 9. 데이터베이스 스키마 (Supabase)

```sql
-- 사용자 테이블
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅 세션 테이블
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  precedents JSONB,
  llm_provider TEXT DEFAULT 'gemini',  -- 어떤 LLM이 생성했는지 추적
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 판례 캐시 테이블
CREATE TABLE precedent_cache (
  id TEXT PRIMARY KEY,
  case_number TEXT,
  court TEXT,
  decided_at TEXT,
  case_name TEXT,
  summary TEXT,
  full_text TEXT,
  category TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- LLM 사용량 추적 테이블
CREATE TABLE llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can read own sessions"
  ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions"
  ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
  );

-- 인덱스
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, created_at DESC);
CREATE INDEX idx_messages_session ON messages(session_id, created_at ASC);
CREATE INDEX idx_precedent_cache_expires ON precedent_cache(expires_at);
CREATE INDEX idx_llm_usage_date ON llm_usage(called_at DESC);
```

---

## 10. API 엔드포인트 설계

### 10.1 채팅 API

```
POST /api/chat
Request:
{
  "session_id": "uuid" | null,
  "category": "realestate",
  "message": "임대차 보증금을 못 돌려받고 있어요"
}

Response:
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "message": {
      "id": "uuid",
      "role": "assistant",
      "content": "주택임대차보호법에 따르면...",
      "precedents": [
        {
          "id": "판례일련번호",
          "case_number": "2019다223291",
          "court": "대법원",
          "decided_at": "2019-07-25",
          "summary": "임대인은 보증금을 반환할 의무가 있다",
          "link": "https://www.law.go.kr/..."
        }
      ],
      "llm_provider": "gemini",
      "mode": "ai_analysis"  // "ai_analysis" | "precedent_only"
    }
  }
}
```

`mode` 필드 설명:
- `ai_analysis`: Gemini가 판례를 해석해서 답변 생성 (정상)
- `precedent_only`: Gemini 호출 실패/한도 초과 시 판례만 나열 (fallback)

### 10.2 대화 이력 / 판례 상세 API

v1.0과 동일 (변경 없음)

---

## 11. 개발 단계 (Phase별)

### Phase 1: 기반 구축 (1주차)
- [ ] 프로젝트 초기화 (Expo + FastAPI)
- [ ] Docker Compose 설정 (korean-law-mcp 배포)
- [ ] Supabase 스키마 생성
- [ ] Gemini API 키 발급 + 연동 테스트
- [ ] FastAPI ↔ korean-law-mcp 연동 테스트
- [ ] LLM 추상화 레이어 구현

### Phase 2: 백엔드 핵심 (2주차)
- [ ] 규칙 기반 키워드 추출기 구현
- [ ] /api/chat 엔드포인트 구현
  - 키워드 추출 → 판례 검색 → Gemini 답변 생성 파이프라인
  - 안전 필터 fallback 처리
  - 일일 사용량 추적
- [ ] /api/history, /api/precedent 엔드포인트
- [ ] 판례 캐싱 로직

### Phase 3: 모바일 앱 UI (3주차)
- [ ] Expo Router 네비게이션 구조
- [ ] 홈 화면 (법률 분야 선택)
- [ ] 채팅 화면 (마크다운 렌더링 + 판례 카드)
- [ ] 단계별 로딩 표시
- [ ] 면책 고지 배너

### Phase 4: 상세 기능 (4주차)
- [ ] 판례 상세 뷰
- [ ] 대화 이력 목록 + 이어서 질문
- [ ] 온보딩 플로우
- [ ] Supabase Auth 연동

### Phase 5: 마무리 (5주차)
- [ ] Gemini 안전 필터 테스트 (형사 키워드 등)
- [ ] LLM 프로바이더 전환 테스트 (Gemini → Claude)
- [ ] 에러 핸들링 + 성능 최적화
- [ ] EAS Build (iOS/Android)

---

## 12. 주의사항 및 제약사항

### 12.1 법적 주의사항
- 변호사법 위반 방지: "법률 자문" 표현 절대 금지
- 모든 화면에 면책 고지 필수
- AI 답변의 정확성 보장 불가 명시
- 판례 원문 확인을 권장하는 문구 포함

### 12.2 Gemini 관련 제약
- 무료 티어: 일 250회 (Flash 기준) → 사용량 추적 필수
- 안전 필터: 형사/폭력 관련 키워드에 민감 → safety_settings 조정 + fallback
- 너프 가능성: Google이 성능을 주기적으로 하향 조정하는 사례 있음
- 데이터 프라이버시: 무료 티어는 학습에 데이터 사용될 수 있음
- 해결책: LLM 추상화 레이어로 즉시 다른 프로바이더 전환 가능

### 12.3 korean-law-mcp 관련
- 법제처 API: IP 기반 접근 제어 → 서버 IP 등록 필수
- 법제처 API: rate limit 존재 → 캐싱 필수
- MCP 검색 캐시: 1시간, 조문 캐시: 24시간 (자체 내장)

### 12.4 macOS 개발 환경
- python3 사용 (python 아님)
- pip3 --break-system-packages 플래그 사용
- Docker Desktop for Mac 필요
- Expo Go 앱으로 실기기 테스트

---

## 13. 핵심 의존성 (requirements.txt)

```txt
# Backend
fastapi>=0.115.0
uvicorn>=0.34.0
httpx>=0.28.0
pydantic>=2.10.0
python-dotenv>=1.0.0

# LLM - Gemini (기본)
google-generativeai>=0.8.0

# LLM - Claude (교체 대비)
# anthropic>=0.42.0

# Database
supabase>=2.0.0

# 키워드 추출 (선택)
# konlpy>=0.6.0
```
