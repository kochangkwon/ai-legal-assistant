import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_KEY = 'onboarding_completed'

// 전역 리스너 — 온보딩 완료 시 _layout.tsx에 알림
let onChangeListener: (() => void) | null = null

export function setOnboardingChangeListener(listener: () => void) {
  onChangeListener = listener
}

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const checkOnboarding = useCallback(async () => {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY)
    setShowOnboarding(completed !== 'true')
    setIsLoading(false)
  }, [])

  useEffect(() => {
    checkOnboarding()
  }, [checkOnboarding])

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
    // 전역 리스너에 알림 → _layout.tsx가 상태 재확인
    onChangeListener?.()
  }, [])

  return { isLoading, showOnboarding, completeOnboarding, recheckOnboarding: checkOnboarding }
}
