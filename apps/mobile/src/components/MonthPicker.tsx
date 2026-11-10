import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatDateInput, formatMonth, monthGrid, sameDay } from '../lib/dates'
import type { TaskItem } from '../shared'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  cursor: Date
  selected: Date
  tasks: TaskItem[]
  onCursor: (date: Date) => void
  onSelect: (date: Date) => void
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function MonthPicker({ cursor, selected, tasks, onCursor, onSelect }: Props) {
  const { palette, fonts } = useTheme()
  const grid = monthGrid(cursor)
  const marked = new Set(tasks.map((task) => task.date))

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" onPress={() => onCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} style={styles.arrow}>
          <Ionicons name="chevron-back" size={20} color={palette.primaryDark} />
        </Pressable>
        <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 18 }}>{formatMonth(cursor)}</Text>
        <Pressable accessibilityRole="button" onPress={() => onCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={palette.primaryDark} />
        </Pressable>
      </View>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={[styles.cell, { color: palette.muted, fontFamily: fonts.bold }]}>{day}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {grid.days.map((day) => {
          const outside = day.getMonth() !== cursor.getMonth()
          const active = sameDay(day, selected)
          const hasTasks = marked.has(formatDateInput(day))
          return (
            <Pressable key={formatDateInput(day)} onPress={() => onSelect(day)} style={styles.cell}>
              <View style={[styles.day, active && { backgroundColor: palette.primary }]}>
                <Text style={{ color: active ? palette.onPrimary : outside ? palette.border : palette.text, fontFamily: fonts.bold }}>
                  {format(day, 'd', { locale: ptBR })}
                </Text>
              </View>
              <View style={[styles.dot, { backgroundColor: hasTasks ? palette.family : 'transparent' }]} />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  weekdays: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4, fontSize: 12, textAlign: 'center' },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
})
