import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  CircleHelp,
  Clock3,
  EyeOff,
  Radio,
  Sparkles,
  TimerReset,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { Dial } from './components/Dial'
import { Game } from './features/Game'
import { useGame } from './lib/useGame'

export default function App() {
  const game = useGame()
  const initialCode =
    new URLSearchParams(window.location.search)
      .get('room')
      ?.slice(0, 6)
      .toUpperCase() || ''
  const [mode, setMode] = useState<'solo' | 'party' | 'join'>(
    initialCode ? 'join' : 'solo',
  )
  const [name, setName] = useState(game.seat?.name || '')
  const [code, setCode] = useState(initialCode)
  const [instructions, setInstructions] = useState(false)
  const [sound, setSound] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (instructions && dialog) {
      dialog.showModal()
      return () => dialog.close()
    }
  }, [instructions])

  return (
    <div className="m-auto max-w-360 px-16 py-0 max-[1150px]:px-9 max-[1150px]:py-0 max-[720px]:px-[23px] max-[720px]:py-0 max-[380px]:px-4 max-[380px]:py-0 min-[1400px]:px-[90px] min-[1400px]:py-0 motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none [&_*:focus-visible]:outline-3 [&_*:focus-visible]:outline-offset-4 [&_*:focus-visible]:outline-[#8f9bff] [&_a]:touch-manipulation [&_a_svg]:shrink-0 [&_button]:cursor-pointer [&_button]:touch-manipulation [&_button_svg]:shrink-0 [&_button:disabled]:cursor-default [&_form_input]:mb-4 [&_form_label]:mx-0 [&_form_label]:mt-0 [&_form_label]:mb-[9px] [&_form_label]:block [&_form_label]:text-[11px] [&_form_label]:font-[550] [&_form_label]:text-[#5c5e69] [&_input]:touch-manipulation [&_input::placeholder]:text-[#abacb3] [&_input:focus]:[border-color:#8b93ed]">
      <header className="flex h-25 items-center gap-6 border-b border-line max-[720px]:h-20 max-[720px]:gap-3 [&_nav]:ml-auto [&_nav]:flex [&_nav]:items-center [&_nav]:gap-[23px] max-[720px]:[&_nav]:gap-[15px]">
        <a
          className="inline-flex items-center gap-[9px] text-[35px] font-bold tracking-[-2px] max-[720px]:text-[31px]"
          href="/"
          aria-label="Drift home"
          onClick={(event) => {
            event.preventDefault()
            if (game.room) game.leave()
          }}
        >
          <span className="grid h-[35px] w-[35px] place-items-center rounded-full border border-[#b7b9c4] text-brand max-[720px]:h-[30px] max-[720px]:w-[30px] max-[720px]:[&_svg]:w-5">
            <TimerReset size={23} strokeWidth={1.7} />
          </span>
          <span>
            drift<span className="text-brand">.</span>
          </span>
        </a>
        <span className="ml-[5px] text-[12px] tracking-[0.15px] text-muted max-[720px]:hidden">
          A little game of timing.
        </span>
        <nav aria-label="Main navigation">
          <button
            className="inline-flex items-center justify-center gap-2 bg-transparent px-0 py-2 text-[12px] text-[#555862] max-[720px]:text-[10px] [&:hover]:text-brand"
            onClick={() => setInstructions(true)}
          >
            <CircleHelp size={16} />
            How to play
          </button>
          <span className="h-[17px] w-px bg-[#dcdcd6]" />
          <button
            className="inline-flex items-center justify-center gap-[7px] bg-transparent px-0 py-2 text-[12px] text-[#555862] max-[720px]:[&_span]:hidden [&:hover]:text-brand"
            aria-label={sound ? 'Turn sound off' : 'Turn sound on'}
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>Sound {sound ? 'on' : 'off'}</span>
          </button>
        </nav>
      </header>

      {game.error && (
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-[8px] border border-[#edd3c2] bg-[#f9e9df] px-[17px] py-3 text-[12px] text-[#954d29] [&_button]:flex [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-inherit"
          role="alert"
        >
          <span>{game.error}</span>
          <button aria-label="Dismiss message" onClick={game.dismissError}>
            <X size={17} />
          </button>
        </div>
      )}
      {game.connection !== 'connected' && (
        <div
          className="mt-4 flex items-center justify-start gap-3 rounded-[8px] bg-[#eeeefb] px-[17px] py-3 text-[12px] text-[#626992] [&>span]:[animation-duration:1s] [&>span]:motion-safe:animate-pulse"
          role="status"
        >
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          {game.connection === 'connecting'
            ? 'Connecting to Drift…'
            : 'Connection lost. Reconnecting…'}
        </div>
      )}

      {game.room || game.seat ? (
        <Game game={game} sound={sound} />
      ) : (
        <main className="grid grid-cols-[1fr_475px] gap-x-[70px] pt-[58px] max-[1150px]:grid-cols-[1fr_420px] max-[1150px]:gap-[38px] max-[900px]:grid-cols-[1fr_365px] max-[900px]:gap-x-[26px] max-[900px]:pt-[39px] max-[720px]:grid-cols-[1fr] max-[720px]:gap-y-[30px] max-[720px]:pt-7 min-[1400px]:gap-x-25 min-[1400px]:pt-[70px]">
          <section className="relative pt-[17px] max-[720px]:pt-0 max-[720px]:text-center [&_h1]:mx-0 [&_h1]:mt-[27px] [&_h1]:mb-6 [&_h1]:font-display [&_h1]:text-[82px] [&_h1]:leading-[0.99] [&_h1]:font-normal [&_h1]:tracking-[-2.3px] max-[1150px]:[&_h1]:text-[72px] max-[900px]:[&_h1]:text-[61px] max-[720px]:[&_h1]:mx-0 max-[720px]:[&_h1]:my-[22px] max-[720px]:[&_h1]:text-[66px] max-[720px]:[&_h1]:leading-[0.98] max-[380px]:[&_h1]:text-[59px] min-[1400px]:[&_h1]:text-[91px] [&_h1_em]:font-normal [&_h1_em]:text-brand">
            <div className="inline-flex items-center gap-[9px] rounded-[20px] border border-[#e0dfd8] bg-[#f0efe9] px-[13px] py-[9px] font-mono text-[10px] leading-[normal] font-normal tracking-[1.3px] max-[720px]:px-2.5 max-[720px]:py-2 max-[720px]:text-[8px]">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              NO CLOCK. JUST INSTINCT.
            </div>
            <h1>
              You have a<br />
              <em>sense of time.</em>
              <br />
              Or do you?
            </h1>
            <p className="text-[14px] leading-[1.9] text-[#7b7b85] max-[1150px]:text-[12px] max-[900px]:text-[11px] max-[720px]:m-auto max-[720px]:max-w-[330px] max-[720px]:text-[12px]">
              The clock disappears. You decide when to stop.
              <br className="max-[900px]:hidden" /> A tiny challenge for your
              beautifully imperfect brain.
            </p>
            <div className="mt-6 flex flex-wrap gap-[23px] text-[11px] text-[#646570] max-[900px]:gap-3 max-[900px]:text-[9px] max-[720px]:mt-[18px] max-[720px]:justify-center max-[720px]:gap-[19px] max-[720px]:text-[10px] [&_span]:flex [&_span]:items-center [&_span]:gap-[7px] [&_svg]:text-[#777b91]">
              <span>
                <Clock3 size={16} />
                Five quick rounds
              </span>
              <span>
                <Users size={16} />
                Solo or with friends
              </span>
            </div>
            <div className="mx-0 mt-8 mb-6 h-px w-65 bg-line max-[720px]:hidden" />
            <div className="flex items-center gap-3.5 text-[11px] leading-[1.8] text-[#81818a] max-[720px]:hidden [&_strong]:font-medium [&_strong]:text-[#565861]">
              <div className="flex pl-0 [&_span]:-ml-[7px] [&_span]:grid [&_span]:h-8 [&_span]:w-8 [&_span]:place-items-center [&_span]:rounded-full [&_span]:border-[2px] [&_span]:border-[#f6f5f0] [&_span]:bg-[#dedfe9] [&_span]:text-[10px] [&_span]:text-[#5b6085] [&_span:first-child]:ml-0 [&_span:first-child]:bg-[#e8d9c8] [&_span:first-child]:text-[#886b50] [&_span:last-child]:bg-[#e2e6d9] [&_span:last-child]:text-[#768061]">
                <span>A</span>
                <span>J</span>
                <span>?</span>
              </div>
              <p>
                Good with friends.
                <br />
                <strong>Even better with a little rivalry.</strong>
              </p>
            </div>
            <div className="absolute right-2 bottom-1.5 flex -rotate-[8deg] items-center gap-[7px] font-display text-[17px] leading-[normal] font-normal text-[#9394a2] italic max-[1150px]:-right-[15px] max-[1150px]:text-[15px] max-[900px]:hidden [&_path]:fill-none [&_path]:stroke-[#b2b3bf] [&_path]:stroke-[1.5] [&_path]:[stroke-linecap:round] [&_svg]:h-[30px] [&_svg]:w-[42px] [&_svg]:overflow-visible">
              <svg viewBox="0 0 64 34" aria-hidden="true">
                <path d="M2 12c24 32 38 10 53-4m-12 1 14-3-2 14" />
              </svg>
              <span>let’s see what your gut’s got</span>
            </div>
          </section>

          <section
            className="overflow-hidden rounded-[15px] border border-[#e1e1dc] bg-white shadow-[0_10px_35px_#272a3306] max-[720px]:w-full max-[720px]:max-w-[450px] max-[720px]:justify-self-center"
            aria-labelledby="entry-heading"
          >
            <div className="flex items-center justify-between px-[25px] pt-[22px] pb-0 text-[#8c8e9b] max-[900px]:px-5 max-[900px]:pt-5 max-[900px]:pb-0">
              <span
                className="font-mono text-[9px] leading-[normal] font-normal tracking-[1.6px] text-[#8c8e98] max-[900px]:text-[8px] max-[900px]:tracking-[1.1px]"
                id="entry-heading"
              >
                MEET YOUR INTERNAL CLOCK
              </span>
              <Sparkles size={17} />
            </div>
            <div className="flex flex-col items-center px-0 pt-[3px] pb-6 max-[720px]:pb-[22px]">
              <Dial value="07.00" label="CAN YOU FEEL SEVEN SECONDS?" compact />
              <span className="-mt-[3px] inline-flex items-center gap-[7px] text-[10px] text-[#9395a4]">
                <EyeOff size={13} />
                Soon, you won’t see this.
              </span>
            </div>
            <div className="border-t border-[#eeeeea] bg-[#fafaf8] px-[27px] pt-[23px] pb-5 max-[900px]:p-5 max-[720px]:p-[22px]">
              <div
                className="mb-[23px] flex gap-[3px] rounded-[8px] bg-[#ecece8] p-1 [&_button]:flex [&_button]:flex-1 [&_button]:items-center [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-[5px] [&_button]:bg-transparent [&_button]:px-2 [&_button]:py-2.5 [&_button]:text-[10px] [&_button]:whitespace-nowrap [&_button]:text-[#86868e] max-[900px]:[&_button]:gap-1 max-[900px]:[&_button]:px-[5px] max-[900px]:[&_button]:py-2.5 max-[900px]:[&_button]:text-[9px] max-[720px]:[&_button]:gap-1.5 max-[720px]:[&_button]:px-2 max-[720px]:[&_button]:py-[11px] max-[720px]:[&_button]:text-[10px] max-[380px]:[&_button]:gap-1 max-[380px]:[&_button]:text-[9px] [&_button:hover:not([aria-pressed=true])]:text-brand [&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:font-semibold [&_button[aria-pressed=true]]:text-[#3c4050] [&_button[aria-pressed=true]]:shadow-[0_1px_3px_#23232312]"
                role="group"
                aria-label="Choose how to play"
              >
                <button
                  aria-pressed={mode === 'solo'}
                  onClick={() => setMode('solo')}
                >
                  <TimerReset size={15} />
                  Solo
                </button>
                <button
                  aria-pressed={mode === 'party'}
                  onClick={() => setMode('party')}
                >
                  <Users size={15} />
                  With friends
                </button>
                <button
                  aria-pressed={mode === 'join'}
                  onClick={() => setMode('join')}
                >
                  <Radio size={15} />
                  Join room
                </button>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  game.enter(name, mode, code)
                }}
              >
                <label htmlFor="nickname">What should we call you?</label>
                <input
                  className="block w-full rounded-[7px] border border-[#dedee0] bg-white px-[15px] py-[13px] text-[12px] text-[#303442] outline-offset-2 placeholder:text-[#abacb3] focus:border-[#8b93ed]"
                  id="nickname"
                  name="nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your nickname"
                  maxLength={20}
                  required
                  autoComplete="nickname"
                  disabled={game.busy}
                />
                {mode === 'join' && (
                  <>
                    <label htmlFor="room-code">
                      Your six-character room code
                    </label>
                    <input
                      id="room-code"
                      name="room-code"
                      className="block w-full rounded-[7px] border border-[#dedee0] bg-white px-[15px] py-[13px] font-mono text-[12px] tracking-[3px] text-[#303442] outline-offset-2 placeholder:text-[#abacb3] focus:border-[#8b93ed]"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ABC234"
                      maxLength={6}
                      minLength={6}
                      pattern="[A-Z2-9]{6}"
                      required
                      autoComplete="off"
                      spellCheck={false}
                      disabled={game.busy}
                    />
                  </>
                )}
                <button
                  className="inline-flex min-h-[46px] w-full items-center justify-start gap-[13px] rounded-[7px] bg-brand px-[22px] py-[13px] text-left text-[12px] font-[550] text-white shadow-[0_2px_3px_#303cb515] transition-[background,transform] duration-150 motion-reduce:transition-none [&_svg:last-child]:ml-auto [&:disabled]:opacity-50 [&:hover:not(:disabled)]:-translate-y-px [&:hover:not(:disabled)]:bg-brand-dark"
                  disabled={game.busy || game.connection !== 'connected'}
                  type="submit"
                >
                  {game.busy
                    ? 'Getting things ready…'
                    : mode === 'solo'
                      ? 'Find your rhythm'
                      : mode === 'party'
                        ? 'Create a room'
                        : 'Join the room'}
                  <ArrowRight size={18} />
                </button>
              </form>
              <p className="mt-4 flex items-center justify-center gap-[5px] text-[8.5px] text-[#93949e] max-[720px]:text-[8px] [&_svg]:text-[#8c91aa]">
                <Check size={13} />
                No sign-up. No pressure. Okay, a little pressure.
              </p>
            </div>
          </section>

          <section
            className="col-span-full mt-[58px] grid grid-cols-[repeat(3,_1fr)] gap-7 border-t border-line px-0 pt-7 pb-[30px] max-[720px]:mt-1 max-[720px]:grid-cols-[1fr] max-[720px]:gap-6 max-[720px]:px-0 max-[720px]:py-[25px] min-[1400px]:mt-[70px] [&_h2]:mx-0 [&_h2]:mt-px [&_h2]:mb-1.5 [&_h2]:text-[12px] [&_h2]:font-[550] max-[720px]:[&_h2]:text-[12px] [&_p]:text-[10px] [&_p]:leading-[1.6] [&_p]:text-[#8a8b94] max-[720px]:[&_p]:text-[10px] [&>div]:flex [&>div]:items-start [&>div]:gap-[15px] max-[720px]:[&>div]:max-w-75 max-[720px]:[&>div]:justify-start"
            aria-label="How Drift works"
          >
            <div>
              <span className="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border border-[#dedee0] font-mono text-[11px] leading-[normal] font-normal text-[#9598a5]">
                01
              </span>
              <div>
                <h2>Meet your target.</h2>
                <p>A few seconds. Sounds easy enough.</p>
              </div>
            </div>
            <div>
              <span className="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border border-[#dedee0] font-mono text-[11px] leading-[normal] font-normal text-[#9598a5]">
                02
              </span>
              <div>
                <h2>Lose the clock.</h2>
                <p>It disappears. Your instinct takes over.</p>
              </div>
            </div>
            <div>
              <span className="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border border-[#dedee0] font-mono text-[11px] leading-[normal] font-normal text-[#9598a5]">
                03
              </span>
              <div>
                <h2>Find your drift.</h2>
                <p>Hit stop. See just how close you got.</p>
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="flex justify-between gap-5 border-t border-line px-0 py-[22px] text-[9px] leading-[1.6] text-[#95959d] max-[720px]:flex-col max-[720px]:gap-2.5 max-[720px]:px-0 max-[720px]:py-5 max-[720px]:text-[8px] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-[7px] [&_a:hover]:text-brand">
        <span>A perfect clock is boring. A little drift is human.</span>
        <a
          href="https://github.com/arnavsx3/Drift"
          target="_blank"
          rel="noreferrer"
        >
          Made with Elixir/OTP & React <ArrowRight size={12} />
        </a>
      </footer>

      {instructions && (
        <dialog
          ref={dialogRef}
          className="fixed m-auto max-h-[90dvh] w-[calc(100%_-_40px)] max-w-120 overflow-auto rounded-[16px] border-0 bg-white p-9 text-[#272a33] shadow-[0_20px_100px_#1d214330] max-[720px]:px-[25px] max-[720px]:py-[30px] [&_h2]:mx-0 [&_h2]:mt-[15px] [&_h2]:mb-[22px] [&_h2]:font-display [&_h2]:text-[38px] [&_h2]:leading-[1.1] [&_h2]:font-normal [&_li]:mb-3.5 [&_li]:pl-[5px] [&_li_strong]:font-[550] [&_li_strong]:text-[#52596e] [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-[12px] [&_ol]:leading-[1.8] [&_ol]:text-[#828697] [&::backdrop]:bg-[#20253860] [&::backdrop]:backdrop-blur-[4px]"
          aria-labelledby="instructions-title"
          onCancel={() => setInstructions(false)}
        >
          <button
            className="absolute top-3.5 right-3.5 bg-transparent p-[7px] text-[#9498a8]"
            autoFocus
            aria-label="Close instructions"
            onClick={() => setInstructions(false)}
          >
            <X size={20} />
          </button>
          <p className="font-mono text-[9px] leading-[normal] font-normal tracking-[1.6px] text-[#8c8e98] max-[900px]:text-[8px] max-[900px]:tracking-[1.1px]">
            ONE BUTTON. ONE INSTINCT.
          </p>
          <h2 id="instructions-title">A little lesson in letting go.</h2>
          <ol>
            <li>
              <strong>Know your target.</strong> Each round asks you to stop at
              5, 6, 7, 8, or 10 seconds.
            </li>
            <li>
              <strong>Watch, then feel.</strong> After a three-second countdown,
              the clock runs visibly for 1.5 seconds, then hides.
            </li>
            <li>
              <strong>Hit STOP.</strong> One guess per round. Everyone’s guesses
              stay hidden until the reveal.
            </li>
            <li>
              <strong>Keep your drift low.</strong> Lowest total absolute error
              over five rounds wins. Ties share the win.
            </li>
          </ol>
          <p className="mx-0 my-[22px] text-[10px] leading-[1.8] text-[#9a9eab]">
            A missed round adds 20 seconds to your total drift. Scores use
            server receipt time, so a stable connection helps. Rooms are
            temporary and expire after 15 minutes without game activity.
          </p>
          <button
            className="inline-flex min-h-[46px] w-full items-center justify-start gap-[13px] rounded-[7px] bg-brand px-[22px] py-[13px] text-left text-[12px] font-[550] text-white shadow-[0_2px_3px_#303cb515] transition-[background,transform] duration-150 motion-reduce:transition-none [&_svg:last-child]:ml-auto [&:disabled]:opacity-50 [&:hover:not(:disabled)]:-translate-y-px [&:hover:not(:disabled)]:bg-brand-dark"
            onClick={() => setInstructions(false)}
          >
            I’ve got a good feeling
            <ArrowRight size={18} />
          </button>
        </dialog>
      )}
    </div>
  )
}
