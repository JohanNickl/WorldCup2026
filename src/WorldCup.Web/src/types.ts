export interface GoalEvent {
  scorer: string
  minute: number
  injuryTime?: number
  team: string
  type: string  // REGULAR | OWN_GOAL | PENALTY
}

export interface Game {
  id: number
  date: string
  timezone: string
  group: string
  homeTeam: string
  awayTeam: string
  venue: string
  city: string
  country: string
  homeScore: number | null
  awayScore: number | null
  status: 'scheduled' | 'live' | 'finished'
  referee?: string
  attendance?: number
  minute?: number
  goals?: GoalEvent[]
}

export interface TeamStanding {
  team: string
  flag: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export interface Group {
  group: string
  teams: TeamStanding[]
}

export interface BracketMatch {
  id: string
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  venue: string
  city: string
}

export interface BracketRound {
  name: string
  shortName: string
  matches: BracketMatch[]
}

export interface Bracket {
  rounds: BracketRound[]
}
