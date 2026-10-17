import type { CSSProperties } from 'react'
import { avatarTones } from '../lib/appearance'
import { ArrowRight, Crown, RotateCcw, Trophy } from 'lucide-react'
import type { Room } from '../lib/types'
import { driftLabel, rankPlayers, seconds } from '../lib/types'

export function Results({
  room,
  playerId,
  host,
  onNext,
  disabled,
}: {
  room: Room
  playerId: string
  host: boolean
  onNext: () => void
  disabled: boolean
}) {
  const finished = room.phase === 'finished'
  const leaders = rankPlayers(room.players)
  const best = finished ? leaders[0].total_error_ms : room.results[0]?.error_ms
  const winners = finished
    ? leaders.filter((p) => p.total_error_ms === best).map((p) => p.id)
    : room.results
        .filter((r) => r.error_ms === best && r.elapsed_ms !== null)
        .map((r) => r.player_id)
  const mine = room.results.find((r) => r.player_id === playerId)
  const won = winners.includes(playerId)
  const title = finished
    ? room.solo
      ? 'Your time, revealed.'
      : won
        ? 'Good instincts. Great finish.'
        : 'Time got away from you.'
    : mine?.elapsed_ms == null
      ? 'This one slipped away.'
      : room.solo
        ? mine.error_ms < 500
          ? 'You found your rhythm.'
          : 'That’s your drift.'
        : won
          ? 'You found your rhythm.'
          : 'Close. But how close?'

  return (
    <section
      className="px-[34px] py-[29px] text-center max-[900px]:px-[21px] max-[900px]:py-[26px] max-[720px]:px-[22px] max-[720px]:py-7 [&_h2]:mx-0 [&_h2]:mt-[11px] [&_h2]:mb-[9px] [&_h2]:font-display [&_h2]:text-[35px] [&_h2]:leading-[1.2] [&_h2]:font-normal max-[900px]:[&_h2]:text-[30px]"
      aria-labelledby="results-title"
    >
      <div className="mx-auto mt-0 mb-[18px] grid h-14 w-14 place-items-center rounded-full bg-[#eeeefb] text-[#838bd1]">
        {finished ? <Trophy size={27} /> : <Crown size={27} />}
      </div>
      <p className="font-mono text-[9px] leading-[normal] font-normal tracking-[1.6px] text-[#8c8e98] max-[900px]:text-[8px] max-[900px]:tracking-[1.1px]">
        {finished ? 'THAT’S A WRAP' : `ROUND ${room.round} · THE REVEAL`}
      </p>
      <h2 id="results-title">{title}</h2>
      <p className="text-[10px] leading-[1.8] text-[#9699a6]">
        {finished
          ? 'Lowest total drift takes the match. Every millisecond counted.'
          : `The target was ${seconds(room.target_ms)} seconds. Here’s where everyone landed.`}
      </p>

      {!finished && (
        <div
          className="relative mt-[19px] h-27"
          aria-label="Guess positions relative to the target"
        >
          <div className="absolute top-[51px] right-0 left-0 h-px bg-[#dfdfe9]" />
          <div className="absolute top-7 left-1/2 h-[46px] w-px bg-[#9099eb] [&>span]:absolute [&>span]:-top-4 [&>span]:-translate-x-1/2 [&>span]:font-mono [&>span]:text-[7px] [&>span]:leading-[normal] [&>span]:font-normal [&>span]:tracking-[1px] [&>span]:text-[#949bd1]">
            <span>TARGET</span>
          </div>
          {room.results
            .filter((r) => r.elapsed_ms !== null)
            .map((r, i) => (
              <div
                key={r.player_id}
                className={`absolute left-(--guess-left) grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full border-[2px] border-white text-[9px] ${avatarTones[i % avatarTones.length]} ${i % 2 ? 'top-14' : 'top-[29px]'}`}
                style={
                  {
                    '--guess-left': `${Math.max(
                      6,
                      Math.min(
                        94,
                        50 +
                          ((r.elapsed_ms! - room.target_ms) / room.target_ms) *
                            42,
                      ),
                    )}%`,
                  } as CSSProperties
                }
                title={`${r.name}: ${seconds(r.elapsed_ms!)}s`}
              >
                <span>{r.name.slice(0, 1).toUpperCase()}</span>
              </div>
            ))}
          <div className="flex justify-between pt-21 font-mono text-[8px] leading-[normal] font-normal text-[#a3a5b2]">
            <span>Too soon</span>
            <span>A little late</span>
          </div>
        </div>
      )}

      <div
        data-testid="result-list"
        className="mx-0 my-[22px] border-t border-[#edeef2] text-left"
      >
        {(finished
          ? leaders.map((p) => ({
              id: p.id,
              name: p.name,
              value: seconds(p.total_error_ms),
              caption: `${p.wins} round ${p.wins === 1 ? 'win' : 'wins'}`,
              missed: false,
            }))
          : room.results.map((r) => ({
              id: r.player_id,
              name: r.name,
              value: r.elapsed_ms === null ? '—' : seconds(r.elapsed_ms),
              caption:
                r.elapsed_ms === null
                  ? 'Missed · +20s penalty'
                  : driftLabel(r.error_ms),
              missed: r.elapsed_ms === null,
            }))
        ).map((p, i) => (
          <div
            data-you={p.id === playerId}
            data-testid="result-row"
            className="flex items-center gap-[13px] border-b border-[#edeef2] px-2.5 py-[15px] [&[data-you=true]]:bg-[#f8f8fe]"
            key={p.id}
          >
            <span className="w-[22px] shrink-0 font-mono text-[10px] leading-[normal] font-normal text-[#a9acc0] [&_svg]:text-[#a49ad3]">
              {winners.includes(p.id) ? (
                <Crown size={18} />
              ) : (
                String(i + 1).padStart(2, '0')
              )}
            </span>
            <div className="min-w-0 flex-1 [&_small]:ml-[3px] [&_small]:font-mono [&_small]:text-[8px] [&_small]:leading-[normal] [&_small]:font-normal [&_small]:text-[#9b9eaa] [&_strong]:flex [&_strong]:items-center [&_strong]:gap-1.5 [&_strong]:text-[12px] [&_strong]:font-[550] [&_strong]:wrap-anywhere [&>span]:mt-[5px] [&>span]:block [&>span]:text-[10px] [&>span]:text-[#969aad]">
              <strong>
                {p.name}
                {p.id === playerId && <small>you</small>}
              </strong>
              <span>{p.caption}</span>
            </div>
            <span
              className={`font-mono text-[19px] leading-[normal] font-normal tracking-[-0.6px] text-[#616783] [&_small]:ml-1 [&_small]:text-[10px] [&_small]:text-[#9a9fb3] ${p.missed ? 'text-[#adb0bb]!' : ''}`}
            >
              {p.value}
              <small>{p.missed ? '' : 's'}</small>
            </span>
          </div>
        ))}
      </div>
      {host ? (
        <button
          className="inline-flex min-h-[46px] w-full items-center justify-start gap-[13px] rounded-[7px] bg-brand px-[22px] py-[13px] text-left text-[12px] font-[550] text-white shadow-[0_2px_3px_#303cb515] transition-[background,transform] duration-150 motion-reduce:transition-none [&_svg:last-child]:ml-auto [&:disabled]:opacity-50 [&:hover:not(:disabled)]:-translate-y-px [&:hover:not(:disabled)]:bg-brand-dark"
          onClick={onNext}
          disabled={disabled}
        >
          {finished ? 'One more match' : 'Next round'}
          {finished ? <RotateCcw size={18} /> : <ArrowRight size={18} />}
        </button>
      ) : (
        <p className="mt-[23px] flex items-center justify-center gap-2 text-[11px] leading-[1.6] text-[#979ba9]">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          Waiting for the host to{' '}
          {finished ? 'start a rematch' : 'start the next round'}…
        </p>
      )}
    </section>
  )
}
