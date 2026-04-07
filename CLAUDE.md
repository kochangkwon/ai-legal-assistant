# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

한국 법률 판례 기반 AI 법률 자문 모바일 앱. 사용자가 법률 질문을 입력하면 관련 판례/법령을 검색하여 AI가 법률 정보를 제공하는 서비스.

**면책**: 법률 정보 제공 목적이며, 변호사의 법률 자문을 대체하지 않음. "법률 자문" 표현 금지 → "법률 정보 제공"으로 표현.

## Tech Stack

| 영역 | 기술 |
|------|------|
| 모바일 앱 | React Native + Expo (TypeScript) - `mobile/` |
| 백엔드 | FastAPI (Python 3.11+) - `backend/` |
| 법률 데이터 | korean-law-mcp (Docker, localhost:3000) |
| AI 엔진 | Claude API (claude-sonnet-4-20250514) |
| DB | Supabase (PostgreSQL) |

## Architecture

```
Mobile (Expo) → REST API → FastAPI Backend
                              ├→ Claude API (키워드 추출 + 답변 생성)
                              ├→ korean-law-mcp (판례/법령 검색, Docker)
                              └→ Supabase (대화이력, 사용자 관리)
```

요청 플로우: 사용자 질문 → Claude로 법률 키워드 추출 → korean-law-mcp로 판례 검색 → Claude로 판례 기반 답변 생성 → 응답 + 이력 저장

## Build & Run Commands

### Backend (FastAPI)
```bash
cd backend
pip3 install -r requirements.txt --break-system-packages
uvicorn app.main:app --reload --port 8000
```

### Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
```

### Docker (korean-law-mcp + backend)
```bash
docker-compose up -d
```

## Development Rules

### 공통
- 한국어 주석, 한국어 커밋 메시지 (conventional commits)
- 모든 API 응답: `{ success, data, error, message }`
- 환경변수 하드코딩 절대 금지

### Python (backend/)
- `python3` 사용 (`python` 아님), `pip3 --break-system-packages`
- Type hints 필수, Pydantic v2
- async/await만 사용 (동기 함수 금지)
- logger 사용 (print 금지)

### TypeScript (mobile/)
- strict mode, 세미콜론 없음
- 함수형 컴포넌트 + hooks만 사용
- 상태관리: Zustand (UI) + React Query (서버)
- StyleSheet.create 사용 (inline 최소화)
- 컴포넌트: PascalCase.tsx, 훅: useCamelCase.ts

### 법률 도메인
- 모든 법률 답변에 면책 고지 포함
- 판례 인용 시 사건번호/선고일/법원명 필수
- korean-law-mcp 호출은 `law_mcp_service.py`에 집중
- Claude API 호출은 `claude_service.py`에 집중

### 파일 수정 주의
- API 스키마 변경 → `mobile/types/` + `backend/models/` 양쪽 동시
- .env 변경 → .env.example 동시 업데이트
