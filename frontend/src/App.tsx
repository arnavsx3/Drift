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
    <div className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="/"
          aria-label="Drift home"
          onClick={(event) => {
            event.preventDefault()
            if (game.room) game.leave()
          }}
        >
          <span className="brand-icon">
            <TimerReset size={23} strokeWidth={1.7} />
          </span>
          <span>
            drift<span className="brand-period">.</span>
          </span>
        </a>
        <span className="header-caption">A little game of timing.</span>
        <nav aria-label="Main navigation">
          <button
            className="text-button how-button"
            onClick={() => setInstructions(true)}
          >
            <CircleHelp size={16} />
            How to play
          </button>
          <span className="nav-divider" />
          <button
            className="sound-button"
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
        <div className="error-banner" role="alert">
          <span>{game.error}</span>
          <button aria-label="Dismiss message" onClick={game.dismissError}>
            <X size={17} />
          </button>
        </div>
      )}
      {game.connection !== 'connected' && (
        <div className="connection-banner" role="status">
          <span className="status-dot" />
          {game.connection === 'connecting'
            ? 'Connecting to Drift…'
            : 'Connection lost. Reconnecting…'}
        </div>
      )}

      {game.room || game.seat ? (
        <Game game={game} sound={sound} />
      ) : (
        <main className="home-layout">
          <section className="hero-copy">
            <div className="intro-tag">
              <span className="status-dot" />
              NO CLOCK. JUST INSTINCT.
            </div>
            <h1>
              You have a<br />
              <em>sense of time.</em>
              <br />
              Or do you?
            </h1>
            <p className="hero-description">
              The clock disappears. You decide when to stop.
              <br className="desktop-break" /> A tiny challenge for your
              beautifully imperfect brain.
            </p>
            <div className="hero-details">
              <span>
                <Clock3 size={16} />
                Five quick rounds
              </span>
              <span>
                <Users size={16} />
                Solo or with friends
              </span>
            </div>
            <div className="hero-rule" />
            <div className="friend-note">
              <div className="avatar-stack">
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
            <div className="hand-note">
              <svg viewBox="0 0 64 34" aria-hidden="true">
                <path d="M2 12c24 32 38 10 53-4m-12 1 14-3-2 14" />
              </svg>
              <span>let’s see what your gut’s got</span>
            </div>
          </section>

          <section className="entry-card" aria-labelledby="entry-heading">
            <div className="entry-topline">
              <span className="eyebrow" id="entry-heading">
                MEET YOUR INTERNAL CLOCK
              </span>
              <Sparkles size={17} />
            </div>
            <div className="entry-clock">
              <Dial value="07.00" label="CAN YOU FEEL SEVEN SECONDS?" compact />
              <span className="demo-tag">
                <EyeOff size={13} />
                Soon, you won’t see this.
              </span>
            </div>
            <div className="entry-form-area">
              <div
                className="mode-tabs"
                role="group"
                aria-label="Choose how to play"
              >
                <button
                  className={mode === 'solo' ? 'selected' : ''}
                  aria-pressed={mode === 'solo'}
                  onClick={() => setMode('solo')}
                >
                  <TimerReset size={15} />
                  Solo
                </button>
                <button
                  className={mode === 'party' ? 'selected' : ''}
                  aria-pressed={mode === 'party'}
                  onClick={() => setMode('party')}
                >
                  <Users size={15} />
                  With friends
                </button>
                <button
                  className={mode === 'join' ? 'selected' : ''}
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
                      className="code-input"
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
                  className="button button-primary button-wide"
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
              <p className="entry-footnote">
                <Check size={13} />
                No sign-up. No pressure. Okay, a little pressure.
              </p>
            </div>
          </section>

          <section className="how-strip" aria-label="How Drift works">
            <div>
              <span className="step-number">01</span>
              <div>
                <h2>Meet your target.</h2>
                <p>A few seconds. Sounds easy enough.</p>
              </div>
            </div>
            <div>
              <span className="step-number">02</span>
              <div>
                <h2>Lose the clock.</h2>
                <p>It disappears. Your instinct takes over.</p>
              </div>
            </div>
            <div>
              <span className="step-number">03</span>
              <div>
                <h2>Find your drift.</h2>
                <p>Hit stop. See just how close you got.</p>
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer">
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
          className="instructions-modal"
          aria-labelledby="instructions-title"
          onCancel={() => setInstructions(false)}
        >
          <button
            className="modal-close"
            autoFocus
            aria-label="Close instructions"
            onClick={() => setInstructions(false)}
          >
            <X size={20} />
          </button>
          <p className="eyebrow">ONE BUTTON. ONE INSTINCT.</p>
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
          <p className="instructions-small">
            A missed round adds 20 seconds to your total drift. Scores use
            server receipt time, so a stable connection helps. Rooms are
            temporary and expire after 15 minutes without game activity.
          </p>
          <button
            className="button button-primary button-wide"
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
