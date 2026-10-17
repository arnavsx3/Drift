# LiveView and room messages

The browser uses Phoenix LiveView's `/live/websocket` transport. Phoenix handles joins, heartbeats, reconnects, and HTML diffs. The former custom `/ws` JSON protocol has been removed. Application code uses LiveView events and Elixir messages between processes.

## Browser events

| Event | Fields | Effect |
| --- | --- | --- |
| `form` | `nickname`, optional `room-code` | Keep entry form state in the LiveView |
| `mode` | `mode`: `solo`, `party`, or `join` | Choose how to enter |
| `enter` | `nickname`, optional `room-code` | Create or join a room |
| `action` | `action`: `start`, `stop`, or `next` | Send a validated game action to the room |
| `leave` | — | Detach the seat and return home |
| `instructions`, `close_instructions` | — | Open or close the help dialog |
| `sound` | — | Toggle optional countdown audio |
| `dismiss` | — | Clear a displayed error |

The room validates names (nonblank, at most 20 characters), capacity, membership, host permissions, and phase. Party rooms require two connected players to start and support at most eight players. Solo rooms hold one player. New players may enter a lobby or a finished match.

## Seat credentials

After joining, LiveView pushes a `save-seat` event containing `code`, `player_id`, `token`, and `name`. A browser hook stores it under `drift.seat` in session storage. The token is a bearer credential; never include it in invite URLs or public snapshots.

On refresh or reconnect, the LiveView client supplies the saved seat in its connection parameters. The new LiveView process calls `Room.join/4` with that token. The room replaces the previous process occupying the seat and preserves its score. An invite to another room overrides a saved seat.

The `clear-seat` event removes the stored credential after explicit leave, a failed restore, room expiry/failure, or seat replacement. Storage is optional; without it, play works for the current connection but refresh recovery is unavailable.

## Elixir process messages

A LiveView invokes the room through its public functions:

```elixir
{:ok, room_pid, identity} = Drift.Rooms.create("Arnav", self(), solo: true)
:ok = Drift.Room.action(room_pid, self(), "start")
snapshot = Drift.Room.snapshot(room_pid)
:ok = Drift.Room.leave(room_pid, self())
```

The room sends `{:room_state, snapshot}` to each connected player's LiveView. The snapshot contains phase, round, target, public player status, and revealed results. Results stay empty until the reveal; private submissions and resume tokens are never included.

Lifecycle notifications carry the originating room PID: `{:connection_replaced, room_pid}` and `{:room_closed, room_pid}`. The LiveView also monitors its room. Notifications from a former room are ignored after the player switches rooms.

## Scoring and timing

Phases are `lobby → countdown → playing → reveal`, repeating until `finished`. Targets are 5, 6, 7, 8, and 10 seconds, shuffled once per room. Each round starts with a three-second countdown. `starts_in_ms` is relative to the room's monotonic clock; negative values indicate elapsed time.

The browser dial stays visible for 1.5 seconds and then hides. JavaScript animates that dial locally, without sending messages on every frame. The server accepts no client-supplied elapsed time: a stop's receipt time determines the score.

A round ends when everyone stops or eight seconds after the target. Missing the deadline adds a 20-second absolute error. Closest valid guesses share round wins. Lowest cumulative absolute error wins the match; exact cumulative ties share the win. Network delay contributes to results, so use a stable connection.

## Room lifecycle and transport limits

Each registered room is a temporary child of a `DynamicSupervisor`. Disconnect marks a seat offline and transfers host control. Tokens recover those seats; offline seats are removed when the next match starts. Rooms expire after 15 minutes without game activity, and heartbeats do not extend that lifetime. A room failure or server restart clears its in-memory state.

The endpoint permits 4 KiB WebSocket frames. The LiveView handles at most 40 application events per two-second window; Phoenix heartbeats are handled by the framework. The server allows up to 500 active rooms. Browser origins must match `ALLOWED_ORIGINS`, and LiveView uses the endpoint's signed session and CSRF protection.

These per-connection limits supplement the connection limits of a deployed reverse proxy.
