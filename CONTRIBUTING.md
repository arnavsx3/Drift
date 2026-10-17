# Contributing

Start with [the development guide](docs/development.md). Keep backend game rules in `backend/lib/drift`, transport code in `backend/lib/drift_web`, and frontend features in `frontend/src/features`.

Before submitting a change, run `make check`. Run `make e2e` for changes to gameplay, transport, or browser interactions. Add regression coverage for meaningful behavior changes, especially timing boundaries and reconnect handling.

Keep commits focused on a complete, reviewable chunk. Include the reason for the change and the checks you ran in your pull request.
