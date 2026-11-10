import type { Task, User } from '@prisma/client'
import { dateOnly, formatDateOnly, toUtcDate } from '../../lib/dates'
import { weeklyDates } from '../../lib/recurrence'
import { AppError } from '../../lib/errors'
import { prisma } from '../../lib/prisma'
import { normalizeWeekdays, type TaskInput, type TaskItem } from '../../shared'
import { getFamilyAccess } from '../families/family-context'

const taskInclude = {
  createdBy: { select: { id: true, name: true } },
} as const

type TaskWithCreator = Task & {
  createdBy: { id: string; name: string }
  notificationSettings?: { muted: boolean }[]
}

async function requireUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('Usuário não encontrado.', 401, 'UNAUTHORIZED')
  return user
}

function canDeleteTask(task: Task, userId: string, adminFamilyIds: Set<string>) {
  if (task.visibility === 'PERSONAL') return task.createdById === userId
  const isCreator = task.createdById === userId
  const isAdmin = task.familyId ? adminFamilyIds.has(task.familyId) : false
  return isCreator || isAdmin
}

function toTaskItem(task: TaskWithCreator, userId: string, adminFamilyIds: Set<string>): TaskItem {
  return {
    id: task.id,
    title: task.title,
    date: formatDateOnly(task.date),
    time: task.time,
    startsAt: task.startsAt.toISOString(),
    reminderEnabled: task.reminderEnabled,
    reminderMinutes: task.reminderMinutes,
    visibility: task.visibility,
    recurrence: task.recurrence,
    weekdays: task.weekdays,
    familyId: task.familyId,
    muted: task.notificationSettings?.[0]?.muted ?? false,
    canDelete: canDeleteTask(task, userId, adminFamilyIds),
    createdBy: task.createdBy,
  }
}

function visibleWhere(userId: string, familyIds: string[]) {
  return {
    OR: [
      { visibility: 'PERSONAL' as const, createdById: userId },
      { visibility: 'FAMILY' as const, familyId: { in: familyIds } },
    ],
  }
}

function expandTask(task: TaskWithCreator, from: string, to: string, userId: string, adminFamilyIds: Set<string>): TaskItem[] {
  const base = toTaskItem(task, userId, adminFamilyIds)
  if (task.recurrence !== 'WEEKLY') return [base]
  const anchor = formatDateOnly(task.date)
  return weeklyDates(anchor, task.weekdays, from, to).map((day) => ({
    ...base,
    date: day,
    startsAt: toUtcDate(day, task.time, task.timezone).toISOString(),
  }))
}

export async function listTasks(userId: string, from: string, to: string) {
  const access = await getFamilyAccess(userId)
  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        visibleWhere(userId, access.familyIds),
        {
          OR: [
            { recurrence: 'NONE', date: { gte: dateOnly(from), lte: dateOnly(to) } },
            { recurrence: 'WEEKLY', date: { lte: dateOnly(to) } },
          ],
        },
      ],
    },
    include: {
      ...taskInclude,
      notificationSettings: { where: { userId }, select: { muted: true } },
    },
  })
  return tasks
    .flatMap((task) => expandTask(task, from, to, userId, access.adminFamilyIds))
    .sort((left, right) => left.date.localeCompare(right.date) || left.time.localeCompare(right.time) || left.title.localeCompare(right.title))
}

export async function getTask(userId: string, taskId: string) {
  const access = await getFamilyAccess(userId)
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...visibleWhere(userId, access.familyIds) },
    include: {
      ...taskInclude,
      notificationSettings: { where: { userId }, select: { muted: true } },
    },
  })
  if (!task) throw new AppError('Tarefa não encontrada.', 404, 'TASK_NOT_FOUND')
  return toTaskItem(task, userId, access.adminFamilyIds)
}

export async function createTask(userId: string, input: TaskInput) {
  const user = await requireUser(userId)
  const access = await getFamilyAccess(userId)
  const familyId = await resolveFamilyId(user, input, access.activeFamilyId)

  const task = await prisma.task.create({
    data: {
      title: input.title,
      date: dateOnly(input.date),
      time: input.time,
      startsAt: toUtcDate(input.date, input.time, user.timezone),
      timezone: user.timezone,
      reminderEnabled: input.reminderEnabled,
      reminderMinutes: input.reminderEnabled ? input.reminderMinutes ?? null : null,
      visibility: input.visibility,
      recurrence: input.recurrence,
      weekdays: input.recurrence === 'WEEKLY' ? normalizeWeekdays(input.weekdays) : [],
      createdById: userId,
      familyId,
    },
    include: {
      ...taskInclude,
      notificationSettings: { where: { userId }, select: { muted: true } },
    },
  })

  return toTaskItem(task, userId, access.adminFamilyIds)
}

async function resolveFamilyId(user: User, input: TaskInput, activeFamilyId: string | null) {
  if (input.visibility === 'PERSONAL') return null
  if (!activeFamilyId) {
    throw new AppError('Entre em uma família para compartilhar tarefas.', 400, 'NO_FAMILY')
  }
  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId: activeFamilyId, userId: user.id } },
  })
  if (!membership) {
    throw new AppError('Entre em uma família para compartilhar tarefas.', 400, 'NO_FAMILY')
  }
  return activeFamilyId
}

export async function deleteTask(userId: string, taskId: string) {
  const access = await getFamilyAccess(userId)
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...visibleWhere(userId, access.familyIds) },
  })
  if (!task) throw new AppError('Tarefa não encontrada.', 404, 'TASK_NOT_FOUND')
  if (!canDeleteTask(task, userId, access.adminFamilyIds)) {
    throw new AppError('Você não pode excluir esta tarefa familiar.', 403, 'FORBIDDEN')
  }
  await prisma.task.delete({ where: { id: task.id } })
}

export async function setTaskMuted(userId: string, taskId: string, muted: boolean) {
  const access = await getFamilyAccess(userId)
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...visibleWhere(userId, access.familyIds) },
    include: {
      ...taskInclude,
      notificationSettings: { where: { userId }, select: { muted: true } },
    },
  })
  if (!task) throw new AppError('Tarefa não encontrada.', 404, 'TASK_NOT_FOUND')

  await prisma.taskNotificationSetting.upsert({
    where: { taskId_userId: { taskId, userId } },
    create: { taskId, userId, muted },
    update: { muted },
  })

  return toTaskItem(
    { ...task, notificationSettings: [{ muted }] },
    userId,
    access.adminFamilyIds,
  )
}
