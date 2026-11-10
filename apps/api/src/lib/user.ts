import type { Gender, PublicUser } from '../shared'

type UserRecord = {
  id: string
  name: string
  email: string
  photo: string | null
  gender: Gender
  timezone: string
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    gender: user.gender,
    timezone: user.timezone,
  }
}
