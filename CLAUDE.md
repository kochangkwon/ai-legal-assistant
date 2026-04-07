# AI Legal Assistant - Claude Code 개발 지침 v2.0

## 프로젝트 개요
한국 법률 판례 기반 AI 법률 자문 모바일 앱.
- Frontend: React Native + Expo (TypeScript) — `mobile/`
- Backend: FastAPI (Python 3.11+) — `backend/`
- 법률 데이터: korean-law-mcp (Docker, localhost:3000)
- AI: **Gemini 2.5 Flash** (Google AI Studio, 무료 티어)
- DB: Supabase (PostgreSQL)

## LLM 추상화 레이어
- `backend/app/services/llm_service.py` — LLM 프로바이더 추상화
- `backend/app/services/gemini_provider.py` — Gemini 구현체 (기본)
- `backend/app/services/claude_provider.py` — Claude 구현체 (교체 대비)
- `.env`의 `LLM_PROVIDER=gemini` 한 줄로 전환
- Gemini 안전 필터 차단 시 → 판례 원문 나열 모드로 fallback

## 개발 환경
- macOS, Cursor IDE + Claude Code
- `python3` 사용 (`python` 아님)
- `pip3 install --break-system-packages` 필수

## 개발 규칙

### 공통
- 한국어 주석
- 에러 메시지: 사용자용(한국어) / 개발용(영어) 분리
- API 응답 포맷: `{ success: bool, data: any, error: str | null }`
- 환경변수 하드코딩 절대 금지
- git commit: 한국어, conventional commits

### Backend (Python/FastAPI) — `backend/`
- Type hints 필수, Pydantic v2
- async/await only (동기 함수 금지)
- 로거 사용 (`print()` 금지)
- LLM 호출은 반드시 `llm_service.py` 경유 (직접 호출 금지)
- korean-law-mcp 호출은 `law_mcp_service.py`에 집중
- Gemini 호출 시 `safety_settings` 반드시 설정
- 일일 사용량 추적 (`UsageTracker`) 적용

### Frontend (React Native/TypeScript) — `mobile/`
- TypeScript strict mode, 세미콜론 없음
- 함수형 컴포넌트 + hooks only
- Zustand (UI state), React Query (server state)
- StyleSheet.create (inline 최소화)
- Expo Router 파일 기반 라우팅
- 마크다운 렌더링 지원 (Gemini 응답이 마크다운 형식)

### 법률 도메인 규칙
- 모든 법률 답변에 면책 고지 포함
- 판례 인용 시 사건번호/선고일/법원명 필수
- "법률 자문" 표현 금지 → "법률 정보 제공"
- 판례 원문 링크: law.go.kr 공식 링크

### 키워드 추출
- LLM 미사용 (비용 절감)
- 규칙 기반: `keyword_extractor.py`
- 법률 분야 선택 + 형태소 매칭으로 처리

## 파일 수정 시 주의사항
- LLM 관련 수정 → `llm_service.py` + 해당 provider만 수정
- API 스키마 변경 → `mobile/types/` + `backend/models/` 양쪽 동시
- `.env` 변경 → `.env.example` 동시 업데이트

## 프로젝트 구조
```
ai-legal-assistant/
├── mobile/             # React Native + Expo
│   ├── app/            # Expo Router
│   ├── components/     # UI 컴포넌트
│   ├── hooks/          # 커스텀 훅
│   ├── services/       # API 통신
│   └── types/          # 타입 정의
├── backend/            # FastAPI
│   ├── app/
│   │   ├── routers/    # 엔드포인트
│   │   ├── services/
│   │   │   ├── llm_service.py       # ★ LLM 추상화
│   │   │   ├── gemini_provider.py   # Gemini 구현
│   │   │   ├── claude_provider.py   # Claude 대비
│   │   │   ├── law_mcp_service.py   # MCP 연동
│   │   │   └── keyword_extractor.py # 키워드 추출
│   │   ├── models/     # Pydantic 모델
│   │   └── prompts/    # LLM 프롬프트
│   └── requirements.txt
└── docker-compose.yml
```
