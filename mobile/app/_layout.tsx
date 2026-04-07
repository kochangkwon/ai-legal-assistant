import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useOnboarding } from '../hooks/useOnboarding'

const queryClient = new QueryClient()

function RootLayoutNav() {
  const router = useRouter()
  const segments = useSegments()
  const { isLoading, showOnboarding } = useOnboarding()

  useEffect(() => {
    if (isLoading) return

    const inOnboarding = segments[0] === 'onboarding'

    if (showOnboarding && !inOnboarding) {
      router.replace('/onboarding')
    } else if (!showOnboarding && inOnboarding) {
      router.replace('/(tabs)')
    }
  }, [isLoading, showOnboarding, segments])

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
        options={{ title: '법률 상담' }}
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
