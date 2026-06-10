import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Game } from '../types'
import GameDetailSheet from './GameDetailSheet'

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

export function GameCard({ game, favourites, onClick }: { game: Game; favourites: Set<string>; onClick: () => void }) {
  const hasScore = game.homeScore !== null && game.awayScore !== null
  const homeFav = favourites.has(game.homeTeam)
  const awayFav = favourites.has(game.awayTeam)
  const isFavMatch = homeFav || awayFav

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
        <span className="text-xs text-gray-400">{formatUserTime(game.date)}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 text-right text-sm font-semibold text-gray-100 flex items-center justify-end gap-1">
          {homeFav && <span className="text-amber-400 text-xs leading-none">★</span>}
          {game.homeTeam}
        </span>
        {hasScore ? (
          <span className="text-base font-bold text-white px-3">
            {game.homeScore} – {game.awayScore}
          </span>
        ) : (
          <span className="text-sm text-gray-600 px-3">vs</span>
        )}
        <span className="flex-1 text-left text-sm font-semibold text-gray-100 flex items-center gap-1">
          {game.awayTeam}
          {awayFav && <span className="text-amber-400 text-xs leading-none">★</span>}
        </span>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        {game.venue} · {game.city}, {game.country}
      </div>
    </div>
  )
}

interface Props {
  favourites: Set<string>
}

export default function GamesTab({ favourites }: Props) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Game | null>(null)

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
                <GameCard key={game.id} game={game} favourites={favourites} onClick={() => setSelected(game)} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {selected && <GameDetailSheet game={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
