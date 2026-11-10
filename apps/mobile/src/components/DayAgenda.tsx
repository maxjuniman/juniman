import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { formatDateInput, formatLongDate } from '../lib/dates'
import type { TaskItem } from '../shared'
import { useTheme } from '../theme/ThemeProvider'
import { TaskCard } from './TaskCard'

type Props = {
  date: Date
  tasks: TaskItem[]
  currentUserId?: string
  onPressTask: (task: TaskItem) => void
}

export function DayAgenda({ date, tasks, currentUserId, onPressTask }: Props) {
  const { palette, fonts } = useTheme()
  const key = formatDateInput(date)
  const items = tasks.filter((task) => task.date === key)

  return (
    <View style={styles.wrap}>
      <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 20 }}>{formatLongDate(date)}</Text>
      {items.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.surface }]}>
          <Ionicons name="calendar-outline" size={28} color={palette.primary} />
          <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 16 }}>Nenhum compromisso</Text>
          <Text style={{ color: palette.muted, fontFamily: fonts.regular, textAlign: 'center' }}>
            Toque no + para criar uma tarefa neste dia.
          </Text>
        </View>
      ) : (
        items.map((task) => (
          <View key={task.id} style={styles.row}>
            <Text style={{ width: 52, color: palette.primaryDark, fontFamily: fonts.bold }}>{task.time}</Text>
            <View style={styles.card}>
              <TaskCard task={task} currentUserId={currentUserId} onPress={() => onPressTask(task)} />
            </View>
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 14, paddingHorizontal: 20 },
  empty: { borderRadius: 22, padding: 24, alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { flex: 1 },
})
