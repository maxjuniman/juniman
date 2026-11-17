import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatDateInput, sameDay, weekDays } from '../lib/dates'
import { assigneeOption, type TaskItem } from '../shared'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  selected: Date
  tasks: TaskItem[]
  onSelect: (date: Date) => void
}

export function WeekCalendar({ selected, tasks, onSelect }: Props) {
  const { palette, fonts } = useTheme()
  const days = weekDays(selected)

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const active = sameDay(day, selected)
        const items = tasks.filter((task) => task.date === formatDateInput(day))
        const dots = [...new Set(items.map((task) => task.assignee))].slice(0, 5)
        return (
          <Pressable
            key={formatDateInput(day)}
            onPress={() => onSelect(day)}
            style={[
              styles.column,
              {
                backgroundColor: active ? palette.primarySoft : palette.surface,
                borderColor: active ? palette.primary : palette.border,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{ color: palette.muted, fontFamily: fonts.bold, fontSize: 10, textAlign: 'center', textTransform: 'capitalize' }}
            >
              {format(day, 'EEE', { locale: ptBR }).replace('.', '')}
            </Text>
            <Text style={{ color: active ? palette.primaryDark : palette.text, fontFamily: fonts.extra, fontSize: 16, textAlign: 'center' }}>
              {format(day, 'd')}
            </Text>
            <View style={styles.dots}>
              {dots.map((assignee) => (
                <View key={assignee} style={[styles.dot, { backgroundColor: assigneeOption(assignee).color }]} />
              ))}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: 12 },
  column: { flex: 1, minWidth: 0, borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 3, gap: 6, minHeight: 88 },
  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, minHeight: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
})
