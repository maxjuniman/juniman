import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { pushTokenSchema } from '../../shared'
import * as notificationsService from './notifications.service'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)

notificationsRouter.post(
  '/push-token',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const input = pushTokenSchema.parse(request.body)
    await notificationsService.savePushToken(userId, input.token, input.deviceId)
    response.status(204).send()
  }),
)

notificationsRouter.delete(
  '/push-token',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const input = pushTokenSchema.parse(request.body)
    await notificationsService.removePushToken(userId, input.token)
    response.status(204).send()
  }),
)
