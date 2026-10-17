# Development

## Requirements

Elixir 1.18.3, Erlang/OTP 27, and Node.js 24 are the development and CI versions. Node.js 22.12+ works with the asset tooling. npm, Git, Make, and Bash 4.3+ are also used.

Phoenix and LiveView are project dependencies installed by Mix; no global Phoenix installation is required. Hex and Rebar are installed once per user:

```sh
mix local.hex --force
mix local.rebar --force
```

## Install and start

From the repository root:

```sh
make setup
make dev
```

Open http://127.0.0.1:4000. The helper first builds browser assets, then runs Phoenix and Vite's asset watcher. Ctrl+C stops both processes. Vite builds files on disk and does not listen on a separate development port.

Restart `make dev` after editing Elixir source. Browser-hook and Tailwind changes rebuild automatically; refresh the page to load them. There is no development-only LiveReload dependency.

To run the two processes separately, build once, then use separate terminals:

```sh
cd assets
npm run build
npm run dev
```

```sh
cd backend
mix run --no-halt
```

## Interface and assets

Elixir UI components are under `backend/lib/drift_web/components`. Keep game rules in `backend/lib/drift`; keep LiveView event handling and presentation under `backend/lib/drift_web`.

Tailwind 4 integrates with Vite in `assets/vite.config.js`. `assets/src/tailwind.css` contains the Tailwind import, shared theme tokens, and an explicit source directive scanning Elixir UI modules. Use complete utility names so Tailwind can detect them. Computed timeline positions use a CSS variable.

The small `assets/src/app.js` file contains browser hooks. Phoenix JavaScript packages are local file dependencies pointing at the exact versions in `backend/deps`, keeping browser and server versions in sync. Run `make setup` after changing Mix dependencies.

Generated bundles are written to `backend/priv/static` and are not committed. There is no React, React DOM, TypeScript application, or HTML entry file to maintain. Playwright specs use TypeScript for browser testing.

## Verification

```sh
make check
```

Checks Elixir and asset formatting, compiles with warnings treated as errors, runs room and LiveView integration tests, builds assets, and audits npm dependencies. Apply formatting with `mix format` in `backend` and `npm run format` in `assets`.

For browser tests:

```sh
cd assets
npx playwright install chromium
cd ..
make e2e
```

Playwright may need system libraries on a fresh Linux environment (`npx playwright install --with-deps chromium`). These browser dependencies are only needed for automated tests.

The browser suite builds assets and starts Phoenix on port 4000. Locally it reuses a server already on that port; restart it before testing changed Elixir source. The suite checks complete solo matches, rematches, multiplayer, private guesses, refresh restoration, host handoff, responsive layouts, and rejected origins.

## Production mode

```sh
make build
cd backend
export SECRET_KEY_BASE="$(mix phx.gen.secret)"
MIX_ENV=prod mix run --no-halt
```

Open http://127.0.0.1:4000. Keep the repository layout intact; this is source-checkout run mode, not a relocatable OTP release. In a deployed environment, generate the secret once and retain it in your environment configuration. Production startup fails clearly if it is missing.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Phoenix/Cowboy listener port |
| `ALLOWED_ORIGINS` | localhost and 127.0.0.1 on port 4000 | Comma-separated origins permitted to connect to LiveView |
| `SECRET_KEY_BASE` | Ephemeral random secret in development/test; required in production | Signs the browser session and LiveView tokens |

Set `ALLOWED_ORIGINS` explicitly when changing the port or using a deployed origin. The listener binds to loopback; expose it through a WebSocket-capable reverse proxy when deploying. Public hosting needs HTTPS/WSS and appropriate connection limits. No hosted deployment is configured.

## Dependency advisory

The locked Cowboy 2.20.0 dependency uses Cowlib 2.21.0, which currently has [CVE-2026-43966](https://cna.erlef.org/cves/CVE-2026-43966.html): response splitting when untrusted values reach a structured-header encoder. There is not yet a fixed Cowlib release in Hex at the time of this implementation.

Drift does not build structured response headers from client input, and explicitly retains Cowboy's `invalid_response_headers: :error_terminate` protection. The advisory identifies Cowboy 2.16+ with that protection as a server-side mitigation. Do not disable it. Review `mix hex.audit` and update the lockfile when a fixed release becomes available; the advisory is documented rather than hidden by a dependency override.
