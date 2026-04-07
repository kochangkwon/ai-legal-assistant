import { useState, useCallback } from 'react'
import { Message, LegalCategory } from '../types'
import { sendChatMessage } from '../services/api'

export function useChat(category: LegalCategory) {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')

  const sendMessage = useCallback(async (text: string) => {
    // 사용자 메시지 추가
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
    } catch (error) {
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

  return { messages, isLoading, loadingStep, sendMessage, sessionId }
}
