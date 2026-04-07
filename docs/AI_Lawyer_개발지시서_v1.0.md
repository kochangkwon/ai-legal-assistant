# AI Legal Assistant (AI 법률 도우미) 개발지시서 v1.0

## 1. 프로젝트 개요

### 1.1 서비스 설명
한국 법률 판례 기반 AI 법률 자문 모바일 앱. 사용자가 법률 관련 질문을 입력하면, 관련 판례와 법령을 검색하여 AI가 법률 정보를 제공하는 서비스.

### 1.2 핵심 면책 조항
> **⚠️ 본 서비스는 법률 정보 제공 목적이며, 변호사의 법률 자문을 대체하지 않습니다.**
> 앱 전체에 이 면책 고지를 반드시 포함할 것. (온보딩, 채팅 답변 하단, 설정 페이지)

### 1.3 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 모바일 앱 | React Native + Expo (TypeScript) | 네이티브 앱 (iOS/Android) |
| 백엔드 API | FastAPI (Python 3.11+) | REST API 서버 |
| 법률 데이터 | korean-law-mcp (chrisryugj) | Docker 자체 배포 |
| AI 엔진 | Claude API (claude-sonnet-4-20250514) | 키워드 추출 + 답변 생성 |
| 데이터베이스 | Supabase (PostgreSQL) | 대화이력, 사용자 관리 |
| 개발 환경 | Cursor IDE + Claude Code | macOS |

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
│  ┌────────────────────┐  │
│  │ /api/chat          │──┼──→ Claude API
│  │ /api/history       │  │     (키워드 추출 + 답변 생성)
│  │ /api/precedent     │  │
│  └────────┬───────────┘  │
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
2. FastAPI: Claude API 호출 → 법률 키워드 추출
   → ["임대차", "보증금 반환", "주택임대차보호법"]
3. FastAPI: korean-law-mcp 호출 → 판례 검색
   → search_precedents("임대차 보증금 반환")
   → get_precedent_text(판례ID) × 상위 3건
4. FastAPI: Claude API 호출 → 판례 기반 답변 생성
   → 시스템 프롬프트 + 판례 데이터 + 사용자 질문
5. FastAPI: 응답 반환 + Supabase에 대화 이력 저장
6. 앱: 답변 표시 (법률 분석 + 판례 카드)
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
│   │   ├── (tabs)/             # 탭 네비게이션
│   │   │   ├── index.tsx       # 홈 (법률 분야 선택)
│   │   │   ├── chat.tsx        # 채팅 화면
│   │   │   └── history.tsx     # 상담 이력
│   │   ├── chat/[id].tsx       # 개별 채팅방
│   │   ├── precedent/[id].tsx  # 판례 상세
│   │   └── _layout.tsx         # 루트 레이아웃
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatBubble.tsx      # 메시지 버블
│   │   │   ├── PrecedentCard.tsx   # 판례 인용 카드
│   │   │   ├── LoadingSteps.tsx    # 단계별 로딩 표시
│   │   │   └── DisclaimerBanner.tsx # 면책 고지 배너
│   │   ├── common/
│   │   │   ├── CategorySelector.tsx # 법률 분야 선택
│   │   │   └── Header.tsx
│   │   └── precedent/
│   │       └── PrecedentDetail.tsx  # 판례 상세 뷰
│   ├── hooks/
│   │   ├── useChat.ts          # 채팅 로직
│   │   └── useHistory.ts       # 이력 조회
│   ├── services/
│   │   ├── api.ts              # FastAPI 통신
│   │   └── supabase.ts         # Supabase 클라이언트
│   ├── types/
│   │   └── index.ts            # 타입 정의
│   ├── constants/
│   │   └── categories.ts       # 법률 분야 상수
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py             # FastAPI 엔트리포인트
│   │   ├── config.py           # 설정 (환경변수)
│   │   ├── routers/
│   │   │   ├── chat.py         # /api/chat 엔드포인트
│   │   │   ├── history.py      # /api/history 엔드포인트
│   │   │   └── precedent.py    # /api/precedent 엔드포인트
│   │   ├── services/
│   │   │   ├── claude_service.py   # Claude API 연동
│   │   │   ├── law_mcp_service.py  # korean-law-mcp 연동
│   │   │   └── chat_service.py     # 채팅 비즈니스 로직
│   │   ├── models/
│   │   │   ├── chat.py         # Pydantic 모델
│   │   │   └── precedent.py    # 판례 모델
│   │   └── prompts/
│   │       ├── keyword_extraction.py   # 키워드 추출 프롬프트
│   │       └── legal_advisor.py        # 법률 자문 프롬프트
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml          # korean-law-mcp + backend 통합
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

