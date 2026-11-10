import type { FamiliesResponse, PublicUser, TaskInput, TaskItem } from '../shared'
import { api } from './api'

export function listTasks(from: string, to: string) {
  return api<TaskItem[]>(`/api/tasks?from=${from}&to=${to}`)
}

export function createTask(input: TaskInput) {
  return api<TaskItem>('/api/tasks', { method: 'POST', body: input })
}

export function deleteTask(id: string) {
  return api<void>(`/api/tasks/${id}`, { method: 'DELETE' })
}

export function muteTask(id: string, muted: boolean) {
  return api<TaskItem>(`/api/tasks/${id}/mute`, { method: 'PATCH', body: { muted } })
}

export function getFamilies() {
  return api<FamiliesResponse>('/api/families/me')
}

export function addFamilyMember(email: string) {
  return api<FamiliesResponse>('/api/families/me/members', { method: 'POST', body: { email } })
}

export function uploadPhoto(formData: FormData) {
  return api<PublicUser>('/api/users/me/photo', { method: 'POST', formData })
}
