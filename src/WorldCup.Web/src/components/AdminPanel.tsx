import { useState, useEffect } from 'react'
import { api } from '../api'
import type { Game } from '../types'

interface Props {
  onClose: () => void
}

type ScoreState = {
  home: string
  away: string
  saving: boolean
  saved: boolean
  error: string | null
}

export default function AdminPanel({ onClose }: Props) {
  const [authenticated, setAuthenticated] = useState(() => !!sessionStorage.getItem('adminKey'))
  const [keyInput, setKeyInput] = useState('')
  const [keyError, setKeyError] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [scores, setScores] = useState<Record<number, ScoreState>>({})

  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    api.games()
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setGames(sorted)
        const initial: Record<number, ScoreState> = {}
        for (const g of sorted) {
          initial[g.id] = {
            home: g.homeScore != null ? String(g.homeScore) : '',
            away: g.awayScore != null ? String(g.awayScore) : '',
            saving: false,
            saved: false,
            error: null,
          }
        }
        setScores(initial)
      })
      .catch(() => setFetchError('Failed to load games'))
      .finally(() => setLoading(false))
  }, [authenticated])

  function signIn() {
    const key = keyInput.trim()
    if (!key) { setKeyError('Enter the admin key'); return }
    sessionStorage.setItem('adminKey', key)
    setAuthenticated(true)
    setKeyError('')
  }

  function signOut() {
    sessionStorage.removeItem('adminKey')
    setAuthenticated(false)
    setKeyInput('')
    setGames([])
    setScores({})
  }

  async function save(game: Game) {
    const s = scores[game.id]
    if (!s) return
    const homeScore = parseInt(s.home, 10)
    const awayScore = parseInt(s.away, 10)
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      setScores(prev => ({ ...prev, [game.id]: { ...prev[game.id], error: 'Enter valid scores (0 or above)' } }))
      return
    }
    setScores(prev => ({ ...prev, [game.id]: { ...prev[game.id], saving: true, error: null } }))
    const key = sessionStorage.getItem('adminKey') ?? ''
    try {
      await api.patchScore(game.id, homeScore, awayScore, key)
      setScores(prev => ({ ...prev, [game.id]: { ...prev[game.id], saving: false, saved: true } }))
      setTimeout(() => {
        setScores(prev => ({ ...prev, [game.id]: { ...prev[game.id], saved: false } }))
      }, 2000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('401')) {
        signOut()
      } else {
        setScores(prev => ({ ...prev, [game.id]: { ...prev[game.id], saving: false, error: 'Save failed' } }))
      }
    }
  }

  // Group games by date
  const gamesByDate: [string, Game[]][] = []
  for (const game of games) {
    const dateKey = new Date(game.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: game.timezone,
    })
    const existing = gamesByDate.find(([d]) => d === dateKey)
    if (existing) existing[1].push(game)
    else gamesByDate.push([dateKey, [game]])
  }

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Admin Access</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
          </div>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && signIn()}
            placeholder="Admin key"
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          {keyError && <p className="text-red-400 text-sm">{keyError}</p>}
          <button
            onClick={signIn}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <h2 className="text-white font-bold">🔒 Admin · Score Entry</h2>
        <div className="flex items-center gap-3">
          <button onClick={signOut} className="text-xs text-gray-400 hover:text-white transition-colors">Sign out</button>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <p className="text-gray-400 text-center py-8">Loading games…</p>}
        {fetchError && <p className="text-red-400 text-center py-8">{fetchError}</p>}
        {!loading && !fetchError && gamesByDate.map(([date, dayGames]) => (
          <div key={date}>
            <div className="px-4 py-2 bg-gray-900/80 text-xs text-gray-400 font-medium uppercase tracking-wider">
              {date}
            </div>
            <div className="divide-y divide-gray-800/60">
              {dayGames.map(game => {
                const s = scores[game.id]
                if (!s) return null
                return (
                  <div key={game.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-medium w-12 shrink-0">Grp {game.group}</span>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-white text-sm truncate flex-1 text-right">{game.homeTeam}</span>
                        <input
                          type="number"
                          min="0"
                          value={s.home}
                          onChange={e => setScores(prev => ({ ...prev, [game.id]: { ...prev[game.id], home: e.target.value, saved: false } }))}
                          className="w-11 text-center bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-gray-500 text-xs">–</span>
                        <input
                          type="number"
                          min="0"
                          value={s.away}
                          onChange={e => setScores(prev => ({ ...prev, [game.id]: { ...prev[game.id], away: e.target.value, saved: false } }))}
                          className="w-11 text-center bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-white text-sm truncate flex-1">{game.awayTeam}</span>
                      </div>
                      <button
                        onClick={() => save(game)}
                        disabled={s.saving}
                        className={`ml-1 shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                          s.saved
                            ? 'bg-emerald-800 text-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {s.saving ? '…' : s.saved ? '✓' : 'Save'}
                      </button>
                    </div>
                    {s.error && <p className="text-red-400 text-xs mt-1 ml-14">{s.error}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
