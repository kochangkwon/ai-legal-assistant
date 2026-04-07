// 법률 분야 카테고리
export type LegalCategory = 'civil' | 'criminal' | 'family' | 'labor' | 'realestate'

// 판례 정보
export interface PrecedentInfo {
  id: string
  case_number: string
  court: string
  decided_at: string
  summary: string
  link?: string
}

// 메시지
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  precedents?: PrecedentInfo[]
  created_at?: string
}

// 채팅 세션
export interface ChatSession {
  id: string
  category: LegalCategory
  title: string
  created_at: string
  message_count: number
}

// API 요청/응답
export interface ChatRequest {
  session_id: string | null
  category: LegalCategory
  message: string
}

export interface ChatResponseData {
  session_id: string
  message: Message
}

export interface APIResponse<T = unknown> {
  success: boolean
  data: T
  error: string | null
  message?: string
}
