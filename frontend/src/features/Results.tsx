import { ArrowRight, Crown, RotateCcw, Trophy } from 'lucide-react'
import type { Room } from '../lib/types'
import { driftLabel, rankPlayers, seconds } from '../lib/types'

export function Results({ room, playerId, host, onNext, disabled }: {
  room: Room, playerId: string, host: boolean, onNext: () => void, disabled: boolean
}) {
  const finished = room.phase === 'finished'
  const leaders = rankPlayers(room.players)
  const best = finished ? leaders[0].total_error_ms : room.results[0]?.error_ms
  const winners = finished ? leaders.filter(p => p.total_error_ms === best).map(p => p.id)
    : room.results.filter(r => r.error_ms === best && r.elapsed_ms !== null).map(r => r.player_id)
  const mine = room.results.find(r => r.player_id === playerId)
  const won = winners.includes(playerId)
  const title = finished ? (room.solo ? 'Your time, revealed.' : won ? 'Good instincts. Great finish.' : 'Time got away from you.')
    : mine?.elapsed_ms == null ? 'This one slipped away.' : room.solo ? (mine.error_ms < 500 ? 'You found your rhythm.' : 'That’s your drift.') : won ? 'You found your rhythm.' : 'Close. But how close?'

  return <section className="results-panel" aria-labelledby="results-title">
    <div className="result-emblem">{finished ? <Trophy size={27} /> : <Crown size={27} />}</div>
    <p className="eyebrow">{finished ? 'THAT’S A WRAP' : `ROUND ${room.round} · THE REVEAL`}</p>
    <h2 id="results-title">{title}</h2>
    <p className="result-subtitle">{finished ? 'Lowest total drift takes the match. Every millisecond counted.'
      : `The target was ${seconds(room.target_ms)} seconds. Here’s where everyone landed.`}</p>

    {!finished && <div className="guess-timeline" aria-label="Guess positions relative to the target">
      <div className="timeline-line" /><div className="timeline-target"><span>TARGET</span></div>
      {room.results.filter(r => r.elapsed_ms !== null).map((r, i) => <div key={r.player_id}
        className={`timeline-guess tone-${i % 4}`} style={{ left: `${Math.max(6, Math.min(94,
          50 + ((r.elapsed_ms! - room.target_ms) / room.target_ms) * 42))}%`, top: `${i % 2 ? 56 : 29}px` }}
        title={`${r.name}: ${seconds(r.elapsed_ms!)}s`}><span>{r.name.slice(0, 1).toUpperCase()}</span></div>)}
      <div className="timeline-labels"><span>Too soon</span><span>A little late</span></div>
    </div>}

    <div className="result-list">
      {(finished ? leaders.map(p => ({ id: p.id, name: p.name, value: seconds(p.total_error_ms),
        caption: `${p.wins} round ${p.wins === 1 ? 'win' : 'wins'}`, missed: false }))
        : room.results.map(r => ({ id: r.player_id, name: r.name,
          value: r.elapsed_ms === null ? '—' : seconds(r.elapsed_ms), caption: r.elapsed_ms === null ? 'Missed · +20s penalty' : driftLabel(r.error_ms),
          missed: r.elapsed_ms === null }))).map((p, i) => <div className={`result-row ${p.id === playerId ? 'is-you' : ''}`} key={p.id}>
          <span className="result-rank">{winners.includes(p.id) ? <Crown size={18} /> : String(i + 1).padStart(2, '0')}</span>
          <div className="result-person"><strong>{p.name}{p.id === playerId && <small>you</small>}</strong><span>{p.caption}</span></div>
          <span className={`result-value ${p.missed ? 'muted' : ''}`}>{p.value}<small>{p.missed ? '' : 's'}</small></span>
        </div>)}
    </div>
    {host ? <button className="button button-primary button-wide" onClick={onNext} disabled={disabled}>
      {finished ? 'One more match' : 'Next round'}{finished ? <RotateCcw size={18} /> : <ArrowRight size={18} />}
    </button> : <p className="waiting-note"><span className="status-dot" />Waiting for the host to {finished ? 'start a rematch' : 'start the next round'}…</p>}
  </section>
}
