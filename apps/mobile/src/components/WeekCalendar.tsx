import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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
            <Text style={{ color: palette.muted, fontFamily: fonts.bold, fontSize: 12, textTransform: 'capitalize' }}>
              {format(day, 'EEE', { locale: ptBR })}
            </Text>
            <Text style={{ color: active ? palette.primaryDark : palette.text, fontFamily: fonts.extra, fontSize: 18 }}>
              {format(day, 'd')}
            </Text>
            <View style={styles.tasks}>
              {items.slice(0, 4).map((task) => {
                const family = task.visibility === 'FAMILY'
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => onOpenTask(task)}
                    style={[styles.chip, { backgroundColor: family ? palette.familySoft : palette.surface }]}
                  >
                    <Text style={{ color: family ? palette.family : palette.personal, fontFamily: fonts.bold, fontSize: 11 }}>
                      {task.time}
                    </Text>
                    <Text numberOfLines={2} style={{ color: palette.text, fontFamily: fonts.semibold, fontSize: 12 }}>
                      {task.title}
                    </Text>
                  </Pressable>
                )
              })}
              {items.length > 4 ? (
                <Text style={{ color: palette.muted, fontFamily: fonts.bold, fontSize: 11 }}>+{items.length - 4}</Text>
              ) : null}
            </View>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 20 },
  column: { width: 118, borderRadius: 18, borderWidth: 1, padding: 10, gap: 6, minHeight: 180 },
  tasks: { gap: 6 },
  chip: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6, gap: 2 },
})
