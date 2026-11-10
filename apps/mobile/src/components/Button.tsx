import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  loading?: boolean
}

export function Button({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const { palette, fonts } = useTheme()
  const background = {
    primary: palette.primary,
    secondary: palette.primarySoft,
    ghost: 'transparent',
    danger: palette.dangerSoft,
  }[variant]
  const color = {
    primary: palette.onPrimary,
    secondary: palette.primaryDark,
    ghost: palette.muted,
    danger: palette.danger,
  }[variant]

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.55 : pressed ? 0.86 : 1 },
        variant === 'ghost' && styles.ghost,
      ]}
    >
      {loading ? <ActivityIndicator color={color} /> : <Text style={[styles.label, { color, fontFamily: fonts.bold }]}>{title}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  ghost: {
    minHeight: 44,
  },
  label: {
    fontSize: 16,
  },
})
