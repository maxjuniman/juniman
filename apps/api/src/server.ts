import fs from 'node:fs'
import { createApp } from './app'
import { env, useEmbeddedPostgres } from './config/env'
import { uploadsDir } from './lib/uploads'
import { prisma } from './lib/prisma'
import { startEmbeddedPostgres, stopEmbeddedPostgres } from './lib/postgres'
import { startNotificationWorker } from './modules/notifications/notification.worker'

async function main() {
  fs.mkdirSync(uploadsDir, { recursive: true })
  if (useEmbeddedPostgres) {
    await startEmbeddedPostgres()
  }

  await prisma.$connect()
  if (env.ENABLE_NOTIFICATION_WORKER === 'true') {
    startNotificationWorker()
  }

  const app = createApp()
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.info(`API Juniman's em http://0.0.0.0:${env.PORT}`)
  })

  let closing = false
  const shutdown = async () => {
    if (closing) return
    closing = true
    server.close()
    await prisma.$disconnect()
    if (useEmbeddedPostgres) {
      await stopEmbeddedPostgres()
    }
    process.exit(0)
  }

  process.on('SIGINT', () => {
    void shutdown()
  })
  process.on('SIGTERM', () => {
    void shutdown()
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
