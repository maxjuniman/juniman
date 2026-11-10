import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  title: string
  subtitle?: string
  icon: keyof typeof Ionicons.glyphMap
  selected: boolean
  onPress: () => void
}

export function SelectableCard({ title, subtitle, icon, selected, onPress }: Props) {
  const { palette, fonts } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? palette.primarySoft : palette.surface,
          borderColor: selected ? palette.primary : palette.border,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: selected ? palette.surface : palette.primarySoft }]}>
        <Ionicons name={icon} size={18} color={palette.primaryDark} />
      </View>
      <View style={styles.copy}>
        <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 15 }}>{title}</Text>
        {subtitle ? <Text style={{ color: palette.muted, fontFamily: fonts.regular, fontSize: 12 }}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 12,
    gap: 10,
    minHeight: 96,
  },
  icon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: 2 },
})
