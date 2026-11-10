import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { reminderLabel, type TaskItem } from '../shared'
import { useAuthStore } from '../stores/auth-store'
import { api } from './api'

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync()
  if (current.status === 'granted') return true
  const requested = await Notifications.requestPermissionsAsync()
  return requested.status === 'granted'
}

export async function prepareNotifications() {
  if (Platform.OS === 'web') {
    useAuthStore.getState().setPushEnabled(false)
    return
  }

  const expoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo'
  if (Platform.OS === 'android' && !expoGo) {
    try {
      await Notifications.setNotificationChannelAsync('tasks', {
        name: 'Compromissos',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      })
    } catch (error) {
      console.warn('[notifications] canal indisponível', error)
    }
  }

  const granted = await ensurePermission()
  if (!granted) {
    useAuthStore.getState().setPushEnabled(false)
    return
  }

  const projectId =
    process.env.EXPO_PUBLIC_PROJECT_ID ||
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId

  if (!Device.isDevice || !projectId) {
    useAuthStore.getState().setPushEnabled(false)
    return
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId })
    await api('/api/notifications/push-token', {
      method: 'POST',
      body: { token: token.data, deviceId: Device.modelName ?? undefined },
    })
    useAuthStore.getState().setPushEnabled(true)
  } catch {
    useAuthStore.getState().setPushEnabled(false)
  }
}

export async function syncLocalNotifications(tasks: TaskItem[]) {
  if (Platform.OS === 'web') return
  const pushEnabled = useAuthStore.getState().pushEnabled
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const desired = new Map<string, { task: TaskItem; when: Date }>()
  const now = Date.now()

  for (const task of tasks) {
    if (!task.reminderEnabled || task.muted || task.reminderMinutes == null) continue
    if (task.visibility === 'FAMILY' && pushEnabled) continue
    const when = new Date(new Date(task.startsAt).getTime() - task.reminderMinutes * 60_000)
    if (when.getTime() <= now) continue
    const identifier = `task-${task.id}`
    const current = desired.get(identifier)
    if (!current || when.getTime() < current.when.getTime()) desired.set(identifier, { task, when })
  }

  const stale = scheduled.filter((item) => {
    if (!item.identifier.startsWith('task-')) return false
    const next = desired.get(item.identifier)
    if (!next) return true
    const trigger = item.trigger
    const scheduledAt =
      trigger && typeof trigger === 'object' && 'date' in trigger
        ? new Date(trigger.date as string | number | Date).getTime()
        : Number.NaN
    return Math.abs(scheduledAt - next.when.getTime()) > 1000
  })
  const staleIds = new Set(stale.map((item) => item.identifier))
  await Promise.all(stale.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)))

  for (const [identifier, entry] of desired) {
    if (scheduled.some((item) => item.identifier === identifier) && !staleIds.has(identifier)) continue
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "Juniman's",
        body: `${reminderLabel(entry.task.reminderMinutes ?? 0)}: ${entry.task.title} às ${entry.task.time}`,
        data: { taskId: entry.task.id },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: entry.when,
        channelId: 'tasks',
      },
    })
  }
}

export async function cancelAllTaskNotifications() {
  if (Platform.OS === 'web') return
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith('task-'))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  )
}
