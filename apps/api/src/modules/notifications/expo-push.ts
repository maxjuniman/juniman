type PushMessage = {
  title: string
  body: string
  data: { taskId: string }
}

type ExpoTicket = {
  status: 'ok' | 'error'
  details?: { error?: string }
}

export async function sendExpoPush(tokens: string[], message: PushMessage) {
  if (tokens.length === 0) return { invalidTokens: [] as string[], ok: true }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      tokens.map((to) => ({
        to,
        title: message.title,
        body: message.body,
        sound: 'default',
        channelId: 'tasks',
        data: message.data,
      })),
    ),
  })

  if (!response.ok) {
    throw new Error(`Expo Push API respondeu ${response.status}.`)
  }

  const payload = (await response.json()) as { data?: ExpoTicket[] }
  const invalidTokens: string[] = []
  let ok = true
  payload.data?.forEach((ticket, index) => {
    if (ticket.status !== 'error') return
    if (ticket.details?.error === 'DeviceNotRegistered') {
      invalidTokens.push(tokens[index])
      return
    }
    ok = false
  })
  return { invalidTokens, ok }
}
