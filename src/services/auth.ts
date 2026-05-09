import { User } from '../types/auth'

const TOKEN_KEY = 'auth_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function getStoredToken(): string | null {
  return getToken()
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return handleResponse(res)
}

export async function getMe(): Promise<User> {
  const res = await fetch('/api/auth/me', {
    headers: { ...authHeaders() },
  })
  return handleResponse(res)
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch('/api/auth/users', {
    headers: { ...authHeaders() },
  })
  return handleResponse(res)
}

export async function registerUser(data: {
  username: string
  password: string
  displayName?: string
  role?: 'admin' | 'user'
}): Promise<User> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`/api/auth/users/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  await handleResponse(res)
}

export async function changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`/api/auth/users/${id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  await handleResponse(res)
}

export async function adminResetPassword(id: number, newPassword: string): Promise<void> {
  const res = await fetch(`/api/auth/users/${id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ newPassword }),
  })
  await handleResponse(res)
}

export async function refreshToken(): Promise<{ token: string }> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { ...authHeaders() },
  })
  return handleResponse(res)
}

export async function updateUser(id: number, data: { displayName?: string; role?: 'admin' | 'user' }): Promise<User> {
  const res = await fetch(`/api/auth/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}
