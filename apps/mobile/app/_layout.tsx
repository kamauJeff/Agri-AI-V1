import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '@/store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
  },
})

function RootLayoutNav() {
  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore()

  useEffect(() => { loadFromStorage() }, [])

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) router.replace('/(tabs)/dashboard')
      else router.replace('/(auth)/login')
    }
  }, [isAuthenticated, isLoading])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
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
