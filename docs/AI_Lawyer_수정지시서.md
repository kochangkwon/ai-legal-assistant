# AI Legal Assistant 코드 리뷰 수정 지시서

## 문서 정보
- 작성일: 2026-04-07
- 대상: ai-legal-assistant-main 코드베이스
- 기준: 개발지시서 v2.0 대비 코드 리뷰 결과
- 용도: Claude Code / Cursor에서 이 문서를 참고하여 수정 작업 수행

---

## 수정 항목 요약

| # | 분류 | 항목 | 긴급도 |
|---|------|------|--------|
| 1 | 누락 | `.env.example` 파일 생성 | 높음 |
| 2 | 누락 | `.cursorrules` 파일 생성 | 중간 |
| 3 | 버그 | `mobile/package.json` 의존성 3개 누락 | 높음 |
| 4 | 버그 | Gemini 모델명 기본값 무효 | 높음 |
| 5 | 버그 | RLS 정책 — Auth 미적용 시 전체 차단됨 | 높음 |
| 6 | 미구현 | 법령 검색 미연동 (laws 파라미터 빈 문자열) | 중간 |
| 7 | 개선 | `precedent.py` 라우터 경로 안정화 | 낮음 |
| 8 | 개선 | `supabase_service.py` 비동기 클라이언트 전환 | 낮음 |

---

## 수정 상세

### 1. `.env.example` 파일 생성 [높음]

**문제**: 프로젝트 루트에 `.env.example`이 없어서 clone 후 어떤 환경변수가 필요한지 알 수 없음.

**위치**: 프로젝트 루트 `/backend/.env.example`

**생성할 내용**:
```env
# ============================================
# AI Legal Assistant - 환경변수 설정
# 이 파일을 .env로 복사한 후 값을 채워주세요
# cp .env.example .env
# ============================================

# --- LLM 설정 ---
LLM_PROVIDER=gemini                              # "gemini" | "claude"
GEMINI_API_KEY=                                   # Google AI Studio에서 발급
GEMINI_MODEL=gemini-2.5-flash-preview-05-20       # Gemini 모델명 (전체 문자열)

# Claude 교체 대비 (선택)
# ANTHROPIC_API_KEY=
# CLAUDE_MODEL=claude-sonnet-4-20250514

# --- 법률 MCP ---
LAW_OC=                                           # 법제처 Open API 아이디
LAW_MCP_URL=http://localhost:3000/mcp             # korean-law-mcp 주소

# --- Supabase ---
SUPABASE_URL=                                     # https://xxxxx.supabase.co
SUPABASE_KEY=                                     # anon key
SUPABASE_SERVICE_ROLE_KEY=                        # service role key (백엔드 전용)

# --- 앱 설정 ---
DEBUG=false
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
RATE_LIMIT=10/minute
```

**추가 작업**: 프로젝트 루트 `.gitignore`에 `.env` 포함 확인

---

### 2. `.cursorrules` 파일 생성 [중간]

**문제**: 지시서에 명시된 Cursor IDE 규칙 파일이 프로젝트에 없음.

**위치**: 프로젝트 루트 `/.cursorrules`

