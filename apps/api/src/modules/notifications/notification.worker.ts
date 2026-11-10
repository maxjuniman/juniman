import { reminderLabel } from '../../shared'
import { prisma } from '../../lib/prisma'
import { sendExpoPush } from './expo-push'

const LOOKBACK_MS = 10 * 60 * 1000
const HORIZON_MS = 130 * 60 * 1000

export async function dispatchDueNotifications() {
  const now = new Date()
  const lookback = new Date(now.getTime() - LOOKBACK_MS)
  const horizon = new Date(now.getTime() + HORIZON_MS)

  const tasks = await prisma.task.findMany({
    where: {
      visibility: 'FAMILY',
      reminderEnabled: true,
      reminderMinutes: { not: null },
      startsAt: { gte: lookback, lte: horizon },
    },
    include: {
      createdBy: { select: { name: true } },
      notificationSettings: true,
      family: { include: { members: true } },
    },
  })

  for (const task of tasks) {
    if (!task.family || task.reminderMinutes == null) continue
    const remindAt = new Date(task.startsAt.getTime() - task.reminderMinutes * 60_000)
    if (remindAt > now || remindAt < lookback) continue

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
