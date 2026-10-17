import { avatarTones } from '../lib/appearance'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  Flag,
  Link,
  LogOut,
  Sparkles,
  Users,
} from 'lucide-react'
import { Dial } from '../components/Dial'
import { Results } from './Results'
import { rankPlayers, seconds } from '../lib/types'
import type { useGame } from '../lib/useGame'

type GameState = ReturnType<typeof useGame>

export function Game({ game, sound }: { game: GameState; sound: boolean }) {
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
      if (!audio.current || audio.current.state === 'closed')
        audio.current = new AudioContext()
      void audio.current.resume()
    }
  }, [sound])

  useEffect(() => {
    if (room?.phase !== 'countdown' && room?.phase !== 'playing') return
    let id: number
    const tick = () => {
      setNow(performance.now())
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [room?.phase])
  useEffect(() => {
    setPendingStop(false)
  }, [room?.round, room?.phase])
  useEffect(
    () => () => {
      if (audio.current && audio.current.state !== 'closed')
        void audio.current.close()
      if (copyTimer.current) clearTimeout(copyTimer.current)
    },
    [],
  )

  const countdown = Math.max(1, Math.ceil((startAt - now) / 1000))
  const elapsed = Math.max(0, now - startAt)
  const soundKey =
    room?.phase === 'countdown'
      ? `${room.round}-${countdown}`
      : room?.phase === 'playing'
        ? `${room.round}-go`
        : ''
  useEffect(() => {
    if (
      !sound ||
      !soundKey ||
      soundKey === beeped.current ||
      !audio.current ||
      audio.current.state !== 'running'
    )
      return
    beeped.current = soundKey
    const oscillator = audio.current.createOscillator()
    const gain = audio.current.createGain()
    oscillator.connect(gain)
    gain.connect(audio.current.destination)
    oscillator.frequency.value = soundKey.endsWith('go') ? 660 : 440
    gain.gain.setValueAtTime(0.06, audio.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.current.currentTime + 0.12,
    )
    oscillator.start()
    oscillator.stop(audio.current.currentTime + 0.13)
  }, [sound, soundKey])

  if (!room || !seat)
    return (
      <main className="flex min-h-125 items-center justify-center gap-2.5 text-[13px] text-[#85899a]">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
        Getting your seat ready…
      </main>
    )
  const me = room.players.find((p) => p.id === seat.player_id)
  const host = room.host_id === seat.player_id
  const stopped = me?.stopped || pendingStop
  const online = connection === 'connected'
  const hidden = elapsed >= 1500
  const shareUrl = new URL(`?room=${room.code}`, window.location.href).href
  const stop = () => {
    if (
      room.phase === 'playing' &&
      !stopped &&
      online &&
      send({ type: 'stop' })
    )
      setPendingStop(true)
  }
  const action = (type: string) => {
    if (sound && (!audio.current || audio.current.state === 'closed'))
      audio.current = new AudioContext()
    audio.current?.resume()
    send({ type })
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyFallback(true)
    }
  }

  return (
    <main className="px-0 pt-[39px] pb-0 max-[720px]:pt-[30px]">
      <div className="mb-[25px] flex items-center justify-between gap-5 max-[720px]:mb-[22px] max-[720px]:items-start [&_h1]:mt-[9px] [&_h1]:font-display [&_h1]:text-[48px] [&_h1]:leading-[1.2] [&_h1]:font-normal [&_h1]:tracking-[-0.8px] max-[720px]:[&_h1]:text-[37px] max-[720px]:[&_p]:text-[7px] max-[720px]:[&_p]:tracking-[1px]">
        <div>
          <p className="font-mono text-[9px] leading-[normal] font-normal tracking-[1.6px] text-[#8c8e98] max-[900px]:text-[8px] max-[900px]:tracking-[1.1px]">
            {room.solo
              ? 'A LITTLE TIME TO YOURSELF'
              : 'GOOD COMPANY. QUESTIONABLE TIMING.'}
          </p>
          <h1>
            {room.phase === 'lobby'
              ? room.solo
                ? 'Find your rhythm.'
                : 'Gather your people.'
              : 'Trust your gut.'}
          </h1>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 bg-transparent px-0 py-2 text-[11px] text-[#555862] max-[720px]:pt-[22px] max-[720px]:text-[0] max-[720px]:[&_svg]:h-[19px] max-[720px]:[&_svg]:w-[19px] [&:hover]:text-brand"
          onClick={leave}
        >
          <LogOut size={16} />
          Leave {room.solo ? 'practice' : 'room'}
        </button>
      </div>
      <div className="mb-[7px] flex items-center justify-between gap-3 border-t border-line px-0 py-[15px] text-[10px] text-[#898b96] max-[900px]:text-[9px] max-[720px]:gap-[7px] max-[720px]:text-[8px] [&_strong]:font-mono [&_strong]:text-[11px] [&_strong]:leading-[normal] [&_strong]:font-normal [&_strong]:tracking-[2px] [&_strong]:text-brand max-[720px]:[&_strong]:text-[10px] max-[720px]:[&_strong]:tracking-[1px] [&>span:first-child]:inline-flex [&>span:first-child]:items-center [&>span:first-child]:gap-[9px] [&>span:first-child]:text-[#656975] max-[720px]:[&>span:first-child]:gap-1.5">
        <span>
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          {room.solo ? (
            'Solo practice'
          ) : (
            <>
              <Users size={15} />
              Private room <strong>{room.code}</strong>
            </>
          )}
        </span>
        <span>
          {room.round
            ? `Round ${room.round} of ${room.rounds}`
            : `${room.rounds} rounds · one good instinct`}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,_1fr)_300px] items-start gap-6 max-[1150px]:grid-cols-[minmax(0,_1fr)_270px] max-[900px]:grid-cols-[minmax(0,_1fr)_230px] max-[900px]:gap-[15px] max-[720px]:grid-cols-[1fr]">
        <div className="overflow-hidden rounded-[13px] border border-[#e0e1e4] bg-white">
          {room.phase === 'reveal' || room.phase === 'finished' ? (
            <Results
              room={room}
              playerId={seat.player_id}
              host={host}
              onNext={() =>
                action(room.phase === 'finished' ? 'start' : 'next')
              }
              disabled={!online}
            />
          ) : (
            <section
              className="px-[34px] pt-[23px] pb-7 text-center max-[1150px]:px-[25px] max-[1150px]:py-[22px] max-[900px]:p-5 max-[720px]:p-[23px] [&_h2]:mb-2.5 [&_h2]:font-display [&_h2]:text-[29px] [&_h2]:leading-[1.2] [&_h2]:font-normal [&_h2]:tracking-[-0.2px] max-[900px]:[&_h2]:text-[25px] max-[720px]:[&_h2]:text-[29px] max-[380px]:[&_h2]:text-[25px] [&>button]:mt-[21px] [&>button]:min-h-[49px]"
              aria-label="Game timer"
            >
              <div className="mb-[9px] flex items-center justify-between gap-3.5 max-[900px]:gap-2">
                <span className="font-mono text-[8px] leading-[normal] font-normal tracking-[1.4px] text-[#9498a6] max-[720px]:text-[7px]">
                  {room.phase === 'lobby'
                    ? 'THE CHALLENGE'
                    : `ROUND ${String(room.round).padStart(2, '0')}`}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#f0f1fc] px-[9px] py-[7px] font-mono text-[9px] leading-[normal] font-normal text-[#7278a7] max-[900px]:text-[8px]">
                  <Flag size={13} />
                  {room.phase === 'lobby'
                    ? 'Five targets. One match.'
                    : `Target ${seconds(room.target_ms)}s`}
                </span>
              </div>
              <Dial
                label={
                  room.phase === 'lobby'
                    ? 'YOUR INTERNAL CLOCK AWAITS'
                    : room.phase === 'countdown'
                      ? 'TAKE A BREATH'
                      : stopped
                        ? 'GUESS LOCKED IN'
                        : hidden
                          ? 'THE CLOCK IS YOURS'
                          : 'FIND THE RHYTHM'
                }
                value={
                  room.phase === 'lobby'
                    ? '?.??'
                    : room.phase === 'countdown'
                      ? String(countdown).padStart(2, '0')
                      : stopped
                        ? '✓'
                        : hidden
                          ? '?.??'
                          : seconds(elapsed)
                }
                active={room.phase === 'playing' && !stopped}
                hidden={hidden && room.phase === 'playing' && !stopped}
              />
              {room.phase === 'lobby' ? (
                <>
                  <h2>
                    {room.solo
                      ? 'It’s you versus your sense of time.'
                      : 'A little rivalry is good for you.'}
                  </h2>
                  <p className="m-auto max-w-85 text-[11px] leading-[1.8] text-[#92949e]">
                    {room.solo
                      ? 'The timer will disappear after 1.5 seconds. Stop when you think you’ve reached the target.'
                      : 'Share your room link. Once your friends are in, the host can get things ticking.'}
                  </p>
                  {!room.solo && (
                    <div className="mt-[18px] flex items-center gap-[9px] rounded-[7px] border border-dashed border-[#d6d8e5] bg-[#fafafb] px-[13px] py-[11px] [&_button]:ml-auto [&_button]:p-0 [&_button]:text-[10px] max-[720px]:[&_button]:text-[9px] [&>span]:font-mono [&>span]:text-[13px] [&>span]:leading-[normal] [&>span]:font-normal [&>span]:tracking-[2px] [&>span]:text-[#535b93] [&>svg]:text-[#9096b0]">
                      <Link size={16} />
                      <span data-testid="room-code">{room.code}</span>
                      <button
                        className="inline-flex items-center justify-center gap-2 bg-transparent px-0 py-2 text-[12px] text-[#555862] [&:hover]:text-brand"
                        onClick={copy}
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        {copied ? 'Copied!' : 'Copy invite link'}
                      </button>
                    </div>
                  )}
                  {copyFallback && (
                    <label className="mx-0 mt-3.5 mb-[9px] block text-left text-[11px] font-[550] text-[#5c5e69] [&_input]:mt-2">
                      Copy this link
                      <input
                        className="block w-full rounded-[7px] border border-[#dedee0] bg-white px-[15px] py-[13px] text-[12px] text-[#303442] outline-offset-2 placeholder:text-[#abacb3] focus:border-[#8b93ed]"
                        readOnly
                        value={shareUrl}
                        onFocus={(e) => e.target.select()}
                      />
                    </label>
                  )}
                  {host ? (
                    <button
                      className="inline-flex min-h-[46px] w-full items-center justify-start gap-[13px] rounded-[7px] bg-brand px-[22px] py-[13px] text-left text-[12px] font-[550] text-white shadow-[0_2px_3px_#303cb515] transition-[background,transform] duration-150 motion-reduce:transition-none [&_svg:last-child]:ml-auto [&:disabled]:opacity-50 [&:hover:not(:disabled)]:-translate-y-px [&:hover:not(:disabled)]:bg-brand-dark"
                      disabled={
                        !online ||
                        (!room.solo &&
                          room.players.filter((p) => p.connected).length < 2)
                      }
                      onClick={() => action('start')}
                    >
                      {room.solo
                        ? 'Start practice'
                        : room.players.filter((p) => p.connected).length < 2
                          ? 'Waiting for a friend'
                          : 'Start the match'}
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <p className="mt-[23px] flex items-center justify-center gap-2 text-[11px] leading-[1.6] text-[#979ba9]">
                      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      The host will start when everyone’s ready.
                    </p>
                  )}
                </>
              ) : room.phase === 'countdown' ? (
                <>
                  <h2>Aim for {seconds(room.target_ms)} seconds.</h2>
                  <p className="m-auto max-w-85 text-[11px] leading-[1.8] text-[#92949e]">
                    Get ready. The clock starts after the countdown.
                  </p>
                  <button
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-[13px] rounded-[7px] bg-[#f0f1fc] px-[22px] py-[13px] text-[12px] font-[550] text-[#8a8fb9] opacity-100! transition-[background,transform] duration-150 disabled:opacity-100 motion-reduce:transition-none [&:disabled]:opacity-50 [&:hover:not(:disabled)]:-translate-y-px"
                    disabled
                  >
                    Here we go…
                  </button>
                </>
              ) : (
                <>
                  <h2>
                    {stopped
                      ? 'Your instinct is on the record.'
                      : hidden
                        ? 'Feel it. Don’t overthink it.'
                        : 'Keep this rhythm in your head.'}
                  </h2>
                  <p className="m-auto max-w-85 text-[11px] leading-[1.8] text-[#92949e]">
                    {stopped
                      ? 'Waiting for the others. All guesses reveal together.'
                      : `Hit stop when you think ${seconds(room.target_ms)} seconds have passed.`}
                  </p>
                  <button
                    className={`inline-flex min-h-14! w-full items-center justify-center gap-[13px] rounded-[7px] bg-[#e7946d] px-[22px] py-[13px] font-mono text-[12px] leading-[normal] font-normal tracking-[1px] text-white shadow-[0_3px_0_#bd7151] transition-[background,transform] duration-150 motion-reduce:transition-none [&:disabled]:opacity-50 [&:hover:not(:disabled)]:-translate-y-px [&:hover:not(:disabled)]:bg-[#db865f] ${stopped ? 'bg-[#e9ece4]! tracking-normal! text-[#778a61]! opacity-100! shadow-none!' : ''}`}
                    onClick={stop}
                    disabled={!!stopped || !online}
                  >
                    {stopped ? (
                      <>
                        <Check size={21} />
                        Locked in
                      </>
                    ) : (
                      <>
                        <span className="inline-block h-[11px] w-[11px] rounded-[2px] bg-white" />
                        STOP THE CLOCK
                      </>
                    )}
                  </button>
                  <span className="mt-[15px] block text-[9px] text-[#a2a4ae]">
                    {stopped
                      ? 'Breathe. The reveal is coming.'
                      : 'One shot. Make it count.'}
                  </span>
                </>
              )}
            </section>
          )}
        </div>
        <aside className="rounded-[12px] border border-[#e2e2dc] bg-[#f1f0ea] px-[19px] py-[22px] max-[900px]:px-3.5 max-[900px]:py-[19px] max-[720px]:p-[22px]">
          <div className="flex items-center justify-between [&_h2]:text-[13px] [&_h2]:font-[550] [&>span]:rounded-[4px] [&>span]:bg-[#e7e7e1] [&>span]:px-[7px] [&>span]:py-1 [&>span]:font-mono [&>span]:text-[9px] [&>span]:leading-[normal] [&>span]:font-normal [&>span]:text-[#93949c]">
            <h2>{room.solo ? 'Your session' : 'The room'}</h2>
            <span>
              {room.players.filter((p) => p.connected).length}
              {room.solo ? '/1' : '/8'}
            </span>
          </div>
          <p className="mt-2.5 text-[10px] text-[#91939b]">
            {room.phase === 'lobby'
              ? 'No accounts. Just good company.'
              : 'Lowest total drift wins.'}
          </p>
          <div className="mt-[18px]">
            {rankPlayers(room.players).map((p, i) => (
              <div
                className="flex items-center gap-2.5 border-b border-[#e3e3df] px-0 py-3 max-[900px]:gap-[7px] max-[720px]:gap-3"
                key={p.id}
              >
                <div
                  data-testid="player-avatar"
                  className={`relative grid h-[33px] w-[33px] shrink-0 place-items-center rounded-full text-[12px] ${avatarTones[i % avatarTones.length]}`}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                  <span
                    className={
                      p.connected
                        ? 'absolute right-0 bottom-0 h-2 w-2 rounded-full border-[2px] border-[#f1f0ea] bg-[#8d9d70]'
                        : 'absolute right-0 bottom-0 h-2 w-2 rounded-full border-[2px] border-[#f1f0ea] bg-[#b2b2b2]'
                    }
                  />
                </div>
                <div className="min-w-0 flex-1 [&_small]:ml-[3px] [&_small]:font-mono [&_small]:text-[8px] [&_small]:leading-[normal] [&_small]:font-normal [&_small]:text-[#9b9eaa] [&_strong]:flex [&_strong]:items-center [&_strong]:gap-[5px] [&_strong]:text-[11px] [&_strong]:font-[550] [&_strong]:wrap-anywhere max-[900px]:[&_strong]:text-[10px] max-[720px]:[&_strong]:text-[12px] [&>span]:mt-1 [&>span]:block [&>span]:text-[9px] [&>span]:text-[#999aa3] max-[900px]:[&>span]:text-[8px] max-[720px]:[&>span]:text-[10px]">
                  <strong>
                    {p.name}
                    {p.id === seat.player_id && <small>you</small>}
                  </strong>
                  <span>
                    {!p.connected
                      ? 'Reconnecting…'
                      : room.phase === 'lobby'
                        ? 'Ready for a little drift'
                        : room.phase === 'finished'
                          ? `${p.wins} round ${p.wins === 1 ? 'win' : 'wins'}`
                          : p.stopped
                            ? 'Guess locked in'
                            : room.phase === 'reveal'
                              ? 'Missed this round'
                              : 'Finding their rhythm'}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] leading-[normal] font-normal text-[#989cb6] max-[900px]:text-[9px] max-[720px]:text-[11px]">
                  {room.phase === 'lobby'
                    ? p.id === room.host_id && <Crown size={16} />
                    : `${seconds(p.total_error_ms)}s`}
                </span>
              </div>
            ))}
          </div>
          {!room.solo && room.phase === 'lobby' && (
            <button
              className="flex w-full items-center gap-[9px] bg-transparent px-0 py-[15px] text-left text-[10px] text-[#9b9da7] [&:hover]:text-brand [&>span]:grid [&>span]:h-[31px] [&>span]:w-[31px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-dashed [&>span]:border-[#cbccd0] [&>span]:text-[17px] [&>span]:text-[#a9abb6]"
              onClick={copy}
            >
              <span>+</span>There’s room for your friends
            </button>
          )}
          <div className="mt-[18px] flex gap-2.5 border-t border-[#e0e0d9] pt-[18px] text-[#9c9fac] max-[720px]:mt-[15px] [&_p]:text-[10px] [&_p]:leading-[1.8] [&_strong]:font-[450] [&_strong]:text-[#747882]">
            <Sparkles size={17} />
            <p>
              A perfect clock is boring.
              <br />
              <strong>A little drift is human.</strong>
            </p>
          </div>
        </aside>
      </div>
      <p className="px-0 pt-[23px] pb-[30px] text-center text-[9px] leading-[1.7] text-[#999ba5]">
        {room.phase === 'lobby'
          ? 'Tip: play on a stable connection. Your guess is timed when it reaches the server.'
          : 'Miss a round? It ends automatically, with a 20-second drift penalty.'}
      </p>
    </main>
  )
}
