# Contributing

Start with [the development guide](docs/development.md). Keep game rules in `backend/lib/drift`, LiveView and Elixir UI components in `backend/lib/drift_web`, and browser-only hooks in `assets/src/app.js`.

Run `make check` before submitting changes. Run `make e2e` for gameplay, LiveView, styling, or browser interaction changes. Add regression coverage for meaningful timing, seat, validation, and reconnect behavior.

Keep commits focused on a complete, reviewable chunk. Include the reason for the change and the checks run in your pull request.
