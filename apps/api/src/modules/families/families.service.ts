import { AppError } from '../../lib/errors'
import { prisma } from '../../lib/prisma'
import { getFamilies } from './family-context'

export async function addFamilyMember(userId: string, email: string) {
  const families = await getFamilies(userId)
  const active = families.activeFamily
  if (!active) {
    throw new AppError('Você ainda não pertence a uma família.', 400, 'NO_FAMILY')
  }
  if (active.role !== 'ADMIN') {
    throw new AppError('Apenas administradores podem adicionar membros.', 403, 'FORBIDDEN')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new AppError('Nenhum usuário cadastrado com esse e-mail.', 404, 'USER_NOT_FOUND')
  }
  if (user.id === userId) {
    throw new AppError('Você já faz parte desta família.', 409, 'ALREADY_MEMBER')
  }

  const existing = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId: active.id, userId: user.id } },
  })
  if (existing) {
    throw new AppError('Essa pessoa já faz parte da família.', 409, 'ALREADY_MEMBER')
  }

  await prisma.familyMember.create({
    data: { familyId: active.id, userId: user.id, role: 'MEMBER' },
  })

  return getFamilies(userId)
}
