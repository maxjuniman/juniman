export function familyNameFromPerson(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const surname = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return `Família ${surname}`
}
