import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { firstName } from '../lib/text'
import { useAuthStore } from '../stores/auth-store'
import { APP_NAME } from '../theme/colors'
import { useTheme } from '../theme/ThemeProvider'
import { Avatar } from './Avatar'
import { Crest } from './Crest'

export function ScreenHeader({ onSettings }: { onSettings: () => void }) {
  const { palette, fonts } = useTheme()
  const user = useAuthStore((state) => state.user)

  return (
    <View style={styles.row}>
      <Avatar name={user?.name ?? ''} photo={user?.photo} size={52} />
      <View style={styles.copy}>
        <Text style={[styles.name, { color: palette.text, fontFamily: fonts.extra }]} numberOfLines={1}>
          {firstName(user?.name)}
        </Text>
        <View style={styles.brand}>
          <Crest size={18} />
          <Text style={[styles.app, { color: palette.muted, fontFamily: fonts.bold }]}>{APP_NAME}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Configurações"
        onPress={onSettings}
        style={[styles.settings, { backgroundColor: palette.surface }]}
      >
        <Ionicons name="settings-outline" size={22} color={palette.primaryDark} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  copy: { flex: 1, gap: 2 },
  name: { fontSize: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  app: { fontSize: 13 },
  settings: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
