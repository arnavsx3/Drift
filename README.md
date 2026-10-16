# Drift

**Trust your timing. Lose track of time.**

A multiplayer timing game built with Elixir/OTP and React, where players compete to stop a hidden timer closest to the target.

> **Status:** Planning stage. The features below describe the intended first release.

## How it works

The challenge is simple: **stop the timer at exactly 7 seconds.**

The timer starts, stays visible briefly, then disappears. Count in your head, trust your instinct, and hit **STOP** when you think you have reached the target.

Once everyone locks in their guess, the results reveal how close each player came. The closest guess wins the round. Five rounds decide the match.

Example results for a seven-second target:

| Player | Stopped at | Difference |
| --- | ---: | ---: |
| Arnav | 7.12s | 0.12s |
| Sam | 6.73s | 0.27s |
| Jay | 8.41s | 1.41s |

## Planned features

- **Solo practice** — Test your internal clock before challenging friends.
- **Private rooms** — Invite friends using a short join code.
- **Multiplayer matches** — Play with two to eight players.
- **Hidden timer** — Start with a visible clock, then rely on your instincts.
- **Round reveals** — Compare everyone's guesses on a shared timeline.
- **Final leaderboard** — See the match standings and start a rematch.

## Tech stack

| Technology | Purpose |
| --- | --- |
| **Elixir** | Game rules, room management, round coordination, and scoring |
| **Erlang/OTP** | Runtime, lightweight processes, messaging, and supervision |
| **Cowboy** | HTTP and WebSocket server |
| **React** | Interactive frontend |
| **Vite** | Frontend development and production builds |

The backend will be written in Elixir and run on Erlang/OTP. React clients will communicate with it through HTTP and WebSockets using Cowboy.

## Architecture

Each game room will run as a supervised Elixir process responsible for its players, round state, submitted guesses, and results.

The frontend will send player actions to the backend and receive live room updates over WebSockets.

The initial version will use temporary rooms stored in memory. Inactive rooms will expire, and restarting the backend will clear active matches.

## Planned repository structure

```text
drift/
├── backend/
│   ├── config/
│   ├── lib/
│   │   ├── drift/          # Game logic, room processes, and supervision
│   │   └── drift_web/      # HTTP and WebSocket handlers
│   ├── test/
│   └── mix.exs
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # Shared interface components
│   │   ├── features/       # Lobby, gameplay, and results
│   │   └── lib/            # Backend connection and helpers
│   └── package.json
├── docs/
├── .github/
│   └── workflows/
└── README.md
```

## Development

Local development will require:

- Elixir
- Erlang/OTP
- Node.js and npm
- Git

Cowboy and frontend packages will be installed as project dependencies.

Setup commands, supported versions, and test instructions will be added alongside the working implementation.
