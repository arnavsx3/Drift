import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Copy, Crown, Flag, Link, LogOut, Sparkles, Users } from 'lucide-react'
import { Dial } from '../components/Dial'
import { Results } from './Results'
import { rankPlayers, seconds } from '../lib/types'
import type { useGame } from '../lib/useGame'

type GameState = ReturnType<typeof useGame>

export function Game({ game, sound }: { game: GameState, sound: boolean }) {
  const { room, seat, startAt, send, leave, connection } = game
  const [now, setNow] = useState(performance.now())
  const [copied, setCopied] = useState(false)
  const [copyFallback, setCopyFallback] = useState(false)
  const [pendingStop, setPendingStop] = useState(false)
  const beeped = useRef('')
  const audio = useRef<AudioContext | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (sound) {
      if (!audio.current || audio.current.state === 'closed') audio.current = new AudioContext()
      void audio.current.resume()
    }
  }, [sound])

  useEffect(() => {
    let id: number
    const tick = () => { setNow(performance.now()); id = requestAnimationFrame(tick) }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])
  useEffect(() => { setPendingStop(false) }, [room?.round, room?.phase])
  useEffect(() => () => {
    if (audio.current && audio.current.state !== 'closed') void audio.current.close()
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  const countdown = Math.max(1, Math.ceil((startAt - now) / 1000))
  const elapsed = Math.max(0, now - startAt)
  const soundKey = room?.phase === 'countdown' ? `${room.round}-${countdown}` : room?.phase === 'playing' ? `${room.round}-go` : ''
  useEffect(() => {
    if (!sound || !soundKey || soundKey === beeped.current || !audio.current || audio.current.state !== 'running') return
    beeped.current = soundKey
    const oscillator = audio.current.createOscillator()
    const gain = audio.current.createGain()
    oscillator.connect(gain)
    gain.connect(audio.current.destination)
    oscillator.frequency.value = soundKey.endsWith('go') ? 660 : 440
    gain.gain.setValueAtTime(0.06, audio.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.current.currentTime + 0.12)
    oscillator.start()
    oscillator.stop(audio.current.currentTime + 0.13)
  }, [sound, soundKey])

  if (!room || !seat) return <main className="restoring"><span className="status-dot" />Getting your seat ready…</main>
  const me = room.players.find(p => p.id === seat.player_id)
  const host = room.host_id === seat.player_id
  const stopped = me?.stopped || pendingStop
  const online = connection === 'connected'
  const hidden = elapsed >= 1500
  const shareUrl = new URL(`?room=${room.code}`, window.location.href).href
  const stop = () => {
    if (room.phase === 'playing' && !stopped && online && send({ type: 'stop' })) setPendingStop(true)
  }
  const action = (type: string) => {
    if (sound && (!audio.current || audio.current.state === 'closed')) audio.current = new AudioContext()
    audio.current?.resume()
    send({ type })
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch { setCopyFallback(true) }
  }

  return <main className="game-layout">
    <div className="game-heading">
      <div><p className="eyebrow">{room.solo ? 'A LITTLE TIME TO YOURSELF' : 'GOOD COMPANY. QUESTIONABLE TIMING.'}</p>
        <h1>{room.phase === 'lobby' ? (room.solo ? 'Find your rhythm.' : 'Gather your people.') : 'Trust your gut.'}</h1></div>
      <button className="text-button leave-button" onClick={leave}><LogOut size={16} />Leave {room.solo ? 'practice' : 'room'}</button>
    </div>
    <div className="room-strip">
      <span><span className="status-dot" />{room.solo ? 'Solo practice' : <><Users size={15} />Private room <strong>{room.code}</strong></>}</span>
      <span>{room.round ? `Round ${room.round} of ${room.rounds}` : `${room.rounds} rounds · one good instinct`}</span>
    </div>
    <div className="game-columns">
      <div className="play-panel">
        {(room.phase === 'reveal' || room.phase === 'finished') ? <Results room={room} playerId={seat.player_id}
          host={host} onNext={() => action(room.phase === 'finished' ? 'start' : 'next')} disabled={!online} />
          : <section className="timer-panel" aria-label="Game timer">
            <div className="timer-panel-top"><span className="small-tag">{room.phase === 'lobby' ? 'THE CHALLENGE' : `ROUND ${String(room.round).padStart(2, '0')}`}</span>
              <span className="target-tag"><Flag size={13} />{room.phase === 'lobby' ? 'Five targets. One match.' : `Target ${seconds(room.target_ms)}s`}</span></div>
            <Dial label={room.phase === 'lobby' ? 'YOUR INTERNAL CLOCK AWAITS' : room.phase === 'countdown' ? 'TAKE A BREATH' : stopped ? 'GUESS LOCKED IN' : hidden ? 'THE CLOCK IS YOURS' : 'FIND THE RHYTHM'}
              value={room.phase === 'lobby' ? '?.??' : room.phase === 'countdown' ? String(countdown).padStart(2, '0') : stopped ? '✓' : hidden ? '?.??' : seconds(elapsed)}
              active={room.phase === 'playing' && !stopped} hidden={hidden && room.phase === 'playing' && !stopped} />
            {room.phase === 'lobby' ? <>
              <h2>{room.solo ? 'It’s you versus your sense of time.' : 'A little rivalry is good for you.'}</h2>
              <p className="panel-description">{room.solo ? 'The timer will disappear after 1.5 seconds. Stop when you think you’ve reached the target.'
                : 'Share your room link. Once your friends are in, the host can get things ticking.'}</p>
              {!room.solo && <div className="share-box"><Link size={16} /><span>{room.code}</span>
                <button className="text-button" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied!' : 'Copy invite link'}</button></div>}
              {copyFallback && <label className="fallback-copy">Copy this link<input readOnly value={shareUrl} onFocus={e => e.target.select()} /></label>}
              {host ? <button className="button button-primary button-wide" disabled={!online || (!room.solo && room.players.filter(p => p.connected).length < 2)} onClick={() => action('start')}>
                {room.solo ? 'Start practice' : room.players.filter(p => p.connected).length < 2 ? 'Waiting for a friend' : 'Start the match'}<ArrowRight size={18} /></button>
                : <p className="waiting-note"><span className="status-dot" />The host will start when everyone’s ready.</p>}
            </> : room.phase === 'countdown' ? <><h2>Aim for {seconds(room.target_ms)} seconds.</h2><p className="panel-description">Get ready. The clock starts after the countdown.</p>
              <button className="button button-wide button-countdown" disabled>Here we go…</button></>
              : <><h2>{stopped ? 'Your instinct is on the record.' : hidden ? 'Feel it. Don’t overthink it.' : 'Keep this rhythm in your head.'}</h2>
                <p className="panel-description">{stopped ? 'Waiting for the others. All guesses reveal together.' : `Hit stop when you think ${seconds(room.target_ms)} seconds have passed.`}</p>
                <button className={`button button-wide stop-button ${stopped ? 'stop-locked' : ''}`} onClick={stop} disabled={!!stopped || !online}>
                  {stopped ? <><Check size={21} />Locked in</> : <><span className="stop-square" />STOP THE CLOCK</>}</button>
                <span className="timer-footnote">{stopped ? 'Breathe. The reveal is coming.' : 'One shot. Make it count.'}</span></>}
          </section>}
      </div>
      <aside className="players-panel">
        <div className="players-title"><h2>{room.solo ? 'Your session' : 'The room'}</h2><span>{room.players.filter(p => p.connected).length}{room.solo ? '/1' : '/8'}</span></div>
        <p className="aside-caption">{room.phase === 'lobby' ? 'No accounts. Just good company.' : 'Lowest total drift wins.'}</p>
        <div className="player-list">{rankPlayers(room.players).map((p, i) => <div className="player-row" key={p.id}>
          <div className={`avatar tone-${i % 4}`}>{p.name.slice(0, 1).toUpperCase()}<span className={p.connected ? 'online-dot' : 'offline-dot'} /></div>
          <div className="player-name"><strong>{p.name}{p.id === seat.player_id && <small>you</small>}</strong>
            <span>{!p.connected ? 'Reconnecting…' : room.phase === 'lobby' ? 'Ready for a little drift' : room.phase === 'finished' ? `${p.wins} round ${p.wins === 1 ? 'win' : 'wins'}` : p.stopped ? 'Guess locked in' : room.phase === 'reveal' ? 'Missed this round' : 'Finding their rhythm'}</span></div>
          <span className="player-badge">{room.phase === 'lobby' ? p.id === room.host_id && <Crown size={16} /> : `${seconds(p.total_error_ms)}s`}</span>
        </div>)}</div>
        {!room.solo && room.phase === 'lobby' && <button className="invite-slot" onClick={copy}><span>+</span>There’s room for your friends</button>}
        <div className="little-note"><Sparkles size={17} /><p>A perfect clock is boring.<br /><strong>A little drift is human.</strong></p></div>
      </aside>
    </div>
    <p className="game-bottom-note">{room.phase === 'lobby' ? 'Tip: play on a stable connection. Your guess is timed when it reaches the server.' : 'Miss a round? It ends automatically, with a 20-second drift penalty.'}</p>
  </main>
}
