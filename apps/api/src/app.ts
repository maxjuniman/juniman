import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { uploadsDir } from './lib/uploads'
import { errorHandler } from './middleware/error-handler'
import { authRouter } from './modules/auth/auth.routes'
import { familiesRouter } from './modules/families/families.routes'
import { notificationsRouter } from './modules/notifications/notifications.routes'
import { tasksRouter } from './modules/tasks/tasks.routes'
import { usersRouter } from './modules/users/users.routes'

export function createApp() {
  const app = express()
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))
  app.use('/uploads', express.static(uploadsDir))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, name: "Juniman's" })
  })
  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/families', familiesRouter)
  app.use('/api/tasks', tasksRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use((_request, response) => {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } })
  })
  app.use(errorHandler)
  return app
}
