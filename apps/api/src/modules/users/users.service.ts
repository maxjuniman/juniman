import fs from 'node:fs/promises'
import path from 'node:path'
import { assertTimeZone } from '../../lib/dates'
import { AppError } from '../../lib/errors'
import { prisma } from '../../lib/prisma'
import { uploadsDir } from '../../lib/uploads'
import { toPublicUser } from '../../lib/user'

export async function updateTimezone(userId: string, timezone: string) {
  assertTimeZone(timezone)
  const user = await prisma.user.update({ where: { id: userId }, data: { timezone } })
  return toPublicUser(user)
}

export async function updatePhoto(userId: string, filename: string) {
  const current = await prisma.user.findUnique({ where: { id: userId } })
  if (!current) {
    throw new AppError('Usuário não encontrado.', 401, 'UNAUTHORIZED')
  }

  if (current.photo?.startsWith('/uploads/')) {
    const previous = path.join(uploadsDir, path.basename(current.photo))
    await fs.unlink(previous).catch(() => undefined)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { photo: `/uploads/${filename}` },
  })
  return toPublicUser(user)
}
