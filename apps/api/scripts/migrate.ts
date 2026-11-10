import { execSync } from 'node:child_process'
import { startEmbeddedPostgres, stopEmbeddedPostgres } from '../src/lib/postgres'

async function main() {
  await startEmbeddedPostgres()
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, CI: '1' },
    })
  } finally {
    await stopEmbeddedPostgres()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
