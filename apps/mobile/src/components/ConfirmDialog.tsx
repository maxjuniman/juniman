import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Button } from './Button'

type Props = {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel, loading }: Props) {
  const { palette, fonts } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 20 }}>{title}</Text>
          <Text style={{ color: palette.muted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 }}>{message}</Text>
          <View style={styles.actions}>
            <View style={styles.action}><Button title="Cancelar" variant="secondary" onPress={onCancel} /></View>
            <View style={styles.action}><Button title={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} /></View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20, 24, 28, 0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 24, padding: 20, gap: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  action: { flex: 1 },
})
