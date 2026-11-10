import { randomInt, randomUUID } from 'node:crypto'
import type { User } from '@prisma/client'
import { isProd } from '../../config/env'
import { assertTimeZone } from '../../lib/dates'
import { AppError } from '../../lib/errors'
import { familyNameFromPerson } from '../../lib/family-name'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt'
import { hashPassword, verifyPassword } from '../../lib/password'
import { prisma } from '../../lib/prisma'
import { toPublicUser } from '../../lib/user'
import type { AuthSession, LoginInput, RegisterInput } from '../../shared'

const RESET_TTL_MS = 15 * 60 * 1000

async function issueSession(user: User): Promise<AuthSession> {
  const tokenId = randomUUID()
  const refreshToken = signRefreshToken(user.id, tokenId)
  const payload = verifyRefreshToken(refreshToken)
  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      expiresAt: new Date((payload.expiresAt ?? 0) * 1000),
    },
  })

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user.id, user.email),
    refreshToken,
  }
}

export async function register(input: RegisterInput) {
  const timezone = input.timezone ?? 'America/Sao_Paulo'
  assertTimeZone(timezone)

  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new AppError('Já existe uma conta com esse e-mail.', 409, 'EMAIL_IN_USE')
  }

  const password = await hashPassword(input.password)
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password,
        gender: input.gender,
        timezone,
      },
    })
    const family = await tx.family.create({
      data: { name: familyNameFromPerson(input.name) },
    })
    await tx.familyMember.create({
      data: { familyId: family.id, userId: created.id, role: 'ADMIN' },
    })
    return created
  })

  return issueSession(user)
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  const valid = user ? await verifyPassword(input.password, user.password) : false
  if (!user || !valid) {
    throw new AppError('E-mail ou senha incorretos.', 401, 'INVALID_CREDENTIALS')
  }
  return issueSession(user)
}

export async function refresh(refreshToken: string) {
  let payload: ReturnType<typeof verifyRefreshToken>
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Sessão expirada. Faça login novamente.', 401, 'UNAUTHORIZED')
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } })
  const expired = !stored || stored.revokedAt !== null || stored.expiresAt < new Date()
  if (!stored || expired || stored.userId !== payload.userId) {
    throw new AppError('Sessão expirada. Faça login novamente.', 401, 'UNAUTHORIZED')
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } })
  if (!user) {
    throw new AppError('Sessão expirada. Faça login novamente.', 401, 'UNAUTHORIZED')
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })
  return issueSession(user)
}

export async function logout(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken)
    await prisma.refreshToken.updateMany({
      where: { id: payload.tokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  } catch {
    // Logout permanece idempotente para tokens já inválidos.
  }
}

export async function forgotPassword(email: string) {
  const response: { message: string; devCode?: string } = {
    message: 'Se o e-mail estiver cadastrado, enviaremos um código de recuperação.',
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return response

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const codeHash = await hashPassword(code)
  await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } })
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  })

  if (!isProd) {
    response.devCode = code
    console.info(`[junimans] código de recuperação de ${user.email}: ${code}`)
  }

  return response
}

export async function resetPassword(email: string, code: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new AppError('Código inválido ou expirado.', 400, 'INVALID_CODE')
  }

  const resets = await prisma.passwordReset.findMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  let matchedId: string | null = null
  for (const reset of resets) {
    if (await verifyPassword(code, reset.codeHash)) {
      matchedId = reset.id
      break
    }
  }
  if (!matchedId) {
    throw new AppError('Código inválido ou expirado.', 400, 'INVALID_CODE')
  }

  const passwordHash = await hashPassword(password)
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } }),
    prisma.passwordReset.update({ where: { id: matchedId }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])

  return { message: 'Senha atualizada. Entre com a nova senha.' }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new AppError('Usuário não encontrado.', 401, 'UNAUTHORIZED')
  }
  return toPublicUser(user)
}
