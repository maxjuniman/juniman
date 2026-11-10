import { formatDateOnly, toUtcDate } from '../../lib/dates'
import { weeklyDates } from '../../lib/recurrence'
import { prisma } from '../../lib/prisma'
import { reminderLabel } from '../../shared'
import { sendExpoPush } from './expo-push'

const LOOKBACK_MS = 10 * 60 * 1000
const HORIZON_MS = 130 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

type DueTask = {
  id: string
  title: string
  time: string
  reminderMinutes: number | null
  notificationSettings: { userId: string; muted: boolean }[]
  family: { members: { userId: string }[] } | null
}

async function notifyMembers(task: DueTask, remindAt: Date) {
  if (!task.family || task.reminderMinutes == null) return
  const mutedUserIds = new Set(
    task.notificationSettings.filter((setting) => setting.muted).map((setting) => setting.userId),
  )

  for (const member of task.family.members) {
    if (mutedUserIds.has(member.userId)) continue
    const alreadySent = await prisma.notificationDispatch.findUnique({
      where: {
        taskId_userId_remindAt: { taskId: task.id, userId: member.userId, remindAt },
      },
    })
    if (alreadySent) continue

    const tokens = await prisma.pushToken.findMany({ where: { userId: member.userId } })
    if (tokens.length === 0) continue

    const delivery = await sendExpoPush(
      tokens.map((item) => item.token),
      {
        title: "Juniman's",
        body: `${reminderLabel(task.reminderMinutes)}: ${task.title} às ${task.time}`,
        data: { taskId: task.id },
      },
    )

    if (delivery.invalidTokens.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: delivery.invalidTokens } } })
    }
    if (!delivery.ok) continue

    await prisma.notificationDispatch.create({
      data: { taskId: task.id, userId: member.userId, remindAt },
    })
  }
}

export async function dispatchDueNotifications() {
  const now = new Date()
  const lookback = new Date(now.getTime() - LOOKBACK_MS)
  const horizon = new Date(now.getTime() + HORIZON_MS)

  const singleTasks = await prisma.task.findMany({
    where: {
      visibility: 'FAMILY',
      recurrence: 'NONE',
      reminderEnabled: true,
      reminderMinutes: { not: null },
      startsAt: { gte: lookback, lte: horizon },
    },
    include: {
      notificationSettings: true,
      family: { include: { members: true } },
    },
  })

  for (const task of singleTasks) {
    if (task.reminderMinutes == null) continue
    const remindAt = new Date(task.startsAt.getTime() - task.reminderMinutes * 60_000)
    if (remindAt > now || remindAt < lookback) continue
    await notifyMembers(task, remindAt)
  }

  const weeklyTasks = await prisma.task.findMany({
    where: {
      visibility: 'FAMILY',
      recurrence: 'WEEKLY',
      reminderEnabled: true,
      reminderMinutes: { not: null },
      date: { lte: horizon },
    },
    include: {
      notificationSettings: true,
      family: { include: { members: true } },
    },
  })

  const windowFrom = formatDateOnly(new Date(lookback.getTime() - DAY_MS))
  const windowTo = formatDateOnly(new Date(horizon.getTime() + DAY_MS))

  for (const task of weeklyTasks) {
    if (task.reminderMinutes == null) continue
    const anchor = formatDateOnly(task.date)
    for (const day of weeklyDates(anchor, task.weekdays, windowFrom, windowTo)) {
      const startsAt = toUtcDate(day, task.time, task.timezone)
      const remindAt = new Date(startsAt.getTime() - task.reminderMinutes * 60_000)
      if (remindAt > now || remindAt < lookback) continue
      await notifyMembers(task, remindAt)
    }
  }
}

export function startNotificationWorker() {
  const tick = () => {
    dispatchDueNotifications().catch((error) => {
      console.error('[notifications]', error)
    })
  }
  tick()
  const timer = setInterval(tick, 30_000)
  timer.unref()
}
