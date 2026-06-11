import { useState, useRef } from 'react'
import { CalendarDays, BarChart3, Trophy, Star, Globe } from 'lucide-react'
import GamesTab from './components/GamesTab'
import StandingsTab from './components/StandingsTab'
import BracketTab from './components/BracketTab'
import FavouritesTab from './components/FavouritesTab'
import AdminPanel from './components/AdminPanel'

type Tab = 'games' | 'standings' | 'bracket' | 'favourites'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'games', label: 'Games', icon: <CalendarDays size={20} /> },
  { id: 'standings', label: 'Standings', icon: <BarChart3 size={20} /> },
  { id: 'bracket', label: 'Bracket', icon: <Trophy size={20} /> },
  { id: 'favourites', label: 'Favourites', icon: <Star size={20} /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('games')
  const [showAdmin, setShowAdmin] = useState(false)
  const [favourites, setFavourites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('favouriteTeams')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set()
    }
  })
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toggleFavourite(team: string) {
    setFavourites(prev => {
      const next = new Set(prev)
      if (next.has(team)) next.delete(team)
      else next.add(team)
      localStorage.setItem('favouriteTeams', JSON.stringify([...next]))
      return next
    })
  }

  function handleGlobeTap() {
    tapCount.current += 1
    if (tapTimer.current) clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 2000)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      if (tapTimer.current) clearTimeout(tapTimer.current)
      setShowAdmin(true)
    }
  }

  return (
    <div className="flex flex-col min-h-svh bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Globe size={24} className="cursor-pointer select-none text-gray-300 shrink-0" onClick={handleGlobeTap} />
          <div>
            <h1 className="text-base font-bold leading-tight text-white">FIFA World Cup 2026</h1>
            <p className="text-xs text-gray-400">USA · Canada · Mexico</p>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl w-full mx-auto pb-20">
        {tab === 'games'      && <GamesTab favourites={favourites} toggleFavourite={toggleFavourite} />}
        {tab === 'standings'  && <StandingsTab favourites={favourites} />}
        {tab === 'bracket'    && <BracketTab />}
        {tab === 'favourites' && <FavouritesTab favourites={favourites} toggleFavourite={toggleFavourite} />}
      </main>

      {/* Bottom tab nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-gray-900/95 backdrop-blur-md border-t border-gray-800"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                tab === id ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  )
}
