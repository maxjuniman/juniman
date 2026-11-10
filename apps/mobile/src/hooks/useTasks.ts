import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { formatDateInput, monthGrid } from '../lib/dates'
import { ApiError } from '../services/api'
import { syncLocalNotifications } from '../services/notifications'
import { listTasks } from '../services/tasks'
import type { TaskItem } from '../shared'

export function useTasks(cursor: Date) {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const from = formatDateInput(monthGrid(cursor).from)
  const to = formatDateInput(monthGrid(cursor).to)

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'refresh') setRefreshing(true)
      setError(null)
      try {
        const data = await listTasks(from, to)
        setTasks(data)
        await syncLocalNotifications(data).catch(() => undefined)
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'Não foi possível carregar o calendário.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [from, to],
  )

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load('refresh')
    })
    return () => subscription.remove()
  }, [load])

  return {
    tasks,
    loading,
    refreshing,
    error,
    reload: () => load('refresh'),
  }
}
