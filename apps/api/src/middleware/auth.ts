import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/errors'
import { verifyAccessToken } from '../lib/jwt'

export type AuthedRequest = Request & { userId: string }

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.header('authorization')
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Faça login para continuar.', 401, 'UNAUTHORIZED'))
    return
  }

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length))
    ;(request as AuthedRequest).userId = payload.userId
    next()
  } catch {
    next(new AppError('Sessão expirada. Faça login novamente.', 401, 'UNAUTHORIZED'))
  }
}
