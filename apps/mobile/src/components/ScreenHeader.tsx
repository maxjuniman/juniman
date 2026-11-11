import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { firstName } from '../lib/text'
import { useAuthStore } from '../stores/auth-store'
import { APP_NAME } from '../theme/colors'
import { useTheme } from '../theme/ThemeProvider'
import { Avatar } from './Avatar'
import { Crest } from './Crest'

const crest = require('../../assets/brasao.jpg')

export function ScreenHeader({ onSettings }: { onSettings: () => void }) {
  const { palette, fonts } = useTheme()
  const user = useAuthStore((state) => state.user)
  const [crestOpen, setCrestOpen] = useState(false)
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.row}>
      <Avatar name={user?.name ?? ''} photo={user?.photo} size={52} />
      <View style={styles.copy}>
        <Text style={[styles.name, { color: palette.text, fontFamily: fonts.extra }]} numberOfLines={1}>
          {firstName(user?.name)}
        </Text>
        <View style={styles.brand}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver o brasão"
            hitSlop={8}
            onPress={() => setCrestOpen(true)}
          >
            <Crest size={18} />
          </Pressable>
          <Text style={[styles.app, { color: palette.muted, fontFamily: fonts.bold }]}>{APP_NAME}</Text>
        </View>
      </View>
      <Modal visible={crestOpen} animationType="fade" transparent onRequestClose={() => setCrestOpen(false)}>
        <View style={styles.viewer}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setCrestOpen(false)} style={styles.viewerBackdrop}>
            <Image
              accessibilityLabel="Brasão da família"
              source={crest}
              contentFit="contain"
              style={{ width: width - 32, height: height * 0.7 }}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={() => setCrestOpen(false)}
            style={[styles.close, { top: insets.top + 12, backgroundColor: palette.surface }]}
          >
            <Ionicons name="close" size={22} color={palette.text} />
          </Pressable>
        </View>
      </Modal>
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
  viewer: { flex: 1, backgroundColor: 'rgba(20, 16, 12, 0.92)' },
  viewerBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  close: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
