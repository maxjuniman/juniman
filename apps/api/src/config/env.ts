import path from 'node:path'
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  EMBEDDED_POSTGRES: z.enum(['true', 'false']).optional(),
  ENABLE_NOTIFICATION_WORKER: z.enum(['true', 'false']).default('true'),
})

const parsed = schema.parse(process.env)

export const env = parsed
export const isProd = parsed.NODE_ENV === 'production'
export const useEmbeddedPostgres =
  parsed.EMBEDDED_POSTGRES === 'true' ||
  (parsed.EMBEDDED_POSTGRES !== 'false' && parsed.NODE_ENV !== 'production')
