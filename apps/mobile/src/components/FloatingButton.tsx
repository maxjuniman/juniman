import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme/ThemeProvider'

export function FloatingButton({ onPress }: { onPress: () => void }) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Criar tarefa"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.primary, bottom: insets.bottom + 20, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <Ionicons name="add" size={32} color={palette.onPrimary} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
