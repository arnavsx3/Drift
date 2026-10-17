import { describe, expect, it } from 'vitest'
import { rankPlayers, seconds } from './types'
import type { Player } from './types'

describe('leaderboard ordering', () => {
  it('uses total error rather than round wins and does not mutate room state', () => {
    const players: Player[] = [
      {
        id: 'a',
        name: 'A',
        connected: true,
        stopped: false,
        wins: 4,
        total_error_ms: 900,
      },
      {
        id: 'b',
        name: 'B',
        connected: true,
        stopped: false,
        wins: 1,
        total_error_ms: 100,
      },
    ]
    expect(rankPlayers(players).map((p) => p.id)).toEqual(['b', 'a'])
    expect(players.map((p) => p.id)).toEqual(['a', 'b'])
  })
  it('displays sub-second errors and timeout penalties consistently', () => {
    expect(seconds(120)).toBe('0.12')
    expect(seconds(20_000)).toBe('20.00')
  })
})
