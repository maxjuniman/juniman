export function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || 'Olá'
}

export function initials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
  return letters.join('') || '?'
}

export function roleLabel(role: 'ADMIN' | 'MEMBER') {
  return role === 'ADMIN' ? 'Administrador' : 'Membro'
}
