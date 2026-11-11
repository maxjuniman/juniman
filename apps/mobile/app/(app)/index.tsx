import { Ionicons } from '@expo/vector-icons'
import { addDays, addWeeks } from 'date-fns'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DayAgenda } from '../../src/components/DayAgenda'
import { FloatingButton } from '../../src/components/FloatingButton'
import { ModalSheet } from '../../src/components/ModalSheet'
import { MonthPicker } from '../../src/components/MonthPicker'
import { ScreenHeader } from '../../src/components/ScreenHeader'
import { TaskDetailsModal } from '../../src/components/TaskDetailsModal'
import { TaskFormModal } from '../../src/components/TaskFormModal'
import { WeekCalendar } from '../../src/components/WeekCalendar'
import { useTasks } from '../../src/hooks/useTasks'
import { formatMonth, formatWeekRange } from '../../src/lib/dates'
import type { TaskItem } from '../../src/shared'
import { useAuthStore } from '../../src/stores/auth-store'
import { useTheme } from '../../src/theme/ThemeProvider'

export default function HomeScreen() {
  const { palette, fonts } = useTheme()
  const userId = useAuthStore((state) => state.user?.id)
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [monthOpen, setMonthOpen] = useState(false)
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const { tasks, loading, refreshing, error, reload } = useTasks(monthOpen ? monthCursor : selectedDate)

  const shift = (direction: -1 | 1) => {
    setSelectedDate((current) => (mode === 'day' ? addDays(current, direction) : addWeeks(current, direction)))
  }

  const openMonth = () => {
    setMonthCursor(selectedDate)
    setMonthOpen(true)
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={palette.primary} />}
      >
        <ScreenHeader onSettings={() => router.push('/(app)/settings')} />
        <View style={[styles.switcher, { backgroundColor: palette.primarySoft }]}>
          {(['day', 'week'] as const).map((item) => {
            const active = mode === item
            return (
              <Pressable
                key={item}
                onPress={() => setMode(item)}
                style={[styles.switchItem, active && { backgroundColor: palette.surface }]}
              >
                <Text style={{ color: active ? palette.primaryDark : palette.muted, fontFamily: fonts.bold }}>
                  {item === 'day' ? 'Dia' : 'Semana'}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" onPress={() => shift(-1)} style={[styles.arrow, { backgroundColor: palette.surface }]}>
            <Ionicons name="chevron-back" size={20} color={palette.primaryDark} />
          </Pressable>
          <Pressable onPress={openMonth} style={styles.month}>
            <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 18 }}>{formatMonth(selectedDate)}</Text>
            <Text style={{ color: palette.muted, fontFamily: fonts.semibold }}>
              {mode === 'day' ? 'Escolher outro dia' : formatWeekRange(selectedDate)}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => shift(1)} style={[styles.arrow, { backgroundColor: palette.surface }]}>
            <Ionicons name="chevron-forward" size={20} color={palette.primaryDark} />
          </Pressable>
        </View>
        <View style={styles.legend}>
          <Legend color={palette.personal} label="Pessoal" />
          <Legend color={palette.family} label="Família" />
          <Pressable onPress={() => setSelectedDate(new Date())}>
            <Text style={{ color: palette.primaryDark, fontFamily: fonts.bold }}>Hoje</Text>
          </Pressable>
        </View>
        {error ? <Text style={[styles.error, { color: palette.danger, fontFamily: fonts.semibold }]}>{error}</Text> : null}
        {loading && tasks.length === 0 ? <ActivityIndicator color={palette.primary} style={styles.loader} /> : null}
        {mode === 'week' ? (
          <WeekCalendar selected={selectedDate} tasks={tasks} onSelect={setSelectedDate} onOpenTask={setSelectedTask} />
        ) : null}
        <DayAgenda date={selectedDate} tasks={tasks} currentUserId={userId} onPressTask={setSelectedTask} />
      </ScrollView>
      <FloatingButton onPress={() => setFormOpen(true)} />
      <TaskFormModal visible={formOpen} selectedDate={selectedDate} onClose={() => setFormOpen(false)} onCreated={reload} />
      <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} onChanged={reload} />
      <ModalSheet visible={monthOpen} title="Calendário" onClose={() => setMonthOpen(false)}>
        <MonthPicker
          cursor={monthCursor}
          selected={selectedDate}
          tasks={tasks}
          onCursor={setMonthCursor}
          onSelect={(date) => {
            setSelectedDate(date)
            setMode('day')
            setMonthOpen(false)
          }}
        />
      </ModalSheet>
    </SafeAreaView>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  const { palette, fonts } = useTheme()
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={{ color: palette.muted, fontFamily: fonts.semibold }}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 16, paddingBottom: 120 },
  switcher: { marginHorizontal: 20, borderRadius: 16, padding: 4, flexDirection: 'row' },
  switchItem: { flex: 1, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  arrow: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  month: { flex: 1, alignItems: 'center', gap: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  error: { paddingHorizontal: 20 },
  loader: { marginTop: 24 },
})