**생성할 내용**:
```
# AI Legal Assistant - Cursor Rules v2.0

## 프로젝트
한국 법률 판례 기반 AI 법률 자문 모바일 앱
- mobile/: React Native + Expo (TypeScript)
- backend/: FastAPI (Python 3.11+)
- 법률 데이터: korean-law-mcp Docker (localhost:3000)
- AI: Gemini 2.5 Flash (무료 티어) — LLM 추상화로 교체 가능

## LLM 추상화
- 모든 LLM 호출은 llm_service.py 경유 (직접 호출 금지)
- .env의 LLM_PROVIDER로 전환: "gemini" | "claude"
- Gemini 안전 필터 차단 → 판례 나열 모드 fallback
- 일일 사용량 추적 필수 (무료 250회/일)

## 코드 스타일

### TypeScript (mobile/)
- strict mode, no semicolons
- 함수형 컴포넌트 + hooks only
- Zustand for UI state, React Query for server state
- Expo Router (파일 기반 라우팅)
- StyleSheet.create for styles
- 마크다운 렌더링 지원 (Gemini 응답 형식)

### Python (backend/)
- python3 (not python), pip3 --break-system-packages
- Type hints mandatory, Pydantic v2
- async/await only
- Logger only (no print)
- Gemini 호출 시 safety_settings 반드시 설정

## API 설계
- 응답 포맷: { success: bool, data: any, error: str | null }
- 응답에 mode 포함: "ai_analysis" | "precedent_only"
- 키워드 추출: LLM 미사용, 규칙 기반 (keyword_extractor.py)

## 법률 도메인
- 면책 고지 누락 금지
- "법률 자문" 표현 금지 → "법률 정보 제공"
- 판례 인용 시 사건번호/선고일/법원명 필수

## 금지 사항
- 환경변수 하드코딩
- LLM 직접 호출 (llm_service.py 우회)
- print() 사용
- 동기 함수로 API 호출
- any 타입 남용
- "법률 자문" 표현
```

---

### 3. `mobile/package.json` 의존성 누락 [높음]

**문제**: 코드에서 사용하는 3개 패키지가 `package.json`에 누락되어 빌드 실패함.

**위치**: `mobile/package.json`

**사용처 및 추가할 패키지**:

| 패키지 | 사용 파일 | import 구문 |
|--------|----------|------------|
| `react-native-markdown-display` | `components/chat/ChatBubble.tsx` | `import Markdown from 'react-native-markdown-display'` |
| `@react-native-async-storage/async-storage` | `hooks/useOnboarding.ts`, `app/(tabs)/settings.tsx` | `import AsyncStorage from '@react-native-async-storage/async-storage'` |
| `react-native-safe-area-context` | `app/onboarding.tsx` | `import { useSafeAreaInsets } from 'react-native-safe-area-context'` |

**수정 방법**: `mobile/package.json`의 `dependencies`에 아래 추가:
```json
{
  "dependencies": {
    "react-native-markdown-display": "^7.0.2",
    "@react-native-async-storage/async-storage": "^2.1.2",
    "react-native-safe-area-context": "^5.4.0"
  }
}
```

**수정 후**: `cd mobile && npm install` 실행

---

### 4. Gemini 모델명 기본값 수정 [높음]

**문제**: `config.py`의 `gemini_model` 기본값이 `gemini-2.5-flash`인데, 이 문자열로는 Gemini API 호출이 실패함. 실제 유효한 모델명은 전체 버전 문자열이어야 함.

**위치**: `backend/app/config.py` 7행

**현재 코드**:
```python
gemini_model: str = "gemini-2.5-flash"
```

**수정할 코드**:
```python
gemini_model: str = "gemini-2.5-flash-preview-05-20"
```

**참고**: Gemini 모델명은 Google이 주기적으로 업데이트하므로, 최신 모델명은 https://ai.google.dev/gemini-api/docs/models 에서 확인. `.env`에서 `GEMINI_MODEL`로 오버라이드 가능하므로, 기본값은 현재 안정 버전으로 설정.

---

### 5. RLS 정책 — Auth 미적용 시 대응 [높음]

**문제**: 현재 스키마의 RLS 정책이 `auth.uid() = user_id`로 설정되어 있는데, 개발 초기에는 Supabase Auth가 연동되지 않은 상태. 백엔드에서 `service_role_key`를 사용하면 RLS를 우회하지만, `supabase_key`(anon key)를 사용하면 세션 생성/조회가 전부 차단됨.

또한 `chat_sessions` 테이블의 `user_id`가 FK로 `profiles(id)`를 참조하는데, Auth 없이는 profiles에 레코드가 없어서 FK 제약 위반도 발생함.

