import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeProvider'

type Props = TextInputProps & {
  label: string
  error?: string
  secure?: boolean
}

export function TextField({ label, error, secure, style, ...props }: Props) {
  const { palette, fonts } = useTheme()
  const [hidden, setHidden] = useState(true)

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: palette.text, fontFamily: fonts.bold }]}>{label}</Text>
      <View style={[styles.field, { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border }]}>
        <TextInput
          placeholderTextColor={palette.muted}
          secureTextEntry={secure ? hidden : props.secureTextEntry}
          style={[styles.input, { color: palette.text, fontFamily: fonts.regular }, style]}
          {...props}
        />
        {secure ? (
          <Pressable accessibilityRole="button" onPress={() => setHidden((value) => !value)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: palette.danger, fontFamily: fonts.semibold }]}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14 },
  field: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  error: { fontSize: 13 },
})
