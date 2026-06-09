import { createPortal } from 'react-dom'
import type { Game } from '../types'

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })
}

function addToCalendar(game: Game) {
  const start = new Date(game.date)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 hours

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T` +
    `${pad(d.getHours())}${pad(d.getMinutes())}00`

  const title = encodeURIComponent(`⚽ ${game.homeTeam} vs ${game.awayTeam} — FIFA WC 2026`)
  const details = encodeURIComponent(`Group ${game.group} · FIFA World Cup 2026\n${game.venue}, ${game.city}, ${game.country}`)
  const location = encodeURIComponent(`${game.venue}, ${game.city}, ${game.country}`)

  const url = `https://www.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}` +
    `&dates=${fmt(start)}/${fmt(end)}` +
    `&details=${details}` +
    `&location=${location}`

  window.open(url, '_blank')
}

interface Props {
  game: Game
  onClose: () => void
}

export default function GameDetailSheet({ game, onClose }: Props) {
  const hasScore = game.homeScore !== null && game.awayScore !== null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gray-900 rounded-t-2xl shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        <div className="px-6 pb-10 pt-2 space-y-6">
          {/* Group badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
              Group {game.group} · FIFA World Cup 2026
            </span>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">✕</button>
          </div>

          {/* Teams + score */}
          <div className="flex items-center justify-between gap-4">
            <span className="flex-1 text-right text-xl font-bold text-white leading-tight">{game.homeTeam}</span>
            {hasScore ? (
              <span className="text-3xl font-black text-white tabular-nums px-2">
                {game.homeScore} – {game.awayScore}
              </span>
            ) : (
              <span className="text-2xl font-black text-gray-600 px-2">vs</span>
            )}
            <span className="flex-1 text-left text-xl font-bold text-white leading-tight">{game.awayTeam}</span>
          </div>

          {/* Match details */}
          <div className="bg-gray-800 rounded-xl divide-y divide-gray-700 text-sm">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">📅</span>
              <div>
                <div className="text-gray-200 font-medium">{formatFullDate(game.date)}</div>
                <div className="text-gray-400 text-xs">{formatTime(game.date)} local time</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">🏟️</span>
              <div>
                <div className="text-gray-200 font-medium">{game.venue}</div>
                <div className="text-gray-400 text-xs">{game.city}, {game.country}</div>
              </div>
            </div>
          </div>

          {/* Add to calendar */}
          <button
            onClick={() => addToCalendar(game)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>📆</span>
            Add to Calendar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
