import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { api } from '../api'
import type { Game, Group, TeamStanding } from '../types'
import { GameCard, useNow } from './GamesTab'
import GameDetailSheet from './GameDetailSheet'

function formatDate(iso: string, timezone: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: timezone,
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

interface TeamCardProps {
  team: TeamStanding
  groupName: string
  position: number
  onUnstar: () => void
}

function TeamCard({ team, groupName, position, onUnstar }: TeamCardProps) {
  const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'
  return (
    <div className="bg-gray-900 rounded-xl border border-amber-400/30 px-4 py-3 flex items-center gap-3">
      <span className="text-2xl leading-none">{team.flag}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{team.team}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {position}{suffix} · Group {groupName} · {team.points} pts
          {team.played > 0 && (
            <span className="ml-1 text-gray-500">
              ({team.won}W {team.drawn}D {team.lost}L)
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onUnstar}
        aria-label={`Unstar ${team.team}`}
        className="text-amber-400 hover:text-amber-300 transition-colors"
      >
        <Star size={16} className="fill-amber-400 text-amber-400" />
      </button>
    </div>
  )
}

interface Props {
  favourites: Set<string>
  toggleFavourite: (team: string) => void
}

export default function FavouritesTab({ favourites, toggleFavourite }: Props) {
  const [games, setGames] = useState<Game[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Game | null>(null)
  const now = useNow()

  useEffect(() => {
    Promise.all([api.games(), api.groups()])
      .then(([g, gr]) => {
        setGames(g.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
        setGroups(gr)
      })
      .finally(() => setLoading(false))
  }, [])

  if (favourites.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <Star size={48} className="text-gray-600" />
        <p className="text-white font-semibold">No favourites yet</p>
        <p className="text-sm text-gray-400">
          Tap a game and star a team in the detail sheet to follow them here.
        </p>
      </div>
    )
  }

  // Build a lookup: team name → { standing, groupName, position }
  type TeamInfo = { standing: TeamStanding; groupName: string; position: number }
  const teamInfo = new Map<string, TeamInfo>()
  for (const group of groups) {
    const sorted = [...group.teams].sort((a, b) =>
      b.points !== a.points ? b.points - a.points :
      b.gd !== a.gd ? b.gd - a.gd :
      b.gf - a.gf
    )
    sorted.forEach((team, i) => {
      teamInfo.set(team.team, { standing: team, groupName: group.group, position: i + 1 })
    })
  }

  const favTeams = [...favourites]
    .map(name => teamInfo.get(name))
    .filter((t): t is TeamInfo => t !== undefined)
    .sort((a, b) => a.groupName.localeCompare(b.groupName) || a.position - b.position)

  const favGames = games.filter(g => favourites.has(g.homeTeam) || favourites.has(g.awayTeam))
  const grouped = groupByDate(favGames)

  return (
    <>
      <div className="px-4 py-4 space-y-6">
        {/* Favourite teams */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Teams</h2>
          {loading ? (
            <div className="text-gray-500 text-sm">Loading…</div>
          ) : (
            <div className="space-y-2">
              {favTeams.map(({ standing, groupName, position }) => (
                <TeamCard
                  key={standing.team}
                  team={standing}
                  groupName={groupName}
                  position={position}
                  onUnstar={() => toggleFavourite(standing.team)}
                />
              ))}
              {/* Teams not yet found in standings data */}
              {[...favourites].filter(name => !teamInfo.has(name)).map(name => (
                <div key={name} className="bg-gray-900 rounded-xl border border-amber-400/30 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-white">{name}</span>
                  <button onClick={() => toggleFavourite(name)} className="text-amber-400 hover:text-amber-300 transition-colors">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Games */}
        {favGames.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Games</h2>
            <div className="space-y-6">
              {[...grouped.entries()].map(([date, dayGames]) => (
                <div key={date}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 sticky top-[56px] bg-gray-950 py-1">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {dayGames.map(game => (
                      <GameCard key={game.id} game={game} favourites={favourites} now={now} onClick={() => setSelected(game)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {selected && <GameDetailSheet game={selected} onClose={() => setSelected(null)} favourites={favourites} toggleFavourite={toggleFavourite} />}
    </>
  )
}
