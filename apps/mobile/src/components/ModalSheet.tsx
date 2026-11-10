import { Ionicons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  visible: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function ModalSheet({ visible, title, onClose, children, footer }: Props) {
  const { palette, fonts } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.screen}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { backgroundColor: palette.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: palette.text, fontFamily: fonts.extra }]}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color={palette.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20, 24, 28, 0.35)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingTop: 10 },
  handle: { alignSelf: 'center', width: 46, height: 5, borderRadius: 99, backgroundColor: '#D9D3CE', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 22, flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 12, gap: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
})
