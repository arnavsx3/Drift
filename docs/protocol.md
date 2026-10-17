# WebSocket protocol

Connect to `/ws` on the backend. Send one JSON object per text frame. Each connection occupies at most one player seat.

## Client messages

| Message | Fields | Effect |
| --- | --- | --- |
| `create` | `name`, `solo` (boolean) | Create a room and take its host seat |
| `join` | `code`, `name`, optional `token` | Join a lobby, or reconnect to a previous seat |
| `start` | — | Host starts a new five-round match |
| `stop` | — | Lock the sender's guess using server receipt time |
| `next` | — | Host advances after a round reveal |
| `ping` | — | Keep the connection alive; server returns `pong` |

Names must contain 1–20 characters after trimming. Rooms support one solo player or up to eight party players. Party matches need at least two connected players to start. New players may join before a match or after it finishes.

## Server messages

- `joined`: `code`, `player_id`, and a private `token`. Store the token in session storage and send it with `join` after reconnecting. It is a bearer credential; do not put it in share links.
- `state`: a public `room` snapshot, including phase, target, players, and results.
- `error`: a user-facing `message`.
- `pong`: heartbeat acknowledgement.

Phases are `lobby → countdown → playing → reveal`, repeating until the final `finished` phase. Countdown lasts three seconds. `starts_in_ms` is the remaining time until the scheduled start; negative values indicate elapsed time. Results stay empty until reveal. The public state never contains resume tokens or another player's unrevealed guess.

## Scoring and timing

Targets are 5, 6, 7, 8, and 10 seconds, shuffled once per room. A round ends when everyone stops or eight seconds after the target. Missing the deadline incurs a 20-second error penalty. Closest guesses share round wins; the lowest cumulative absolute error wins the match. Exact cumulative ties share the match win.

The backend uses its monotonic clock and receives no client-supplied elapsed value. Network travel time contributes to results. This is a casual timing game, not a latency-neutral competition; play on a stable connection. The browser's local animation is approximate and does not determine the score.

## Room lifecycle

One registered `GenServer` owns each room, under a `DynamicSupervisor`. A disconnected player's seat remains available through their token. A resumed connection replaces its predecessor. Host control transfers to a connected player when the host disconnects. Disconnected seats are removed when the next match starts.

Rooms expire after 15 minutes without game activity. Heartbeats do not extend the lifetime. Rooms and scores are in memory: expiry, a room crash, or a server restart clears them. Room processes use `restart: :temporary` so a failed room is not silently recreated with an empty match.

## Transport limits

- 4 KiB maximum WebSocket frame size.
- 40 text messages per connection per two-second window.
- 60-second socket idle timeout; clients send heartbeats every 20 seconds.
- Up to 500 room processes per server.
- Browser origins must match `ALLOWED_ORIGINS`.

These are development defaults, not a substitute for a reverse proxy and global connection limits on an internet-facing service.
