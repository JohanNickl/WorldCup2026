import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Group, TeamStanding } from '../types'

interface GroupCardProps {
  group: Group
  favourites: Set<string>
  toggleFavourite: (team: string) => void
}

function GroupCard({ group, favourites, toggleFavourite }: GroupCardProps) {
  const sorted = [...group.teams].sort((a, b) =>
    b.points !== a.points ? b.points - a.points :
    b.gd !== a.gd ? b.gd - a.gd :
    b.gf - a.gf
  )

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h2 className="text-sm font-bold text-emerald-400">Group {group.group}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left px-4 py-2 font-medium w-full">Team</th>
              <th className="px-2 py-2 font-medium">P</th>
              <th className="px-2 py-2 font-medium">W</th>
              <th className="px-2 py-2 font-medium">D</th>
              <th className="px-2 py-2 font-medium">L</th>
              <th className="px-2 py-2 font-medium">GF</th>
              <th className="px-2 py-2 font-medium">GA</th>
              <th className="px-2 py-2 font-medium">GD</th>
              <th className="px-2 py-2 font-medium text-emerald-400">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team: TeamStanding, i) => {
              const isFav = favourites.has(team.team)
              return (
                <tr
                  key={team.team}
                  className={`border-b border-gray-800 last:border-0 ${
                    isFav ? 'bg-amber-400/[0.04]' : i < 2 ? 'bg-emerald-400/5' : ''
                  }`}
                >
                  <td className="px-4 py-2 font-medium text-gray-200">
                    <div className="flex items-center gap-2">
                      {i < 2 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                      {i === 2 && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />}
                      {i === 3 && <span className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />}
                      <span>{team.flag}</span>
                      <span>{team.team}</span>
                      <button
                        onClick={() => toggleFavourite(team.team)}
                        className="ml-auto pl-2 leading-none transition-colors"
                        aria-label={isFav ? `Unstar ${team.team}` : `Star ${team.team}`}
                      >
                        {isFav
                          ? <span className="text-amber-400">★</span>
                          : <span className="text-gray-600 hover:text-gray-400">☆</span>
                        }
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-gray-400">{team.played}</td>
                  <td className="px-2 py-2 text-center text-gray-400">{team.won}</td>
                  <td className="px-2 py-2 text-center text-gray-400">{team.drawn}</td>
                  <td className="px-2 py-2 text-center text-gray-400">{team.lost}</td>
                  <td className="px-2 py-2 text-center text-gray-400">{team.gf}</td>
                  <td className="px-2 py-2 text-center text-gray-400">{team.ga}</td>
                  <td className="px-2 py-2 text-center text-gray-400">{team.gd >= 0 ? `+${team.gd}` : team.gd}</td>
                  <td className="px-2 py-2 text-center font-bold text-emerald-400">{team.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-1.5 flex gap-4 text-xs text-gray-600 bg-gray-900 border-t border-gray-800">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Advance</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" /> Possible 3rd</span>
      </div>
    </div>
  )
}

interface Props {
  favourites: Set<string>
  toggleFavourite: (team: string) => void
}

export default function StandingsTab({ favourites, toggleFavourite }: Props) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.groups()
      .then(setGroups)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-40 text-gray-500">Loading standings…</div>
  if (error) return <div className="p-4 text-red-400">Failed to load standings: {error}</div>

  return (
    <div className="px-4 py-4 space-y-4">
      {groups.map(group => (
        <GroupCard key={group.group} group={group} favourites={favourites} toggleFavourite={toggleFavourite} />
      ))}
    </div>
  )
}
