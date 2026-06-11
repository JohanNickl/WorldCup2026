import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Game } from '../types'
import GameDetailSheet from './GameDetailSheet'

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function fmtCountdown(ms: number) {
  const totalMin = Math.floor(ms / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `-${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmtElapsed(ms: number) {
  const totalMin = Math.floor(ms / 60_000)
  return `${totalMin} min`
}

function formatDate(iso: string, timezone: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: timezone,
  })
}

function formatUserTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
  })
}

function groupByDate(games: Game[]): Map<string, Game[]> {
  const map = new Map<string, Game[]>()
  for (const game of games) {
    const key = formatDate(game.date, game.timezone)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(game)
  }
  return map
}

export function GameCard({ game, favourites, now, onClick }: {
  game: Game
  favourites: Set<string>
  now: number
  onClick: () => void
}) {
  const isLive     = game.status === 'live'
  const showScore  = game.homeScore !== null && game.awayScore !== null
  const isFavMatch = favourites.has(game.homeTeam) || favourites.has(game.awayTeam)

  const gameMs  = new Date(game.date).getTime()
  const diffMs  = gameMs - now
  const THREE_H = 3 * 60 * 60 * 1000
  const timer   = isLive
    ? fmtElapsed(now - gameMs)
    : diffMs > 0 && diffMs <= THREE_H
      ? fmtCountdown(diffMs)
      : null

  return (
    <div
      className={`rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
        isFavMatch
          ? 'bg-amber-400/[0.04] border-amber-400/40 active:bg-amber-400/10'
          : 'bg-gray-900 border-gray-800 active:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
          Group {game.group}
        </span>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-xs font-bold text-yellow-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
                </span>
                LIVE
              </span>
            )}
            <span className="text-xs text-gray-400">{formatUserTime(game.date)}</span>
          </div>
          {timer && (
            <span className={`text-xs font-mono tabular-nums ${isLive ? 'text-yellow-400' : 'text-amber-400'}`}>
              {timer}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 text-right text-sm font-semibold text-gray-100">
          {game.homeTeam}
        </span>
        {showScore ? (
          <span className={`text-base font-bold px-3 tabular-nums ${isLive ? 'text-emerald-400' : 'text-white'}`}>
            {game.homeScore} – {game.awayScore}
          </span>
        ) : (
          <span className="text-sm text-gray-600 px-3">vs</span>
        )}
        <span className="flex-1 text-left text-sm font-semibold text-gray-100">
          {game.awayTeam}
        </span>
      </div>

      <div className="mt-2 text-xs text-gray-300 text-center">
        {game.venue} · {game.city}, {game.country}
      </div>
    </div>
  )
}

interface Props {
  favourites: Set<string>
  toggleFavourite: (team: string) => void
}

export default function GamesTab({ favourites, toggleFavourite }: Props) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Game | null>(null)
  const now = useNow()

  useEffect(() => {
    api.games()
      .then(data => setGames(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-40 text-gray-500">Loading games…</div>
  if (error) return <div className="p-4 text-red-400">Failed to load games: {error}</div>

  const grouped = groupByDate(games)

  return (
    <>
      <div className="px-4 py-4 space-y-6">
        {[...grouped.entries()].map(([date, dayGames]) => (
          <section key={date}>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 sticky top-[56px] bg-gray-950 py-1">
              {date}
            </h2>
            <div className="space-y-2">
              {dayGames.map(game => (
                <GameCard key={game.id} game={game} favourites={favourites} now={now} onClick={() => setSelected(game)} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {selected && <GameDetailSheet game={selected} onClose={() => setSelected(null)} favourites={favourites} toggleFavourite={toggleFavourite} />}
    </>
  )
}
