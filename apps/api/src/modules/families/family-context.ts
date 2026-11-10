import type { FamilyRole } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import type { FamiliesResponse, FamilyDetails, FamilySummary } from '../../shared'

type MembershipRecord = Awaited<ReturnType<typeof loadMemberships>>[number]

function loadMemberships(userId: string) {
  return prisma.familyMember.findMany({
    where: { userId },
    include: {
      family: {
        include: {
          _count: { select: { members: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, photo: true } },
            },
            orderBy: { joinedAt: 'asc' },
          },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })
}

function rankMemberships(memberships: MembershipRecord[]) {
  return [...memberships].sort((left, right) => {
    const byCount = right.family._count.members - left.family._count.members
    if (byCount !== 0) return byCount
    return left.family.createdAt.getTime() - right.family.createdAt.getTime()
  })
}

function toSummary(membership: MembershipRecord): FamilySummary {
  return {
    id: membership.family.id,
    name: membership.family.name,
    role: membership.role,
    memberCount: membership.family._count.members,
  }
}

function toDetails(membership: MembershipRecord): FamilyDetails {
  return {
    ...toSummary(membership),
    members: membership.family.members.map((member) => ({
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      user: member.user,
    })),
  }
}

export type FamilyAccess = {
  familyIds: string[]
  adminFamilyIds: Set<string>
  activeFamilyId: string | null
  activeRole: FamilyRole | null
}

export async function getFamilyAccess(userId: string): Promise<FamilyAccess> {
  const memberships = rankMemberships(await loadMemberships(userId))
  const active = memberships[0] ?? null
  return {
    familyIds: memberships.map((membership) => membership.familyId),
    adminFamilyIds: new Set(
      memberships.filter((membership) => membership.role === 'ADMIN').map((membership) => membership.familyId),
    ),
    activeFamilyId: active?.familyId ?? null,
    activeRole: active?.role ?? null,
  }
}

export async function getFamilies(userId: string): Promise<FamiliesResponse> {
  const memberships = rankMemberships(await loadMemberships(userId))
  const active = memberships[0] ?? null
  return {
    activeFamily: active ? toDetails(active) : null,
    families: memberships.map(toSummary),
  }
}
