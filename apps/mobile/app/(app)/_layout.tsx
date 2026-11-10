import { Redirect, Stack } from 'expo-router'
import { useEffect } from 'react'
import { api } from '../../src/services/api'
import { prepareNotifications } from '../../src/services/notifications'
import type { PublicUser } from '../../src/shared'
import { useAuthStore } from '../../src/stores/auth-store'

export default function AppLayout() {
  const hydrated = useAuthStore((state) => state.hydrated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) return
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone && timezone !== user.timezone) {
      api<PublicUser>('/api/users/me/timezone', { method: 'PUT', body: { timezone } })
        .then((updated) => useAuthStore.getState().setUser(updated))
        .catch(() => undefined)
    }
    void prepareNotifications()
  }, [user?.id, user?.timezone])

  if (!hydrated) return null
  if (!accessToken) return <Redirect href="/(auth)/login" />
  return <Stack screenOptions={{ headerShown: false }} />
}
