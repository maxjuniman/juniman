import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const base = 'http://127.0.0.1:3333'
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stamp = Date.now()
const password = 'senha-segura'
const ana = { name: 'Ana Juniman', email: `ana.${stamp}@example.com`, password, gender: 'FEMALE', timezone: 'America/Sao_Paulo' }
const bruno = { name: 'Bruno Lima', email: `bruno.${stamp}@example.com`, password, gender: 'MALE', timezone: 'America/Sao_Paulo' }

type Session = {
  user: { id: string; email: string; gender: string; photo: string | null }
  accessToken: string
  refreshToken: string
}

async function request(pathname: string, options: { method?: string; token?: string; body?: unknown; expected: number }) {
  const response = await fetch(`${base}${pathname}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null
  assert.equal(response.status, options.expected, `${options.method ?? 'GET'} ${pathname} retornou ${response.status}: ${text}`)
  return payload
}

function startServer() {
  const child = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: apiRoot,
    shell: true,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout?.on('data', (chunk) => process.stdout.write(String(chunk)))
  child.stderr?.on('data', (chunk) => process.stderr.write(String(chunk)))
  return child
}

async function waitForHealth(child: ChildProcess) {
  const started = Date.now()
  while (Date.now() - started < 120_000) {
    if (child.exitCode !== null) throw new Error('A API encerrou antes de ficar pronta.')
    try {
      const response = await fetch(`${base}/api/health`)
      if (response.ok) return
    } catch {
      // O banco incorporado ainda está subindo.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('A API não respondeu a tempo.')
}

async function stopServer(child: ChildProcess) {
  if (child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { shell: true, stdio: 'ignore' })
  }
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

async function main() {
  const server = startServer()
  try {
    await waitForHealth(server)
    await request('/api/tasks?from=2026-12-01&to=2026-12-31', { expected: 401 })
    await request('/api/auth/register', { method: 'POST', body: { ...ana, name: 'A' }, expected: 422 })

    const anaSession = (await request('/api/auth/register', { method: 'POST', body: ana, expected: 201 })) as Session
    assert.equal(anaSession.user.gender, 'FEMALE')
    assert.equal('password' in anaSession.user, false)
    await request('/api/auth/register', { method: 'POST', body: ana, expected: 409 })
    await request('/api/auth/login', { method: 'POST', body: { email: ana.email, password: 'errada' }, expected: 401 })

    const login = (await request('/api/auth/login', {
      method: 'POST',
      body: { email: ana.email, password },
      expected: 200,
    })) as Session
    const refreshed = (await request('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: login.refreshToken },
      expected: 200,
    })) as Session
    await request('/api/auth/refresh', { method: 'POST', body: { refreshToken: login.refreshToken }, expected: 401 })

    const me = await request('/api/auth/me', { token: refreshed.accessToken, expected: 200 })
    assert.equal(me.email, ana.email)

    const families = await request('/api/families/me', { token: refreshed.accessToken, expected: 200 })
    assert.equal(families.activeFamily.name, 'Família Juniman')
    assert.equal(families.activeFamily.role, 'ADMIN')

    const personal = await request('/api/tasks', {
      method: 'POST',
      token: refreshed.accessToken,
      expected: 201,
      body: { title: 'Consulta', date: '2026-12-15', time: '15:00', reminderEnabled: true, reminderMinutes: 30, visibility: 'PERSONAL' },
    })
    assert.equal(personal.date, '2026-12-15')
    assert.equal(personal.startsAt, '2026-12-15T18:00:00.000Z')
    assert.equal(personal.canDelete, true)
    assert.equal(personal.recurrence, 'NONE')

    const weekly = await request('/api/tasks', {
      method: 'POST',
      token: refreshed.accessToken,
      expected: 201,
      body: {
        title: 'Futebol',
        date: '2026-12-15',
        time: '18:30',
        reminderEnabled: false,
        visibility: 'PERSONAL',
        recurrence: 'WEEKLY',
        weekdays: [2, 4],
      },
    })
    assert.equal(weekly.recurrence, 'WEEKLY')
    assert.deepEqual(weekly.weekdays, [2, 4])
    const nextTuesday = await request('/api/tasks?from=2026-12-22&to=2026-12-22', {
      token: refreshed.accessToken,
      expected: 200,
    })
    assert.equal(nextTuesday.length, 1)
    assert.equal(nextTuesday[0].id, weekly.id)
    assert.equal(nextTuesday[0].title, 'Futebol')
    assert.equal(nextTuesday[0].date, '2026-12-22')
    assert.equal(nextTuesday[0].time, '18:30')
    assert.equal(nextTuesday[0].startsAt, '2026-12-22T21:30:00.000Z')
    const thursday = await request('/api/tasks?from=2026-12-17&to=2026-12-17', {
      token: refreshed.accessToken,
      expected: 200,
    })
    assert.equal(thursday.length, 1)
    assert.equal(thursday[0].id, weekly.id)
    assert.equal(thursday[0].title, 'Futebol')
    assert.equal(thursday[0].date, '2026-12-17')
    assert.equal(thursday[0].time, '18:30')
    assert.equal(thursday[0].startsAt, '2026-12-17T21:30:00.000Z')
    const wednesday = await request('/api/tasks?from=2026-12-16&to=2026-12-16', {
      token: refreshed.accessToken,
      expected: 200,
    })
    assert.equal(wednesday.some((task: { title: string }) => task.title === 'Futebol'), false)
    const beforeAnchor = await request('/api/tasks?from=2026-12-08&to=2026-12-08', {
      token: refreshed.accessToken,
      expected: 200,
    })
    assert.equal(beforeAnchor.some((task: { title: string }) => task.title === 'Futebol'), false)

    const familyTask = await request('/api/tasks', {
      method: 'POST',
      token: refreshed.accessToken,
      expected: 201,
      body: { title: 'Jantar', date: '2026-12-15', time: '19:30', reminderEnabled: true, reminderMinutes: 60, visibility: 'FAMILY' },
    })

    const brunoSession = (await request('/api/auth/register', { method: 'POST', body: bruno, expected: 201 })) as Session
    const brunoBefore = await request('/api/tasks?from=2026-12-01&to=2026-12-31', { token: brunoSession.accessToken, expected: 200 })
    assert.equal(brunoBefore.length, 0)
    await request(`/api/tasks/${personal.id}`, { token: brunoSession.accessToken, expected: 404 })

    await request('/api/families/me/members', {
      method: 'POST',
      token: refreshed.accessToken,
      body: { email: bruno.email },
      expected: 201,
    })
    const brunoTasks = await request('/api/tasks?from=2026-12-01&to=2026-12-31', { token: brunoSession.accessToken, expected: 200 })
    assert.equal(brunoTasks.length, 1)
    assert.equal(brunoTasks[0].id, familyTask.id)
    assert.equal(brunoTasks[0].canDelete, false)

    await request(`/api/tasks/${familyTask.id}`, { method: 'DELETE', token: brunoSession.accessToken, expected: 403 })
    const muted = await request(`/api/tasks/${familyTask.id}/mute`, {
      method: 'PATCH',
      token: brunoSession.accessToken,
      body: { muted: true },
      expected: 200,
    })
    assert.equal(muted.muted, true)
    const anaView = await request(`/api/tasks/${familyTask.id}`, { token: refreshed.accessToken, expected: 200 })
    assert.equal(anaView.muted, false)

    await request('/api/families/me/members', {
      method: 'POST',
      token: brunoSession.accessToken,
      body: { email: ana.email },
      expected: 403,
    })

    const brunoFamilyTask = await request('/api/tasks', {
      method: 'POST',
      token: brunoSession.accessToken,
      expected: 201,
      body: { title: 'Reunião da escola', date: '2026-12-16', time: '08:00', reminderEnabled: false, visibility: 'FAMILY' },
    })
    await request(`/api/tasks/${brunoFamilyTask.id}`, { method: 'DELETE', token: refreshed.accessToken, expected: 204 })
    const afterAdminDelete = await request('/api/tasks?from=2026-12-01&to=2026-12-31', { token: brunoSession.accessToken, expected: 200 })
    assert.equal(afterAdminDelete.some((task: { id: string }) => task.id === brunoFamilyTask.id), false)

    const forgot = await request('/api/auth/forgot-password', { method: 'POST', body: { email: bruno.email }, expected: 200 })
    assert.match(forgot.devCode, /^\d{6}$/)
    await request('/api/auth/reset-password', {
      method: 'POST',
      body: { email: bruno.email, code: forgot.devCode, password: 'nova-senha-123' },
      expected: 200,
    })
    await request('/api/auth/login', { method: 'POST', body: { email: bruno.email, password }, expected: 401 })
    await request('/api/auth/login', { method: 'POST', body: { email: bruno.email, password: 'nova-senha-123' }, expected: 200 })
    await request('/api/auth/refresh', { method: 'POST', body: { refreshToken: brunoSession.refreshToken }, expected: 401 })

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )
    const form = new FormData()
    form.append('photo', new Blob([png], { type: 'image/png' }), 'avatar.png')
    const photoResponse = await fetch(`${base}/api/users/me/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshed.accessToken}` },
      body: form,
    })
    const photoBody = await photoResponse.json()
    assert.equal(photoResponse.status, 200, JSON.stringify(photoBody))
    assert.match(photoBody.photo, /^\/uploads\/.+\.png$/)

    console.info('Fluxo da API verificado com sucesso.')
  } finally {
    await stopServer(server)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
