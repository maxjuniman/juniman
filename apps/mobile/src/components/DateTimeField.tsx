import DateTimePicker from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { formatDateInput, formatLongDate, formatTimeInput, parseDateInput, timeToDate } from '../lib/dates'
import { useTheme } from '../theme/ThemeProvider'
import { Button } from './Button'

type Props = {
  label: string
  mode: 'date' | 'time'
  value: string
  onChange: (value: string) => void
  error?: string
}

export function DateTimeField({ label, mode, value, onChange, error }: Props) {
  const { palette, fonts } = useTheme()
  const [open, setOpen] = useState(false)
  const current = mode === 'date' ? parseDateInput(value) : timeToDate(value)
  const display = mode === 'date' ? formatLongDate(parseDateInput(value)) : value

  return (
    <View style={styles.wrap}>
      <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 14 }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: palette.surface, borderColor: error ? palette.danger : palette.border }]}
      >
        <Text style={{ color: palette.text, fontFamily: fonts.semibold, fontSize: 16 }}>{display}</Text>
      </Pressable>
      {error ? <Text style={{ color: palette.danger, fontFamily: fonts.semibold, fontSize: 13 }}>{error}</Text> : null}
      {open && Platform.OS === 'ios' ? (
        <View style={[styles.picker, { backgroundColor: palette.primarySoft }]}>
          <DateTimePicker
            value={current}
            mode={mode}
            display="spinner"
            is24Hour
            onValueChange={(_event, selected) => {
              onChange(mode === 'date' ? formatDateInput(selected) : formatTimeInput(selected))
            }}
          />
          <Button title="Concluir" variant="secondary" onPress={() => setOpen(false)} />
        </View>
      ) : null}
      {open && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={current}
          mode={mode}
          is24Hour
          onValueChange={(_event, selected) => {
            setOpen(false)
            onChange(mode === 'date' ? formatDateInput(selected) : formatTimeInput(selected))
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  field: { minHeight: 54, borderRadius: 16, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 14 },
  picker: { borderRadius: 18, padding: 8, gap: 8 },
})
