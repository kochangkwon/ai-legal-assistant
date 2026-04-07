import { useState, useEffect, useCallback } from 'react'
import { Message, LegalCategory } from '../types'
import { sendChatMessage, getSessionMessages } from '../services/api'

interface UseChatOptions {
  category: LegalCategory
  existingSessionId?: string
}

export function useChat(categoryOrOptions: LegalCategory | UseChatOptions) {
  const category = typeof categoryOrOptions === 'string'
    ? categoryOrOptions
    : categoryOrOptions.category
  const existingSessionId = typeof categoryOrOptions === 'string'
    ? undefined
    : categoryOrOptions.existingSessionId

  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // 기존 세션이면 이전 메시지 로드
  useEffect(() => {
    if (!existingSessionId) return

    async function loadMessages() {
      setIsLoadingHistory(true)
      try {
        const response = await getSessionMessages(existingSessionId!)
        if (response.success && response.data?.messages) {
          setMessages(response.data.messages)
          setSessionId(existingSessionId!)
        }
      } catch {
        // 로드 실패 시 빈 상태로 시작
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadMessages()
  }, [existingSessionId])

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      setLoadingStep('법률 키워드 분석 중...')
      const response = await sendChatMessage({
        session_id: sessionId,
        category,
        message: text,
      })

      if (response.success && response.data) {
        setSessionId(response.data.session_id)
        setMessages(prev => [...prev, response.data.message])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
      ])
    } finally {
      setIsLoading(false)
      setLoadingStep('')
    }
  }, [sessionId, category])

  return { messages, isLoading, isLoadingHistory, loadingStep, sendMessage, sessionId }
}
