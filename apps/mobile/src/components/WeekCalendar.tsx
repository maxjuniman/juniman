import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatDateInput, sameDay, weekDays } from '../lib/dates'
import type { TaskItem } from '../shared'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  selected: Date
  tasks: TaskItem[]
  onSelect: (date: Date) => void
  onOpenTask: (task: TaskItem) => void
}

export function WeekCalendar({ selected, tasks, onSelect, onOpenTask }: Props) {
  const { palette, fonts } = useTheme()
  const days = weekDays(selected)

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const active = sameDay(day, selected)
        const items = tasks.filter((task) => task.date === formatDateInput(day))
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
            <View style={styles.tasks}>
              {items.slice(0, 3).map((task) => {
                const family = task.visibility === 'FAMILY'
                return (
                  <Pressable
                    key={`${task.id}-${task.date}`}
                    onPress={() => onOpenTask(task)}
                    style={[styles.chip, { backgroundColor: family ? palette.familySoft : palette.personalSoft }]}
                  >
                    <Text numberOfLines={1} style={{ color: family ? palette.family : palette.personal, fontFamily: fonts.bold, fontSize: 9 }}>
                      {task.time}
                    </Text>
                    <Text numberOfLines={2} style={{ color: palette.text, fontFamily: fonts.semibold, fontSize: 10, lineHeight: 12 }}>
                      {task.title}
                    </Text>
                  </Pressable>
                )
              })}
              {items.length > 3 ? (
                <Text style={{ color: palette.muted, fontFamily: fonts.bold, fontSize: 10, textAlign: 'center' }}>+{items.length - 3}</Text>
              ) : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: 12 },
  column: { flex: 1, minWidth: 0, borderRadius: 14, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 3, gap: 4, minHeight: 148 },
  tasks: { gap: 4 },
  chip: { borderRadius: 8, paddingHorizontal: 3, paddingVertical: 4, gap: 1 },
})