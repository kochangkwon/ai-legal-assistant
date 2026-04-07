import { APIResponse, ChatRequest, ChatResponseData, ChatSession, Message } from '../types'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<APIResponse<T>> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API 오류: ${response.status}`)
  }

  return response.json()
}

export async function sendChatMessage(
  request: ChatRequest,
): Promise<APIResponse<ChatResponseData>> {
  return fetchAPI<ChatResponseData>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function getHistory(): Promise<APIResponse<ChatSession[]>> {
  return fetchAPI<ChatSession[]>('/api/history')
}

interface SessionDetail {
  session: ChatSession
  messages: Message[]
}

export async function getSessionMessages(
  sessionId: string,
): Promise<APIResponse<SessionDetail>> {
  return fetchAPI<SessionDetail>(`/api/history/${sessionId}`)
}

export async function getPrecedent(
  precedentId: string,
): Promise<APIResponse<unknown>> {
  return fetchAPI<unknown>(`/api/precedent/${precedentId}`)
}
