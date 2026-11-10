import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../lib/async-handler'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../../shared'
import * as authService from './auth.service'

export const authRouter = Router()

const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Sessão inválida.'),
})

authRouter.post(
  '/register',
  asyncHandler(async (request, response) => {
    const input = registerSchema.parse(request.body)
    const session = await authService.register(input)
    response.status(201).json(session)
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (request, response) => {
    const input = loginSchema.parse(request.body)
    response.json(await authService.login(input))
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (request, response) => {
    const input = refreshSchema.parse(request.body)
    response.json(await authService.refresh(input.refreshToken))
  }),
)

authRouter.post(
  '/logout',
  asyncHandler(async (request, response) => {
    const input = refreshSchema.parse(request.body)
    await authService.logout(input.refreshToken)
    response.status(204).send()
  }),
)

authRouter.post(
  '/forgot-password',
  asyncHandler(async (request, response) => {
    const input = forgotPasswordSchema.parse(request.body)
    response.json(await authService.forgotPassword(input.email))
  }),
)

authRouter.post(
  '/reset-password',
  asyncHandler(async (request, response) => {
    const input = resetPasswordSchema.parse(request.body)
    response.json(await authService.resetPassword(input.email, input.code, input.password))
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    response.json(await authService.getMe(userId))
  }),
)