2. **Anthropic API 키**
   - https://console.anthropic.com 에서 발급

3. **Supabase 프로젝트**
   - https://supabase.com 에서 프로젝트 생성
   - URL, anon key, service role key 확보

### 4.2 환경변수 (.env)

```env
# Backend (.env)
ANTHROPIC_API_KEY=sk-ant-xxxxx
LAW_OC=your_law_api_id
LAW_MCP_URL=http://localhost:3000/mcp
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Mobile (.env)
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

### 4.3 Docker Compose (korean-law-mcp + backend)

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
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
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

## 5. Claude Code Harness 설정

### 5.1 .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Execute",
      "WebFetch"
    ],
    "deny": []
  }
}
```

### 5.2 .claude/CLAUDE.md (Claude Code 지시서)

```markdown
# AI Legal Assistant - Claude Code 개발 지침

## 프로젝트 개요
한국 법률 판례 기반 AI 법률 자문 모바일 앱.
- Frontend: React Native + Expo (TypeScript)
- Backend: FastAPI (Python 3.11+)
- 법률 데이터: korean-law-mcp (Docker)
- AI: Claude API
- DB: Supabase (PostgreSQL)

## 개발 규칙

### 공통
- 한국어 주석 사용
- 에러 메시지는 사용자용(한국어) / 개발용(영어) 분리
- 모든 API 응답은 통일된 포맷 사용: { success, data, error, message }
- 환경변수는 절대 하드코딩 금지
- git commit 메시지: 한국어, conventional commits 형식

### Backend (Python/FastAPI)
- python3 사용 (python 아님)
- pip3 --break-system-packages 플래그 사용
- Type hints 필수
- Pydantic v2 모델 사용
- async/await 패턴 (동기 함수 금지)
- 로거 사용 (print 금지)
- 에러는 HTTPException으로 통일

### Frontend (React Native/TypeScript)
- TypeScript strict mode
- 함수형 컴포넌트 + hooks만 사용
- 세미콜론 없음 (ESLint 강제)
- 상태관리: Zustand (UI) + React Query (서버)
- 스타일: StyleSheet.create 사용 (inline 최소화)
- 컴포넌트 파일명: PascalCase
- 훅/유틸 파일명: camelCase

### 법률 도메인 규칙
- 모든 법률 답변에 면책 고지 포함
- 판례 인용 시 사건번호, 선고일, 법원명 필수 표시
- "법률 자문" 대신 "법률 정보 제공"으로 표현
- 판례 원문 링크 제공 시 law.go.kr 공식 링크 사용

### korean-law-mcp 연동
- MCP 서버는 Docker로 자체 배포 (fly.dev 의존 금지)
- 판례 검색: search_precedents 사용
- 판례 상세: get_precedent_text 사용
- 법령 검색: search_law 사용
- 법령 조문: get_law_text 사용
- 유사 판례: find_similar_precedents 사용
- MCP 호출 실패 시 graceful fallback (에러 메시지로 안내)
- 검색 결과 캐싱: 동일 키워드 1시간 TTL

## 파일 수정 시 주의사항
- backend/ 수정 시: requirements.txt 의존성 확인
- mobile/ 수정 시: TypeScript 타입 정합성 확인
- 양쪽 모두 영향받는 변경 시: API 스키마 (types/) 먼저 수정
```

### 5.3 .cursorrules (Cursor IDE 규칙)

