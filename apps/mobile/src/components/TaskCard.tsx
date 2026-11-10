import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatShortDate } from '../lib/dates'
import type { TaskItem } from '../shared'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  task: TaskItem
  currentUserId?: string
  onPress: () => void
}

export function TaskCard({ task, currentUserId, onPress }: Props) {
  const { palette, fonts } = useTheme()
  const family = task.visibility === 'FAMILY'
  const color = family ? palette.family : palette.personal
  const soft = family ? palette.familySoft : palette.personalSoft
  const owner = family && task.createdBy.id !== currentUserId ? task.createdBy.name : null

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, { backgroundColor: palette.surface }]}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.icon, { backgroundColor: soft }]}>
        <Ionicons name={family ? 'people' : 'person'} size={18} color={color} />
      </View>
      <View style={styles.copy}>
        <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 16 }} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={{ color: palette.muted, fontFamily: fonts.regular, fontSize: 13 }}>
          {formatShortDate(task.date)} · {task.time}
        </Text>
        <Text style={{ color: palette.muted, fontFamily: fonts.semibold, fontSize: 12 }}>
          {family ? 'Família' : 'Pessoal'}
          {owner ? ` · ${owner}` : ''}
        </Text>
      </View>
      <Ionicons
        name={!task.reminderEnabled || task.muted ? 'notifications-off-outline' : 'notifications-outline'}
        size={20}
        color={!task.reminderEnabled || task.muted ? palette.muted : color}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1C2B3A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 99 },
  icon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
})
