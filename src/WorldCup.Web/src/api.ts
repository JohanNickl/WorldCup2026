import type { Game, Group, Bracket } from './types'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  games: () => get<Game[]>('/api/games'),
  groups: () => get<Group[]>('/api/groups'),
  bracket: () => get<Bracket>('/api/bracket'),
}
