import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_KEY = 'onboarding_completed'

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    async function check() {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY)
      setShowOnboarding(completed !== 'true')
      setIsLoading(false)
    }
    check()
  }, [])

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
  }, [])

  return { isLoading, showOnboarding, completeOnboarding }
}
