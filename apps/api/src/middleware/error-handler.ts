import { Prisma } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { AppError } from '../lib/errors'

function validationIssues(error: unknown) {
  if (typeof error !== 'object' || error === null || !('issues' in error)) return null
  const candidate = error as { name?: string; issues?: unknown }
  if (!Array.isArray(candidate.issues)) return null
  if (!(error instanceof ZodError) && candidate.name !== 'ZodError') return null
  return candidate.issues as ZodError['issues']
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  const issues = validationIssues(error)
  if (issues) {
    response.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Verifique os dados informados.',
        details: issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    })
    return
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    })
    return
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      error: { code: 'UPLOAD_ERROR', message: 'Não foi possível enviar a imagem.' },
    })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({
      error: { code: 'CONFLICT', message: 'Esse registro já existe.' },
    })
    return
  }

  console.error(error)
  response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
  })
}
