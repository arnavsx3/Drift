# Development

## Requirements

Validated on Ubuntu with Elixir 1.18.3, Erlang/OTP 27, and Node.js 24.21.0. Erlang/OTP 27 and Elixir 1.18 or later are required because the backend uses Elixir's built-in JSON module. Node.js 22.12+ is required by the frontend tooling; Node.js 24 is used in CI.

You also need npm, Git, Make, and Bash 4.3+ for the combined development script. Individual server commands work without Make or the script.

Install Hex and Rebar once for your user if needed:

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

Open http://127.0.0.1:5173. Ctrl+C stops both servers. Development defaults are frontend port 5173 and backend port 4000.

Alternatively, run these in separate terminals:

```sh
cd backend
mix run --no-halt
```

```sh
cd frontend
npm run dev
```

Vite proxies `/ws` and `/health` to the backend. Its fixed port prevents silently moving to a port rejected by the backend's origin check.

## Frontend styling

Tailwind CSS 4 is integrated through `@tailwindcss/vite` in `frontend/vite.config.ts`. Components use utility classes for layouts, responsive breakpoints, interaction states, and reduced-motion support.

`frontend/src/tailwind.css` is the stylesheet entry: it contains only the Tailwind import and shared colour/font theme tokens. The old handwritten `style.css` has been removed. Fonts are loaded from the document head, with system fallbacks.

Player colours use complete, static class strings in `frontend/src/lib/appearance.ts` so Tailwind can detect every option at build time. Avoid constructing utility names from partial strings. The results timeline passes its computed horizontal position through a CSS variable consumed by a Tailwind positioning utility.

Prettier's Tailwind plugin sorts utility classes using the project's theme. Browser tests use dedicated test IDs for game results rather than styling class names.

## Verification

```sh
make check
```

This checks Elixir and frontend formatting, compiles with warnings treated as errors, runs backend and frontend unit tests, builds the frontend, and audits its dependencies. Run `mix format` in `backend` or `npm run format` in `frontend` to apply the formatters.

For browser tests, install Playwright's Chromium once, then run:

```sh
cd frontend
npx playwright install chromium
cd ..
make e2e
```

On a fresh Linux environment, Playwright may also require system libraries; its `npx playwright install --with-deps chromium` command installs them. The browser download is for automated testing and is not required to run or play Drift.

The browser suite starts its own servers when ports 4000 and 5173 are free. Locally, it reuses existing servers on those ports. Stop and restart the backend after editing Elixir source; Vite reloads frontend changes automatically.

## Serve the built application

```sh
make build
cd backend
MIX_ENV=prod mix run --no-halt
```

Open http://127.0.0.1:4000. Cowboy serves `frontend/dist`, HTTP health checks, and WebSockets from the same origin. Keep the repository layout intact; this is a source-checkout run mode, not a relocatable OTP release.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Cowboy listener port |
| `ALLOWED_ORIGINS` | localhost and 127.0.0.1 on ports 4000 and 5173 | Comma-separated browser origins permitted to connect to `/ws` |

For a deployed origin, set `ALLOWED_ORIGINS` explicitly to the full origin, including scheme and any nonstandard port. Public hosting also needs HTTPS/WSS, a WebSocket-capable reverse proxy, and appropriate global connection limits. No hosted deployment is configured in this repository.

## Dependency advisory

The locked Cowboy 2.20.0 dependency uses Cowlib 2.21.0, which currently has [CVE-2026-43966](https://cna.erlef.org/cves/CVE-2026-43966.html): response splitting when untrusted values reach a structured-header encoder. There is not yet a fixed Cowlib release in Hex at the time of this implementation.

Drift does not build structured response headers from client input, and explicitly retains Cowboy's `invalid_response_headers: :error_terminate` protection. The advisory identifies Cowboy 2.16+ with that protection as a server-side mitigation. Do not disable it. Review `mix hex.audit` and update the lockfile when a fixed release becomes available; the advisory is documented rather than hidden by a dependency override.
