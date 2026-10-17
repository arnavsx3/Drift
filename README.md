# Drift

**Trust your timing. Lose track of time.**

A multiplayer timing game built with Elixir/OTP and Phoenix LiveView, where players compete to stop a hidden timer closest to the target.

![Drift’s home screen](docs/screenshots/home.png)

## The game

Your target is **7 seconds**. The timer starts, stays visible for 1.5 seconds, then disappears. Count in your head, trust your instinct, and hit **STOP** when you think you have reached the target.

Everyone's guesses stay private until the round ends. The closest guess wins the round; the lowest total timing error across five rounds wins the match. Exact ties share the win.

One button. Five rounds. A beautifully imperfect internal clock.

## What you can play

- **Solo practice:** Challenge your own sense of time.
- **Private multiplayer:** Create a room and invite up to seven friends using its link or six-character code.
- **Five shuffled targets:** Stop at 5, 6, 7, 8, and 10 seconds.
- **Round reveals:** See guesses on a timeline and compare each player's drift.
- **Final leaderboard and rematches:** Keep the rivalry going.
- **Reconnect support:** Refresh the page and recover your seat in the same tab.
- **Host handoff:** A connected player takes over if the host disconnects.
- **Responsive interface:** Play on desktop or mobile, with optional countdown sounds.

A round ends when everyone stops or eight seconds after the target. Missing a round adds a 20-second error penalty.

## Run locally

Requires **Elixir 1.18.3 + Erlang/OTP 27**, **Node.js 24**, npm, Git, Make, and Bash 4.3+. These are the versions used for development; see [the development guide](docs/development.md) for tooling details.

```sh
git clone https://github.com/arnavsx3/Drift.git
cd Drift
make setup
make dev
```

Open **http://127.0.0.1:4000**. Ctrl+C stops the server and asset watcher. No database, account, or API key is needed.

For a two-player test on one machine, use two different browser sessions, such as a normal and private window. Your current tab stores a private reconnect token; a new tab can join as another player.

## Tech stack

| Technology | Purpose |
| --- | --- |
| **Elixir** | Game rules, room state, round coordination, and scoring |
| **Erlang/OTP** | Runtime, lightweight processes, messaging, and supervision |
| **Phoenix LiveView** | Screens, forms, player actions, and live UI updates in Elixir |
| **Cowboy + Plug** | HTTP and WebSocket transport beneath Phoenix |
| **Tailwind CSS** | Styling, responsive layouts, and theme tokens |
| **Vite** | Builds CSS and the small browser hook bundle |
| **JavaScript** | Animated clock, optional sound, clipboard, and per-tab seat storage |
| **Playwright + TypeScript** | End-to-end browser tests |

Each room runs as its own supervised Elixir `GenServer`. A Phoenix LiveView process handles each browser's interface and forwards actions to the room. The room owns its clock, state transitions, and scores; LiveView sends HTML updates over a WebSocket. Browser hooks animate the visible clock without sending a message on every frame.

## Repository structure

```text
drift/
├── backend/
│   ├── config/             # Runtime, endpoint, and origin configuration
│   ├── lib/
│   │   ├── drift/          # Room processes, game rules, and supervision
│   │   └── drift_web/      # Phoenix endpoint, LiveView, and Elixir UI components
│   ├── test/               # Game rules and LiveView integration tests
│   ├── priv/static/        # Generated browser assets (not committed)
│   ├── mix.exs
│   └── mix.lock
├── assets/
│   ├── src/                # Browser hooks and Tailwind theme
│   ├── public/             # Favicon
│   ├── e2e/                # Browser integration tests
│   └── package.json        # Vite and Playwright tooling
├── docs/                   # Architecture, protocol, and development
├── scripts/                # Combined local development command
├── .github/workflows/      # CI checks on pushes and pull requests
├── Makefile
└── README.md
```

Elixir contains both the gameplay and the interface. TypeScript is used for browser tests. The repository does not alter GitHub's language classification; dependencies and generated bundles stay outside version control.

## Checks

```sh
make check
```

Runs Elixir and asset formatting checks, compilation, game and LiveView tests, the asset build, and the npm dependency audit.

For browser integration tests:

```sh
cd assets
npx playwright install chromium
cd ..
make e2e
```

The browser suite exercises complete solo matches, rematches, multiplayer, private guesses, reconnects, host transfer, invalid rooms, and responsive layouts.

## A few things to know

- Rooms and scores live in memory. Rooms expire after 15 minutes without game activity; a server restart clears them.
- Scores use the time a stop message reaches the server. Network delay affects results, so use a stable connection. Drift is a casual game, not a latency-neutral competition.
- Invite links created on localhost work on that machine. Playing across devices requires a reachable deployment and the appropriate allowed origin.
- [Development notes](docs/development.md#dependency-advisory) document the current transitive Cowlib advisory and Cowboy's enabled response-header mitigation.

Production mode requires `SECRET_KEY_BASE`; see the development guide for the build and run commands.

Read the [development guide](docs/development.md), [architecture](docs/architecture.md), [WebSocket protocol](docs/protocol.md), and [contributing notes](CONTRIBUTING.md) for more.
