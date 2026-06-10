import type { Game, Group, Bracket } from './types'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function patch<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

export const api = {
  games: () => get<Game[]>('/api/games'),
  groups: () => get<Group[]>('/api/groups'),
  bracket: () => get<Bracket>('/api/bracket'),
  patchScore: (id: number, homeScore: number, awayScore: number, key: string) =>
    patch<unknown>(`/api/admin/games/${id}/score`, { homeScore, awayScore }, { 'X-Admin-Key': key }),
}
