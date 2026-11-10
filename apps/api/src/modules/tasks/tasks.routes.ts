import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../lib/async-handler'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { dateRangeSchema, muteTaskSchema, taskSchema } from '../../shared'
import * as tasksService from './tasks.service'

export const tasksRouter = Router()

const idSchema = z.object({
  id: z.string().min(1),
})

tasksRouter.use(requireAuth)

tasksRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const range = dateRangeSchema.parse(request.query)
    response.json(await tasksService.listTasks(userId, range.from, range.to))
  }),
)

tasksRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const input = taskSchema.parse(request.body)
    response.status(201).json(await tasksService.createTask(userId, input))
  }),
)

tasksRouter.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const params = idSchema.parse(request.params)
    response.json(await tasksService.getTask(userId, params.id))
  }),
)

tasksRouter.delete(
  '/:id',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const params = idSchema.parse(request.params)
    await tasksService.deleteTask(userId, params.id)
    response.status(204).send()
  }),
)

tasksRouter.patch(
  '/:id/mute',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const params = idSchema.parse(request.params)
    const input = muteTaskSchema.parse(request.body)
    response.json(await tasksService.setTaskMuted(userId, params.id, input.muted))
  }),
)
