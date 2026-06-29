import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Bracket, BracketMatch, BracketRound } from '../types'

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isPlaceholder(name: string) {
  return !name || /^[123][A-L]|^W |^L /.test(name)
}

function TeamRow({ name, crest, score }: { name: string; crest: string; score: number | null }) {
  const pending = isPlaceholder(name)
  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {!pending && crest && (
          <img src={crest} alt="" className="w-4 h-4 object-contain shrink-0" />
        )}
        <span className={`truncate ${pending ? 'text-gray-600 italic' : 'font-medium text-gray-200'}`}>
          {name || 'TBD'}
        </span>
      </div>
      {score !== null && <span className="ml-1 font-bold text-white tabular-nums">{score}</span>}
    </div>
  )
}

function MatchCard({ match, roundName }: { match: BracketMatch; roundName?: string }) {
  const hasScore = match.homeScore !== null && match.awayScore !== null

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg w-44 text-xs overflow-hidden">
      <div className="bg-gray-800 border-b border-gray-700 px-2 py-1 text-center truncate">
        {roundName && (
          <span className="text-violet-400 font-semibold">{roundName}</span>
        )}
        {roundName && <span className="text-gray-600 mx-1">·</span>}
        <span className="text-gray-400">{formatShortDate(match.date)}</span>
      </div>
      <TeamRow name={match.homeTeam} crest={match.homeCrest} score={hasScore ? match.homeScore : null} />
      <div className="border-t border-gray-800">
        <TeamRow name={match.awayTeam} crest={match.awayCrest} score={hasScore ? match.awayScore : null} />
      </div>
    </div>
  )
}

function RoundColumn({ round }: { round: BracketRound }) {
  return (
    <div className="flex flex-col shrink-0">
      <div className="text-xs font-bold text-emerald-400 text-center mb-3 px-2">
        {round.name}
      </div>
      <div className="flex flex-col gap-3 justify-around flex-1">
        {round.matches.map(match => (
          <MatchCard key={match.id} match={match} roundName={round.name} />
        ))}
      </div>
    </div>
  )
}

export default function BracketTab() {
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.bracket()
      .then(setBracket)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-40 text-gray-500">Loading bracket…</div>
  if (error) return <div className="p-4 text-red-400">Failed to load bracket: {error}</div>
  if (!bracket) return null

  const mainRounds = bracket.rounds.filter(r => r.shortName !== '3rd')
  const thirdPlace = bracket.rounds.find(r => r.shortName === '3rd')

  return (
    <div className="py-4">
      <div className="overflow-x-auto px-4">
        <div className="flex gap-4 items-start min-w-max">
          {mainRounds.map(round => (
            <RoundColumn key={round.shortName} round={round} />
          ))}
        </div>
      </div>

      {thirdPlace && (
        <div className="px-4 mt-6">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Third Place Play-off</div>
          <div className="inline-block">
            <MatchCard match={thirdPlace.matches[0]} roundName={thirdPlace.name} />
          </div>
        </div>
      )}
    </div>
  )
}
