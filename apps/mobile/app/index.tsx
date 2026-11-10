import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Crest } from '../src/components/Crest'
import { useAuthStore } from '../src/stores/auth-store'
import { APP_NAME } from '../src/theme/colors'
import { useTheme } from '../src/theme/ThemeProvider'
import { Text } from 'react-native'

export default function Gate() {
  const hydrated = useAuthStore((state) => state.hydrated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const { palette, fonts } = useTheme()

  if (!hydrated) {
    return (
      <View style={[styles.boot, { backgroundColor: palette.background }]}>
        <Crest size={120} />
        <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 28 }}>{APP_NAME}</Text>
        <ActivityIndicator color={palette.primary} />
      </View>
    )
  }

  if (accessToken) return <Redirect href="/(app)" />
  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
})