```
# AI Legal Assistant - Cursor Rules

## 프로젝트 구조
- mobile/: React Native + Expo (TypeScript)
- backend/: FastAPI (Python 3.11+)
- 법률 데이터는 korean-law-mcp Docker 컨테이너에서 제공

## 코드 스타일
### TypeScript (mobile/)
- strict mode, no semicolons
- 함수형 컴포넌트 + hooks only
- Zustand for UI state, React Query for server state
- Expo Router (파일 기반 라우팅)
- StyleSheet.create for styles

### Python (backend/)
- python3 (not python)
- Type hints mandatory
- async/await only (no sync functions)
- Pydantic v2 models
- Logger only (no print)

## API 규칙
- 모든 응답: { success: bool, data: any, error: string | null }
- korean-law-mcp 호출은 law_mcp_service.py에 집중
- Claude API 호출은 claude_service.py에 집중
- 환경변수 하드코딩 절대 금지

## 법률 도메인
- 면책 고지 누락 금지
- 판례 인용 시 사건번호/선고일/법원명 필수
- "법률 자문" 표현 금지 → "법률 정보 제공"
```

---

## 6. 데이터베이스 스키마 (Supabase)

```sql
-- 사용자 테이블 (Supabase Auth 연동)
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
  category TEXT NOT NULL,          -- 'civil', 'criminal', 'family', 'labor', 'realestate'
  title TEXT,                      -- 첫 질문에서 자동 생성
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  precedents JSONB,                -- 인용된 판례 정보 [{id, case_no, court, date, summary}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 판례 캐시 테이블 (API 호출 최소화)
CREATE TABLE precedent_cache (
  id TEXT PRIMARY KEY,             -- 판례 일련번호
  case_number TEXT,                -- 사건번호 (예: 2020다12345)
  court TEXT,                      -- 법원명
  decided_at TEXT,                 -- 선고일자
  case_name TEXT,                  -- 사건명
  summary TEXT,                    -- 판결요지
  full_text TEXT,                  -- 판례 전문
  category TEXT,                   -- 사건종류
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
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
```

---

## 7. API 엔드포인트 설계

### 7.1 채팅 API

```
POST /api/chat
Request:
{
  "session_id": "uuid" | null,     // null이면 새 세션 생성
  "category": "civil",             // 법률 분야
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
          "case_number": "2019다12345",
          "court": "대법원",
          "decided_at": "2019-05-30",
          "summary": "임대인은 임대차 종료 시 보증금을 반환할 의무가 있다",
          "link": "https://law.go.kr/..."
        }
      ]
    }
  }
}
```

### 7.2 대화 이력 API

```
GET /api/history
Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "category": "civil",
      "title": "임대차 보증금 반환 문의",
      "created_at": "2026-04-07T10:30:00Z",
      "message_count": 5
    }
  ]
}

GET /api/history/{session_id}
Response: 해당 세션의 전체 메시지 목록
```

### 7.3 판례 상세 API

```
GET /api/precedent/{id}
Response:
{
  "success": true,
  "data": {
    "id": "판례일련번호",
    "case_number": "2019다12345",
    "court": "대법원",
    "decided_at": "2019-05-30",
    "case_name": "보증금반환",
    "summary": "판결요지...",
    "full_text": "판례 전문...",
    "related_laws": ["주택임대차보호법 제3조의2"],
    "link": "https://law.go.kr/..."
  }
}
```

---

## 8. Claude API 프롬프트 설계

### 8.1 키워드 추출 프롬프트

```python
KEYWORD_EXTRACTION_PROMPT = """
당신은 한국 법률 전문 키워드 추출기입니다.
사용자의 법률 질문에서 판례 검색에 필요한 법률 키워드를 추출하세요.

## 규칙
1. 관련 법률명을 포함하세요 (예: 주택임대차보호법, 근로기준법)
2. 법률 용어로 변환하세요 (예: "월급 안 줘요" → "임금 체불")
3. 핵심 쟁점을 포함하세요 (예: "보증금 반환", "부당해고")
4. 최대 5개 키워드, JSON 배열로 반환

## 법률 분야: {category}

## 사용자 질문:
{user_message}

## 응답 형식 (JSON만 반환):
["키워드1", "키워드2", "키워드3"]
"""
```

### 8.2 법률 자문 프롬프트

