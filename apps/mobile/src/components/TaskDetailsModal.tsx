import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { formatLongDate, parseDateInput } from '../lib/dates'
import { ApiError } from '../services/api'
import { deleteTask, muteTask } from '../services/tasks'
import { reminderLabel, type TaskItem } from '../shared'
import { useTheme } from '../theme/ThemeProvider'
import { Button } from './Button'
import { ModalSheet } from './ModalSheet'

type Props = {
  task: TaskItem | null
  onClose: () => void
  onChanged: () => void
}

export function TaskDetailsModal({ task, onClose, onChanged }: Props) {
  const { palette, fonts } = useTheme()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState<'mute' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const family = task?.visibility === 'FAMILY'

  const close = () => {
    setConfirming(false)
    setError(null)
    onClose()
  }

  const toggleMute = async () => {
    if (!task) return
    setLoading('mute')
    setError(null)
    try {
      await muteTask(task.id, !task.muted)
      onChanged()
      close()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível atualizar o alarme.')
    } finally {
      setLoading(null)
    }
  }

  const remove = async () => {
    if (!task) return
    setLoading('delete')
    setError(null)
    try {
      await deleteTask(task.id)
      onChanged()
      close()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível excluir a tarefa.')
    } finally {
      setLoading(null)
    }
  }

  const reminder = !task?.reminderEnabled
    ? 'Sem alarme'
    : task.muted
      ? 'Alarme silenciado para você'
      : task.reminderMinutes
        ? reminderLabel(task.reminderMinutes)
        : 'Alarme ativo'

  return (
    <ModalSheet visible={Boolean(task)} title={confirming ? 'Excluir tarefa' : 'Detalhes'} onClose={close}>
      {task && !confirming ? (
        <View style={styles.wrap}>
          <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 24 }}>{task.title}</Text>
          <Info label="Data" value={formatLongDate(parseDateInput(task.date))} />
          <Info label="Horário" value={task.time} />
          <Info label="Tipo" value={family ? 'Familiar' : 'Pessoal'} />
          <Info label="Criada por" value={task.createdBy.name} />
          <Info label="Notificação" value={reminder} />
          {error ? <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{error}</Text> : null}
          <Button
            title={task.muted ? 'Reativar notificações' : 'Silenciar notificações'}
            variant="secondary"
            onPress={toggleMute}
            loading={loading === 'mute'}
          />
          {task.canDelete ? (
            <Button title="Excluir tarefa" variant="danger" onPress={() => setConfirming(true)} />
          ) : (
            <Text style={{ color: palette.muted, fontFamily: fonts.regular, lineHeight: 20 }}>
              Somente quem criou a tarefa ou administra a família pode excluí-la.
            </Text>
          )}
        </View>
      ) : null}
      {task && confirming ? (
        <View style={styles.wrap}>
          <Text style={{ color: palette.text, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 }}>
            {family
              ? 'A tarefa será removida do calendário de toda a família. Essa ação não pode ser desfeita.'
              : 'Essa ação não pode ser desfeita.'}
          </Text>
          {error ? <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{error}</Text> : null}
          <Button title="Excluir" variant="danger" onPress={remove} loading={loading === 'delete'} />
          <Button title="Voltar" variant="secondary" onPress={() => setConfirming(false)} />
        </View>
      ) : null}
    </ModalSheet>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  const { palette, fonts } = useTheme()
  return (
    <View style={styles.info}>
      <Text style={{ color: palette.muted, fontFamily: fonts.bold, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: palette.text, fontFamily: fonts.semibold, fontSize: 16 }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  info: { gap: 2 },
})
