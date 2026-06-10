import { createPortal } from 'react-dom'
import { Calendar, MapPin, CalendarPlus, X } from 'lucide-react'
import type { Game } from '../types'

function formatFullDate(iso: string, timezone: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone,
  })
}

function formatTime(iso: string, timezone: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', timeZone: timezone,
  })
}

function formatUserTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
  })
}

function addToCalendar(game: Game) {
  const start = new Date(game.date)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 hours

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmtUtc = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WorldCup2026//EN',
    'BEGIN:VEVENT',
    `UID:wc2026-${game.id}@worldcup2026`,
    `DTSTART:${fmtUtc(start)}`,
    `DTEND:${fmtUtc(end)}`,
    `SUMMARY:⚽ ${game.homeTeam} vs ${game.awayTeam}`,
    `DESCRIPTION:Group ${game.group} · FIFA World Cup 2026`,
    `LOCATION:${game.venue}\\, ${game.city}\\, ${game.country}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wc2026-${game.homeTeam}-vs-${game.awayTeam}.ics`.replace(/\s+/g, '-')
  a.click()
  URL.revokeObjectURL(url)
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
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
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
              <Calendar size={18} className="text-gray-400 shrink-0" />
              <div>
                <div className="text-gray-200 font-medium">{formatFullDate(game.date, game.timezone)}</div>
                <div className="text-gray-400 text-xs">{formatTime(game.date, game.timezone)} venue time · {formatUserTime(game.date)} your time</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <MapPin size={18} className="text-gray-400 shrink-0" />
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
            <CalendarPlus size={16} />
            Add to Calendar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