**위치**: `supabase/schema.sql`, `backend/app/services/supabase_service.py`

**수정 방법 A — service_role_key 필수화 (추천)**:

`backend/app/services/supabase_service.py`의 `_get_client` 함수에서 `service_role_key`를 우선 사용하도록 이미 구현되어 있으므로, `.env.example`에 `SUPABASE_SERVICE_ROLE_KEY`가 필수임을 명시.

`backend/app/config.py` 수정:
```python
# 현재
supabase_service_role_key: str = ""

# 수정 — 빈 문자열 허용하되 경고 로그 추가
```

`backend/app/services/supabase_service.py`의 `__init__`에 경고 추가:
```python
def __init__(self):
    self._client: Client | None = None
    if not settings.supabase_service_role_key:
        logger.warning(
            "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. "
            "anon key로는 RLS 정책에 의해 데이터 접근이 차단될 수 있습니다."
        )
```

**수정 방법 B — chat_sessions.user_id nullable 처리**:

`supabase/schema.sql` 수정:
```sql
-- 현재
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

-- 수정 (Auth 미적용 단계에서 nullable 허용)
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE DEFAULT NULL,
```

RLS 정책에 user_id가 NULL인 경우를 위한 임시 정책 추가:
```sql
-- 개발용 임시 정책 (Auth 연동 후 제거)
CREATE POLICY "Allow sessions without user_id (dev)"
  ON chat_sessions FOR ALL
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow messages for sessions without user_id (dev)"
  ON messages FOR ALL
  USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id IS NULL)
  );
```

**추천**: 방법 A + B 모두 적용. service_role_key를 기본으로 쓰되, 스키마도 nullable로 바꿔서 Auth 연동 전 단계에서 문제없이 동작하도록.

---

### 6. 법령 검색 연동 구현 [중간]

**문제**: `chat_service.py`에서 `laws=""`로 항상 빈 문자열을 전달. 지시서에는 키워드에서 관련 법령을 검색하여 프롬프트에 포함하도록 명시됨.

**위치**: `backend/app/services/chat_service.py`의 `process_chat` 메서드

**현재 코드** (약 90행 부근):
```python
mode = "ai_analysis"

if await usage_tracker.try_consume():
    ...
    answer = await self.llm_service.generate_legal_response(
        question=message,
        precedents=precedents_context,
        laws="",                      # ← 항상 빈 문자열
        category=category,
        ...
    )
```

**수정할 코드**: 판례 검색과 법령 검색을 병렬로 수행하고, 법령 결과를 프롬프트에 포함.

```python
import asyncio

# 기존 키워드 추출 코드 아래에 추가:

# 2. 판례 검색 + 법령 검색 (병렬)
search_query = " ".join(keywords)
logger.info("판례/법령 검색: %s", search_query)

# 법령 검색용 키워드 (분야별 관련 법률명)
from app.services.keyword_extractor import CATEGORY_LAW_NAMES
law_names = CATEGORY_LAW_NAMES.get(category, [])
law_search_query = law_names[0] if law_names else search_query

precedent_results, law_results = await asyncio.gather(
    self.law_mcp_service.search_precedents(search_query, count=5),
    self.law_mcp_service.search_law(law_search_query),
    return_exceptions=True,
)

# 예외 처리
if isinstance(precedent_results, Exception):
    logger.error("판례 검색 실패: %s", precedent_results)
    precedent_results = []
if isinstance(law_results, Exception):
    logger.error("법령 검색 실패: %s", law_results)
    law_results = []

# 법령 컨텍스트 구성
laws_context = ""
if law_results and isinstance(law_results, list):
    law_texts = []
    for item in law_results[:2]:  # 상위 2건만
        if isinstance(item, dict):
            text = item.get("text", "")
            if text:
                law_texts.append(str(text)[:1000])
    laws_context = "\n\n".join(law_texts) if law_texts else ""

# ... 기존 판례 처리 코드 ...

# LLM 호출 시 laws 파라미터에 전달
answer = await self.llm_service.generate_legal_response(
    question=message,
    precedents=precedents_context,
    laws=laws_context,              # ← 실제 법령 데이터 전달
    category=category,
    conversation_history=conversation_history,
)
```

