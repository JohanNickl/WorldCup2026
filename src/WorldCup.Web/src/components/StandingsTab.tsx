import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Group, TeamStanding } from '../types'

function GroupCard({ group }: { group: Group }) {
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
            {sorted.map((team: TeamStanding, i) => (
              <tr
                key={team.team}
                className={`border-b border-gray-800 last:border-0 ${i < 2 ? 'bg-emerald-400/5' : ''}`}
              >
                <td className="px-4 py-2 font-medium text-gray-200 flex items-center gap-2">
                  {i < 2 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
                  {i === 2 && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />}
                  {i === 3 && <span className="w-1.5 h-1.5 rounded-full bg-transparent inline-block" />}
                  <span>{team.flag}</span>
                  <span>{team.team}</span>
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
            ))}
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

export default function StandingsTab() {
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
      {groups.map(group => <GroupCard key={group.group} group={group} />)}
    </div>
  )
}
