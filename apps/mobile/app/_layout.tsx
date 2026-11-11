import 'react-native-gesture-handler'
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useFonts } from 'expo-font'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BootScreen } from '../src/components/BootScreen'
import { useAuthStore } from '../src/stores/auth-store'
import { ThemeProvider } from '../src/theme/ThemeProvider'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  })
  const hydrated = useAuthStore((state) => state.hydrated)

  useEffect(() => {
    void useAuthStore.getState().hydrate()
  }, [])

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined)
  }, [])

  if ((!loaded && !error) || !hydrated) return <BootScreen />

  return (
    <SafeAreaProvider>
      <ThemeProvider useNunito={Boolean(loaded)}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
