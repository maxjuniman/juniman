import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { AppError } from '../../lib/errors'
import { photoUpload } from '../../lib/uploads'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { timezoneSchema } from '../../shared'
import * as usersService from './users.service'

export const usersRouter = Router()

usersRouter.use(requireAuth)

usersRouter.put(
  '/me/timezone',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const input = timezoneSchema.parse(request.body)
    response.json(await usersService.updateTimezone(userId, input.timezone))
  }),
)

usersRouter.post(
  '/me/photo',
  photoUpload.single('photo'),
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    if (!request.file) {
      throw new AppError('Selecione uma foto.', 400, 'FILE_REQUIRED')
    }
    response.json(await usersService.updatePhoto(userId, request.file.filename))
  }),
)
