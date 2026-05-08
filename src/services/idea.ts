import { Video, Creator } from '../types'

export interface IdeaCreator extends Creator {
  secUid?: string
  updatedAt: string
}

export interface IdeaVideo extends Video {
  fetchedAt: string
}

export interface IdeaFetchResult {
  creatorCount?: number
  fetched: number
  newVideos: number
  errors: { username: string; error: string }[]
  message?: string
}

export async function getIdeaCreators(): Promise<IdeaCreator[]> {
  const res = await fetch('/api/idea-creators')
  if (!res.ok) throw new Error(`Load idea creators failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.creators || []
}

export async function addIdeaCreator(username: string): Promise<{ creator: IdeaCreator; fetchResult: IdeaFetchResult }> {
  const res = await fetch('/api/idea-creators', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Add idea creator failed')
  }
  return res.json()
}

export async function deleteIdeaCreator(username: string) {
  const res = await fetch(`/api/idea-creators/${encodeURIComponent(username)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete idea creator failed: HTTP ${res.status}`)
}

export async function refreshIdeaCreator(username: string): Promise<{ creator: IdeaCreator; fetchResult: IdeaFetchResult }> {
  const res = await fetch(`/api/idea-creators/${encodeURIComponent(username)}/refresh`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Refresh failed')
  }
  return res.json()
}

export async function getIdeaVideos(options?: { creator?: string; limit?: number }): Promise<IdeaVideo[]> {
  const params = new URLSearchParams()
  if (options?.creator) params.set('creator', options.creator)
  if (options?.limit) params.set('limit', String(options.limit))
  const url = `/api/idea-videos${params.toString() ? '?' + params.toString() : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Load idea videos failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.videos || []
}

export async function fetchIdeaVideos(): Promise<IdeaFetchResult> {
  const res = await fetch('/api/idea-videos/fetch', { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Fetch failed')
  }
  return res.json()
}

export async function backfillIdeaVideos(): Promise<IdeaFetchResult> {
  const res = await fetch('/api/idea-videos/backfill', { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || 'Backfill failed')
  }
  return res.json()
}

export function parseTikTokUsername(input: string): string {
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/tiktok\.com\/@([^/?#\s]+)/i)
  const raw = urlMatch ? urlMatch[1] : trimmed
  return raw.replace(/^@/, '').split(/[/?#\s]/)[0]
}