```python
LEGAL_ADVISOR_PROMPT = """
당신은 한국 법률 정보를 제공하는 AI 법률 도우미입니다.
아래 판례와 법령을 참고하여 사용자의 질문에 대해 법률 정보를 제공하세요.

## 중요 규칙
1. 이 답변은 법률 자문이 아닌 법률 정보 제공입니다
2. 반드시 제공된 판례를 근거로 답변하세요
3. 판례 인용 시 사건번호와 판결요지를 명시하세요
4. 구체적인 행동 지침을 단계별로 제시하세요
5. 필요 시 전문 변호사 상담을 권유하세요
6. 확실하지 않은 내용은 추측하지 마세요

## 답변 구조
1. **법률 분석**: 사안에 적용되는 법리 설명
2. **관련 판례**: 유사 판례 인용 및 판결 요지
3. **조치 방안**: 사용자가 취할 수 있는 구체적 단계
4. **유의 사항**: 주의할 점이나 예외 상황

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

---

## 9. 개발 단계 (Phase별)

### Phase 1: 기반 구축 (1주차)
- [ ] 프로젝트 초기화 (Expo + FastAPI)
- [ ] Docker Compose 설정 (korean-law-mcp 배포)
- [ ] Supabase 스키마 생성
- [ ] FastAPI ↔ korean-law-mcp 연동 테스트
- [ ] Claude API 키워드 추출 테스트

### Phase 2: 백엔드 핵심 (2주차)
- [ ] /api/chat 엔드포인트 구현
  - 키워드 추출 → 판례 검색 → 답변 생성 파이프라인
- [ ] /api/history 엔드포인트 구현
- [ ] /api/precedent 엔드포인트 구현
- [ ] 판례 캐싱 로직 구현
- [ ] 에러 처리 + 로깅

### Phase 3: 모바일 앱 UI (3주차)
- [ ] Expo Router 네비게이션 구조
- [ ] 홈 화면 (법률 분야 선택)
- [ ] 채팅 화면 (메시지 UI + 판례 카드)
- [ ] 단계별 로딩 표시 (검색 중... → 분석 중...)
- [ ] 면책 고지 배너

### Phase 4: 상세 기능 (4주차)
- [ ] 판례 상세 뷰 (전문, 관련 법조문)
- [ ] 대화 이력 목록 + 이어서 질문
- [ ] 온보딩 플로우
- [ ] Supabase Auth 연동 (소셜 로그인)

### Phase 5: 마무리 (5주차)
- [ ] 에러 핸들링 강화
- [ ] 성능 최적화 (API 응답 캐싱)
- [ ] EAS Build 설정 (iOS/Android)
- [ ] 테스트 + 버그 수정

---

## 10. korean-law-mcp 핵심 도구 사용법

### 10.1 MCP 호출 방식 (FastAPI에서)

korean-law-mcp는 SSE(Server-Sent Events) 기반 MCP 프로토콜을 사용한다.
FastAPI 백엔드에서는 HTTP POST로 MCP 도구를 호출한다.

```python
import httpx
import json

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
            return response.json()

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
```

### 10.2 주요 도구별 파라미터

| 도구 | 필수 파라미터 | 선택 파라미터 |
|------|-------------|-------------|
| search_precedents | query (검색어) | display (건수, 기본5), page |
| get_precedent_text | id (판례일련번호) | - |
| search_law | query (법령명) | display, page |
| get_law_text | mst (법령MST) | jo (조문번호 코드) |
| find_similar_precedents | id (판례일련번호) | - |
| search_interpretations | query (검색어) | display, page |
| summarize_precedent | id (판례일련번호) | - |

### 10.3 조문번호 변환 규칙
- 제1조 → "000100"
- 제38조 → "003800"
- 제38조의2 → "003802"
- 6자리 zero-padded, 뒤 2자리가 "의N"

---

## 11. 주의사항 및 제약사항

### 11.1 법적 주의사항
- 변호사법 위반 방지: "법률 자문" 표현 절대 금지
- 모든 화면에 면책 고지 필수
- AI 답변의 정확성 보장 불가 명시
- 판례 원문 확인을 권장하는 문구 포함

### 11.2 기술적 제약
- 법제처 API: IP 기반 접근 제어 → 서버 IP 등록 필수
- 법제처 API: rate limit 존재 → 캐싱 필수
- korean-law-mcp: 검색 캐시 1시간, 조문 캐시 24시간 (자체 내장)
- Claude API: 토큰 비용 발생 → 프롬프트 최적화 필요
- MCP 프로토콜: SSE 기반 → 연결 타임아웃 관리 필요

### 11.3 macOS 개발 환경
- python3 사용 (python 아님)
- pip3 --break-system-packages 플래그 사용
- Docker Desktop for Mac 필요
- Expo Go 앱으로 실기기 테스트
```
