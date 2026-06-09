import { useState } from 'react'
import GamesTab from './components/GamesTab'
import StandingsTab from './components/StandingsTab'
import BracketTab from './components/BracketTab'

type Tab = 'games' | 'standings' | 'bracket'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'games', label: 'Games', icon: '⚽' },
  { id: 'standings', label: 'Standings', icon: '📊' },
  { id: 'bracket', label: 'Bracket', icon: '🏆' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('games')

  return (
    <div className="flex flex-col min-h-svh bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <h1 className="text-base font-bold leading-tight text-white">FIFA World Cup 2026</h1>
            <p className="text-xs text-gray-400">USA · Canada · Mexico</p>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl w-full mx-auto pb-20">
        {tab === 'games' && <GamesTab />}
        {tab === 'standings' && <StandingsTab />}
        {tab === 'bracket' && <BracketTab />}
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
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
