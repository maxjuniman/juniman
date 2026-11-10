import { z } from 'zod'

export const GENDERS = ['MALE', 'FEMALE'] as const
export const VISIBILITIES = ['PERSONAL', 'FAMILY'] as const
export const FAMILY_ROLES = ['ADMIN', 'MEMBER'] as const
export const REMINDER_MINUTE_VALUES = [120, 60, 30, 10] as const

export const REMINDER_OPTIONS = [
  { minutes: 120, label: '2 horas antes' },
  { minutes: 60, label: '1 hora antes' },
  { minutes: 30, label: '30 minutos antes' },
  { minutes: 10, label: '10 minutos antes' },
] as const

export type Gender = (typeof GENDERS)[number]
export type TaskVisibility = (typeof VISIBILITIES)[number]
export type FamilyRole = (typeof FAMILY_ROLES)[number]
export type ReminderMinutes = (typeof REMINDER_MINUTE_VALUES)[number]

const requiredText = (message: string) =>
  z.string({ required_error: message }).trim()

export const emailSchema = requiredText('Informe o e-mail.')
  .min(1, 'Informe o e-mail.')
  .email('E-mail inválido.')
  .max(180, 'E-mail muito longo.')
  .transform((value) => value.toLowerCase())

export const passwordSchema = z
  .string({ required_error: 'Informe a senha.' })
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')

export const registerSchema = z.object({
  name: requiredText('Informe o nome completo.')
    .min(3, 'Informe o nome completo.')
    .max(120, 'O nome pode ter no máximo 120 caracteres.'),
  email: emailSchema,
  password: passwordSchema,
  gender: z.enum(GENDERS, {
    required_error: 'Selecione o sexo.',
    invalid_type_error: 'Selecione o sexo.',
  }),
  timezone: z.string().trim().min(1).max(80).optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Informe a senha.' })
    .min(1, 'Informe a senha.')
    .max(72, 'A senha pode ter no máximo 72 caracteres.'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: requiredText('Informe o código.')
    .regex(/^\d{6}$/, 'O código tem 6 dígitos.'),
  password: passwordSchema,
})

export const timezoneSchema = z.object({
  timezone: z
    .string({ required_error: 'Informe o fuso horário.' })
    .trim()
    .min(1, 'Informe o fuso horário.')
    .max(80, 'Fuso horário inválido.'),
})

export const taskSchema = z
  .object({
    title: requiredText('Informe o nome da tarefa.')
      .min(1, 'Informe o nome da tarefa.')
      .max(120, 'O nome pode ter no máximo 120 caracteres.'),
    date: requiredText('Informe a data.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
    time: requiredText('Informe o horário.').regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      'Horário inválido.',
    ),
    reminderEnabled: z.boolean({
      required_error: 'Informe se o alarme fica ativo.',
      invalid_type_error: 'Informe se o alarme fica ativo.',
    }),
    reminderMinutes: z.number().int().nullable().optional(),
    visibility: z.enum(VISIBILITIES, {
      required_error: 'Escolha com quem compartilhar.',
      invalid_type_error: 'Escolha com quem compartilhar.',
    }),
  })
  .superRefine((value, context) => {
    const [year, month, day] = value.date.split('-').map(Number)
    const candidate = new Date(Date.UTC(year, month - 1, day))
    const validDate =
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day

    if (!validDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['date'],
        message: 'Data inválida.',
      })
    }

    if (
      value.reminderEnabled &&
      !REMINDER_MINUTE_VALUES.includes(value.reminderMinutes as ReminderMinutes)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reminderMinutes'],
        message: 'Escolha quando o alarme deve tocar.',
      })
    }
  })

export const muteTaskSchema = z.object({
  muted: z.boolean({
    required_error: 'Informe se a notificação fica silenciada.',
    invalid_type_error: 'Informe se a notificação fica silenciada.',
  }),
})

export const addMemberSchema = z.object({
  email: emailSchema,
})

export const pushTokenSchema = z.object({
  token: z
    .string({ required_error: 'Informe o token de notificação.' })
    .trim()
    .min(10, 'Token de notificação inválido.')
    .max(255, 'Token de notificação inválido.'),
  deviceId: z.string().trim().min(1).max(120).optional(),
})

export const dateRangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida.'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida.'),
  })
  .refine((value) => value.from <= value.to, { message: 'Intervalo de datas inválido.' })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type TaskInput = z.infer<typeof taskSchema>

export type PublicUser = {
  id: string
  name: string
  email: string
  photo: string | null
  gender: Gender
  timezone: string
}

export type AuthSession = {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

export type TaskItem = {
  id: string
  title: string
  date: string
  time: string
  startsAt: string
  reminderEnabled: boolean
  reminderMinutes: number | null
  visibility: TaskVisibility
  familyId: string | null
  muted: boolean
  canDelete: boolean
  createdBy: {
    id: string
    name: string
  }
}

export type FamilyMemberItem = {
  id: string
  role: FamilyRole
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    photo: string | null
  }
}

export type FamilySummary = {
  id: string
  name: string
  role: FamilyRole
  memberCount: number
}

export type FamilyDetails = FamilySummary & {
  members: FamilyMemberItem[]
}

export type FamiliesResponse = {
  activeFamily: FamilyDetails | null
  families: FamilySummary[]
}

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: Array<{ path: string; message: string }>
  }
}

export function reminderLabel(minutes: number) {
  if (minutes === 60) return 'Em 1 hora'
  if (minutes === 120) return 'Em 2 horas'
  return `Em ${minutes} minutos`
}

export function isValidTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat('pt-BR', { timeZone })
    return true
  } catch {
    return false
  }
}