---

### 7. `precedent.py` 라우터 경로 안정화 [낮음]

**문제**: `/precedent/search/{query}`와 `/precedent/{precedent_id}`가 순서 의존적. FastAPI는 등록 순서대로 매칭하므로 현재는 동작하지만, 리팩토링 시 순서가 바뀌면 `search`가 `precedent_id`로 해석될 수 있음.

**위치**: `backend/app/routers/precedent.py`

**수정 방법**: 경로를 명확하게 분리.

```python
# 현재
@router.get("/precedent/search/{query}", ...)
@router.get("/precedent/{precedent_id}", ...)

# 수정 — query를 query parameter로 변경
@router.get("/precedent/search", ...)
async def search_precedents(
    query: str = Query(..., min_length=1, description="검색어"),
    count: int = Query(default=5, ge=1, le=20),
) -> APIResponse:
    ...

@router.get("/precedent/{precedent_id}", ...)
async def get_precedent(precedent_id: str) -> APIResponse:
    ...
```

**모바일 측 수정**: `mobile/services/api.ts`에서 호출 방식 변경 (해당 함수가 있다면).
```typescript
// 현재 (사용하는 곳이 있다면)
// fetchAPI(`/api/precedent/search/${query}`)

// 수정
// fetchAPI(`/api/precedent/search?query=${encodeURIComponent(query)}`)
```

---

### 8. `supabase_service.py` 비동기 클라이언트 [낮음]

**문제**: 동기 `create_client`를 `asyncio.to_thread`로 감싸서 사용 중. 동작에는 문제없으나, Supabase Python SDK가 비동기 클라이언트를 제공하므로 전환하면 더 효율적.

**위치**: `backend/app/services/supabase_service.py`

**현재 상태**: `asyncio.to_thread(lambda: self.client.table(...).execute())` 패턴으로 모든 호출을 감싸고 있음.

**판단**: 현재 구조로도 정상 동작하고, 변경 범위가 크므로 **Phase 4 이후로 연기**. 당장 수정하지 않아도 됨.

---

## 수정 우선순위

```
즉시 수정 (빌드/실행 불가):
  #3 mobile/package.json 의존성 추가
  #4 Gemini 모델명 기본값 수정
  #5 RLS/Auth 대응

빠른 시일 내 (개발 편의):
  #1 .env.example 생성
  #2 .cursorrules 생성

Phase 2에서 구현:
  #6 법령 검색 연동

리팩토링 시 (급하지 않음):
  #7 라우터 경로 안정화
  #8 비동기 Supabase 클라이언트
```

---

## 검증 방법

수정 완료 후 아래 순서로 검증:

```bash
# 1. 모바일 의존성 설치 확인
cd mobile && npm install
# → 에러 없이 완료되어야 함

# 2. 백엔드 실행 확인
cd backend
cp .env.example .env
# .env에 실제 값 채우기
python3 -m uvicorn app.main:app --reload
# → "LLM 프로바이더 초기화: gemini" 로그 확인

# 3. Supabase 스키마 적용
# Supabase Dashboard > SQL Editor에서 수정된 schema.sql 실행

# 4. 헬스체크
curl http://localhost:8000/health
# → {"status":"ok"}

# 5. 채팅 API 테스트 (korean-law-mcp 미실행 시 판례 검색은 실패하지만 에러 처리 확인)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"category":"realestate","message":"보증금을 못 돌려받고 있어요"}'
# → {"success":true,"data":{...}} 또는 graceful 에러
```
