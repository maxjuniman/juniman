import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { formatDateInput, weekdayOfDate } from '../lib/dates'
import { ApiError } from '../services/api'
import { createTask, updateTask } from '../services/tasks'
import {
  REMINDER_OPTIONS,
  TASK_ASSIGNEE_OPTIONS,
  WEEKDAY_OPTIONS,
  normalizeWeekdays,
  recurrenceLabel,
  taskSchema,
  type TaskFormValues,
  type TaskItem,
} from '../shared'
import { useTheme } from '../theme/ThemeProvider'
import { Button } from './Button'
import { DateTimeField } from './DateTimeField'
import { ModalSheet } from './ModalSheet'
import { TextField } from './TextField'

type Props = {
  visible: boolean
  selectedDate: Date
  task?: TaskItem | null
  onClose: () => void
  onSaved: () => void
}

export function TaskFormModal({ visible, selectedDate, task, onClose, onSaved }: Props) {
  const { palette, fonts } = useTheme()
  const [formError, setFormError] = useState<string | null>(null)
  const editing = Boolean(task)
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      date: formatDateInput(selectedDate),
      time: '09:00',
      reminderEnabled: false,
      reminderMinutes: 30,
      visibility: 'FAMILY',
      assignee: 'FAMILY',
      recurrence: 'NONE',
      weekdays: [],
    },
  })

  useEffect(() => {
    if (!visible) return
    setFormError(null)
    form.reset(
      task
        ? {
            title: task.title,
            date: task.date,
            time: task.time,
            reminderEnabled: task.reminderEnabled,
            reminderMinutes: task.reminderMinutes ?? 30,
            visibility: 'FAMILY',
            assignee: task.assignee ?? 'FAMILY',
            recurrence: task.recurrence,
            weekdays: task.weekdays,
          }
        : {
            title: '',
            date: formatDateInput(selectedDate),
            time: '09:00',
            reminderEnabled: false,
            reminderMinutes: 30,
            visibility: 'FAMILY',
            assignee: 'FAMILY',
            recurrence: 'NONE',
            weekdays: [],
          },
    )
    // O reset acompanha a abertura, a data escolhida e a tarefa em edição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, selectedDate, task])

  const reminderEnabled = form.watch('reminderEnabled')
  const reminderMinutes = form.watch('reminderMinutes')
  const recurrence = form.watch('recurrence')
  const time = form.watch('time')
  const weekdays = normalizeWeekdays(form.watch('weekdays') ?? [])
  const weekly = recurrence === 'WEEKLY'
  const assignee = form.watch('assignee') ?? 'FAMILY'

  const toggleWeekday = (weekday: number) => {
    const next = weekdays.includes(weekday) ? weekdays.filter((day) => day !== weekday) : [...weekdays, weekday]
    form.setValue('weekdays', next, { shouldValidate: true })
  }

  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const payload = {
        ...values,
        visibility: 'FAMILY' as const,
        assignee: values.assignee ?? 'FAMILY',
        recurrence: values.recurrence ?? 'NONE',
        weekdays: values.recurrence === 'WEEKLY' ? normalizeWeekdays(values.weekdays ?? []) : [],
        reminderMinutes: values.reminderEnabled ? values.reminderMinutes ?? null : null,
      }
      if (task) await updateTask(task.id, payload)
      else await createTask(payload)
      onSaved()
      onClose()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível salvar o lembrete.')
    }
  })

  return (
    <ModalSheet
      visible={visible}
      title={editing ? 'Editar lembrete' : 'Novo lembrete'}
      onClose={onClose}
      footer={
        <View style={styles.actions}>
          <View style={styles.action}><Button title="Cancelar" variant="secondary" onPress={onClose} /></View>
          <View style={styles.action}><Button title={editing ? 'Salvar' : 'Salvar lembrete'} onPress={submit} loading={form.formState.isSubmitting} /></View>
        </View>
      }
    >
      <TextField
        label="Nome do lembrete"
        value={form.watch('title')}
        onChangeText={(value) => form.setValue('title', value, { shouldValidate: true })}
        error={form.formState.errors.title?.message}
        placeholder="Ex.: Futebol"
      />
      <Controller
        control={form.control}
        name="date"
        render={({ field }) => (
          <DateTimeField label="Data" mode="date" value={field.value} onChange={field.onChange} error={form.formState.errors.date?.message} />
        )}
      />
      <Controller
        control={form.control}
        name="time"
        render={({ field }) => (
          <DateTimeField label="Horário" mode="time" value={field.value} onChange={field.onChange} error={form.formState.errors.time?.message} />
        )}
      />
      <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 14 }}>Para quem é</Text>
      <View style={styles.members}>
        {TASK_ASSIGNEE_OPTIONS.map((option) => {
          const selected = assignee === option.value
          return (
            <Pressable
              key={option.value}
              onPress={() => form.setValue('assignee', option.value, { shouldValidate: true })}
              style={[
                styles.member,
                {
                  backgroundColor: selected ? option.soft : palette.surface,
                  borderColor: selected ? option.color : palette.border,
                },
              ]}
            >
              <View style={[styles.memberDot, { backgroundColor: option.color }]} />
              <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 13 }}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>
      <View style={[styles.alarm, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.alarmCopy}>
          <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 15 }}>Repetir</Text>
          <Text style={{ color: palette.muted, fontFamily: fonts.regular, fontSize: 13 }}>Um ou mais dias, toda semana</Text>
        </View>
        <Switch
          value={weekly}
          onValueChange={(value) => {
            form.setValue('recurrence', value ? 'WEEKLY' : 'NONE', { shouldValidate: true })
            if (value && weekdays.length === 0) {
              form.setValue('weekdays', [weekdayOfDate(form.getValues('date'))], { shouldValidate: true })
            }
          }}
          trackColor={{ true: palette.primary, false: palette.border }}
          thumbColor="#FFFFFF"
        />
      </View>
      {weekly ? (
        <View style={styles.options}>
          {WEEKDAY_OPTIONS.map((option) => {
            const selected = weekdays.includes(option.weekday)
            return (
              <Pressable
                key={option.weekday}
                onPress={() => toggleWeekday(option.weekday)}
                style={[styles.chip, { backgroundColor: selected ? palette.primary : palette.primarySoft }]}
              >
                <Text style={{ color: selected ? palette.onPrimary : palette.primaryDark, fontFamily: fonts.bold, fontSize: 13 }}>
                  {option.short}
                </Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}
      {form.formState.errors.weekdays?.message ? (
        <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{form.formState.errors.weekdays.message}</Text>
      ) : null}
      {weekly && weekdays.length > 0 ? (
        <Text style={{ color: palette.primaryDark, fontFamily: fonts.bold, fontSize: 14 }}>
          {recurrenceLabel(weekdays)} às {time}
        </Text>
      ) : null}
      <View style={[styles.alarm, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.alarmCopy}>
          <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 15 }}>Alarme</Text>
          <Text style={{ color: palette.muted, fontFamily: fonts.regular, fontSize: 13 }}>Avisar antes do horário</Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={(value) => form.setValue('reminderEnabled', value, { shouldValidate: true })}
          trackColor={{ true: palette.primary, false: palette.border }}
          thumbColor="#FFFFFF"
        />
      </View>
      {reminderEnabled ? (
        <View style={styles.options}>
          {REMINDER_OPTIONS.map((option) => {
            const selected = reminderMinutes === option.minutes
            return (
              <Pressable
                key={option.minutes}
                onPress={() => form.setValue('reminderMinutes', option.minutes, { shouldValidate: true })}
                style={[styles.chip, { backgroundColor: selected ? palette.primary : palette.primarySoft }]}
              >
                <Text style={{ color: selected ? palette.onPrimary : palette.primaryDark, fontFamily: fonts.bold, fontSize: 13 }}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}
      {form.formState.errors.reminderMinutes?.message ? (
        <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{form.formState.errors.reminderMinutes.message}</Text>
      ) : null}
      {formError ? <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{formError}</Text> : null}
    </ModalSheet>
  )
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  alarm: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  alarmCopy: { flex: 1, gap: 2 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  memberDot: { width: 10, height: 10, borderRadius: 5 },
})
