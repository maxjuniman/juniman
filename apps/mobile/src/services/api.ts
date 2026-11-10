import type { ApiErrorBody } from '../shared'
import { useAuthStore } from '../stores/auth-store'
import { apiBaseUrl } from './config'

export class ApiError extends Error {
  status: number
  code?: string
  details?: ApiErrorBody['error']['details']

  constructor(message: string, status: number, code?: string, details?: ApiErrorBody['error']['details']) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  formData?: FormData
  auth?: boolean
}

const publicPaths = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
])

let refreshing: Promise<boolean> | null = null

async function refreshSession() {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return false
  const response = await fetch(`${apiBaseUrl()}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) {
    await useAuthStore.getState().logout()
    return false
  }
  await useAuthStore.getState().setSession(await response.json())
  return true
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const execute = () => {
    const headers: Record<string, string> = {}
    const token = useAuthStore.getState().accessToken
    if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`

    let body: BodyInit | undefined
    if (options.formData) {
      body = options.formData
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }

    return fetch(`${apiBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
    })
  }

  let response: Response
  try {
    response = await execute()
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0, 'NETWORK')
  }

  if (response.status === 401 && options.auth !== false && !publicPaths.has(path)) {
    refreshing ??= refreshSession().finally(() => {
      refreshing = null
    })
    if (await refreshing) response = await execute()
  }

  if (response.status === 204) return undefined as T
  const payload = (await response.json().catch(() => null)) as ApiErrorBody | null
  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? 'Não foi possível concluir a operação.',
      response.status,
      payload?.error?.code,
      payload?.error?.details,
    )
  }
  return payload as T
}
