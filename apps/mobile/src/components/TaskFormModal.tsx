import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { formatDateInput } from '../lib/dates'
import { ApiError } from '../services/api'
import { createTask } from '../services/tasks'
import { REMINDER_OPTIONS, taskSchema, type TaskInput } from '../shared'
import { useTheme } from '../theme/ThemeProvider'
import { Button } from './Button'
import { DateTimeField } from './DateTimeField'
import { ModalSheet } from './ModalSheet'
import { SelectableCard } from './SelectableCard'
import { TextField } from './TextField'

type Props = {
  visible: boolean
  selectedDate: Date
  onClose: () => void
  onCreated: () => void
}

export function TaskFormModal({ visible, selectedDate, onClose, onCreated }: Props) {
  const { palette, fonts } = useTheme()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      date: formatDateInput(selectedDate),
      time: '09:00',
      reminderEnabled: false,
      reminderMinutes: 30,
      visibility: 'PERSONAL',
    },
  })

  useEffect(() => {
    if (!visible) return
    setFormError(null)
    form.reset({
      title: '',
      date: formatDateInput(selectedDate),
      time: '09:00',
      reminderEnabled: false,
      reminderMinutes: 30,
      visibility: 'PERSONAL',
    })
    // O reset acompanha apenas a abertura e a data escolhida no calendário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, selectedDate])

  const reminderEnabled = form.watch('reminderEnabled')
  const reminderMinutes = form.watch('reminderMinutes')

  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await createTask({
        ...values,
        reminderMinutes: values.reminderEnabled ? values.reminderMinutes ?? null : null,
      })
      onCreated()
      onClose()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível salvar a tarefa.')
    }
  })

  return (
    <ModalSheet
      visible={visible}
      title="Nova tarefa"
      onClose={onClose}
      footer={
        <View style={styles.actions}>
          <View style={styles.action}><Button title="Cancelar" variant="secondary" onPress={onClose} /></View>
          <View style={styles.action}><Button title="Salvar tarefa" onPress={submit} loading={form.formState.isSubmitting} /></View>
        </View>
      }
    >
      <TextField
        label="Nome da tarefa"
        value={form.watch('title')}
        onChangeText={(value) => form.setValue('title', value, { shouldValidate: true })}
        error={form.formState.errors.title?.message}
        placeholder="Ex.: Dentista"
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
      <Text style={{ color: palette.text, fontFamily: fonts.bold, fontSize: 14 }}>Compartilhamento</Text>
      <View style={styles.share}>
        <SelectableCard
          title="Só pra mim"
          subtitle="Somente você vê e recebe o alarme."
          icon="person-outline"
          selected={form.watch('visibility') === 'PERSONAL'}
          onPress={() => form.setValue('visibility', 'PERSONAL')}
        />
        <SelectableCard
          title="Família toda"
          subtitle="Todos veem e são avisados."
          icon="people-outline"
          selected={form.watch('visibility') === 'FAMILY'}
          onPress={() => form.setValue('visibility', 'FAMILY')}
        />
      </View>
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
  share: { flexDirection: 'row', gap: 10 },
})
