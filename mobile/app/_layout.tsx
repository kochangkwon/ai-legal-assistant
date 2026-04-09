import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useOnboarding, setOnboardingChangeListener } from '../hooks/useOnboarding'

const queryClient = new QueryClient()

function RootLayoutNav() {
  const router = useRouter()
  const { isLoading, showOnboarding, recheckOnboarding } = useOnboarding()

  // onboarding.tsx에서 완료 시 상태 재확인
  useEffect(() => {
    setOnboardingChangeListener(() => {
      recheckOnboarding()
    })
    return () => setOnboardingChangeListener(() => {})
  }, [recheckOnboarding])

  useEffect(() => {
    if (isLoading) return

    if (showOnboarding) {
      router.replace('/onboarding')
    } else {
      router.replace('/(tabs)')
    }
  }, [isLoading, showOnboarding])

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{ title: '' }}
      />
      <Stack.Screen
        name="precedent/[id]"
        options={{ title: '판례 상세' }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <RootLayoutNav />
    </QueryClientProvider>
  )
}
