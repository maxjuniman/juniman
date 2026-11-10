import { prisma } from '../../lib/prisma'

export async function savePushToken(userId: string, token: string, deviceId?: string) {
  await prisma.pushToken.upsert({
    where: { token },
    create: { userId, token, deviceId },
    update: { userId, deviceId },
  })
}

export async function removePushToken(userId: string, token: string) {
  await prisma.pushToken.deleteMany({ where: { userId, token } })
}
