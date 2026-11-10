import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { env } from '../config/env'

type EmbeddedCluster = {
  initialise: () => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  createDatabase: (name: string) => Promise<void>
}

let postgres: EmbeddedCluster | null = null

function databaseConfig() {
  const url = new URL(env.DATABASE_URL)
  return {
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  }
}

export async function startEmbeddedPostgres() {
  if (postgres) return
  const config = databaseConfig()
  const dataDir = path.join(os.homedir(), '.junimans', 'pgdata')
  fs.mkdirSync(dataDir, { recursive: true })

  const { default: EmbeddedPostgres } = await import('embedded-postgres')
  const instance = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: config.user,
    password: config.password,
    port: config.port,
    persistent: true,
    onLog: () => undefined,
    onError: (message: unknown) => {
      const text = message instanceof Error ? message.message : String(message)
      if (text.trim()) console.error(text)
    },
  })

  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    await instance.initialise()
  }

  try {
    await instance.start()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/already running|already started|in use/i.test(message)) throw error
    console.info('PostgreSQL incorporado já está em execução.')
  }

  try {
    await instance.createDatabase(config.database)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/already exists/i.test(message)) throw error
  }

  postgres = instance
  console.info(`PostgreSQL disponível em 127.0.0.1:${config.port}/${config.database}`)
}

export async function stopEmbeddedPostgres() {
  if (!postgres) return
  const instance = postgres
  postgres = null
  await instance.stop().catch((error: unknown) => {
    console.error(error)
  })
}
