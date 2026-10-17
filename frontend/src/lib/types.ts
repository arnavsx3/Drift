export type Phase = 'lobby' | 'countdown' | 'playing' | 'reveal' | 'finished'

export interface Player {
  id: string
  name: string
  connected: boolean
  stopped: boolean
  wins: number
  total_error_ms: number
}

export interface Result {
  player_id: string
  name: string
  elapsed_ms: number | null
  error_ms: number
}

export interface Room {
  code: string
  solo: boolean
  host_id: string | null
  phase: Phase
  round: number
  rounds: number
  target_ms: number
  starts_in_ms: number | null
  remaining_ms: number | null
  players: Player[]
  results: Result[]
}

export interface Seat {
  code: string
  player_id: string
  token: string
  name: string
}

export const seconds = (ms: number) => (ms / 1000).toFixed(2)
export const driftLabel = (error: number) => error === 0 ? 'Right on time' : `${seconds(error)}s off`

export function rankPlayers(players: Player[]) {
  return [...players].sort((a, b) => a.total_error_ms - b.total_error_ms || a.name.localeCompare(b.name))
}
