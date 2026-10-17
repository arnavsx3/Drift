defmodule Drift.Room do
  @moduledoc "One supervised process owns a match. Browser clocks never determine scores."
  use GenServer, restart: :temporary

  @targets [5_000, 7_000, 10_000, 6_000, 8_000]
  @miss_penalty 20_000

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts,
      name: {:via, Registry, {Drift.RoomRegistry, Keyword.fetch!(opts, :code)}}
    )
  end

  def join(pid, name, socket, token \\ nil), do: call(pid, {:join, name, socket, token})
  def action(pid, socket, action), do: call(pid, {:action, socket, action})
  def leave(pid, socket), do: call(pid, {:leave, socket})
  def snapshot(pid), do: call(pid, :snapshot)

  defp call(pid, message) do
    GenServer.call(pid, message)
  catch
    :exit, _ -> {:error, "This room has closed. Create a new one."}
  end

  @impl true
  def init(opts) do
    clock = Keyword.get(opts, :clock, fn -> System.monotonic_time(:millisecond) end)
    ttl = Keyword.get(opts, :ttl_ms, 15 * 60 * 1_000)
    Process.send_after(self(), :check_expiry, ttl)

    {:ok,
     %{
       code: Keyword.fetch!(opts, :code),
       solo: Keyword.get(opts, :solo, false),
       players: %{},
       monitors: %{},
       host_id: nil,
       phase: :lobby,
       round: 0,
       targets: Keyword.get(opts, :targets, Enum.shuffle(@targets)),
       results: [],
       submissions: %{},
       started_at: nil,
       deadline: nil,
       countdown_ms: Keyword.get(opts, :countdown_ms, 3_000),
       extra_ms: Keyword.get(opts, :extra_ms, 8_000),
       clock: clock,
       ttl_ms: ttl,
       last_activity: clock.(),
       timer: nil
     }}
  end

  @impl true
  def handle_call(:snapshot, _from, state), do: {:reply, public(state), state}

  def handle_call({:leave, socket}, _from, state) do
    monitors =
      Enum.reduce(state.monitors, state.monitors, fn {ref, pid}, acc ->
        if pid == socket do
          Process.demonitor(ref, [:flush])
          Map.delete(acc, ref)
        else
          acc
        end
      end)

    state = disconnect(%{state | monitors: monitors}, socket)
    broadcast(state)
    {:reply, :ok, state}
  end

  def handle_call({:join, name, socket, token}, _from, state) do
    cond do
      not is_binary(name) or String.trim(name) == "" or String.length(name) > 20 ->
        {:reply, {:error, "Choose a name between 1 and 20 characters."}, state}

      token != nil ->
        resume(state, socket, token)

      state.phase not in [:lobby, :finished] ->
        {:reply, {:error, "This match has started. Join after it finishes."}, state}

      map_size(state.players) >= if(state.solo, do: 1, else: 8) ->
        {:reply, {:error, "This room is full."}, state}

      true ->
        id = random_token(6)

        player = %{
          id: id,
          name: String.trim(name),
          token: random_token(24),
          socket: socket,
          wins: 0,
          total_error_ms: 0,
          order: map_size(state.players)
        }

        ref = Process.monitor(socket)

        state = %{
          state
          | players: Map.put(state.players, id, player),
            monitors: Map.put(state.monitors, ref, socket),
            host_id: state.host_id || id
        }

        joined(state, player)
    end
  end

  def handle_call({:action, socket, action}, _from, state) do
    player = Enum.find_value(state.players, fn {_id, p} -> if p.socket == socket, do: p end)

    cond do
      player == nil ->
        {:reply, {:error, "Reconnect to the room to play."}, state}

      action in ["start", "next"] and player.id != state.host_id ->
        {:reply, {:error, "Only the host can start a round."}, state}

      action == "start" and state.phase in [:lobby, :finished] ->
        players =
          state.players
          |> Enum.filter(fn {_, p} -> p.socket != nil end)
          |> Map.new(fn {id, p} -> {id, %{p | wins: 0, total_error_ms: 0}} end)

        if not state.solo and map_size(players) < 2 do
          {:reply, {:error, "Invite at least one friend before starting."}, state}
        else
          next_round(%{state | players: players, round: 0, results: []}) |> respond()
        end

      action == "next" and state.phase == :reveal ->
        next_round(state) |> respond()

      action == "stop" and state.phase == :playing ->
        submit(state, player)

      true ->
        {:reply, {:error, "That action isn't available right now."}, state}
    end
  end

  @impl true
  def handle_info({:begin_round, round}, %{phase: :countdown, round: round} = state) do
    delay = max(state.deadline - state.clock.(), 0)
    timer = Process.send_after(self(), {:round_timeout, round}, delay)
    state = %{state | phase: :playing, timer: timer} |> touch()
    broadcast(state)
    {:noreply, state}
  end

  def handle_info({:round_timeout, round}, %{phase: :playing, round: round} = state) do
    state = reveal(state)
    broadcast(state)
    {:noreply, state}
  end

  def handle_info({:DOWN, ref, :process, socket, _}, state) do
    if Map.get(state.monitors, ref) == socket do
      state = disconnect(%{state | monitors: Map.delete(state.monitors, ref)}, socket)

      broadcast(state)
      {:noreply, state}
    else
      {:noreply, state}
    end
  end

  def handle_info(:check_expiry, state) do
    remaining = state.ttl_ms - (state.clock.() - state.last_activity)

    if remaining <= 0 do
      Enum.each(state.players, fn {_, p} ->
        if p.socket, do: send(p.socket, {:room_closed, self()})
      end)

      {:stop, :normal, state}
    else
      Process.send_after(self(), :check_expiry, remaining)
      {:noreply, state}
    end
  end

  def handle_info(_, state), do: {:noreply, state}

  defp resume(state, socket, token) do
    player = Enum.find_value(state.players, fn {_, p} -> if p.token == token, do: p end)

    if player do
      if player.socket && player.socket != socket,
        do: send(player.socket, {:connection_replaced, self()})

      monitors =
        Enum.reduce(state.monitors, state.monitors, fn {ref, pid}, acc ->
          if pid == player.socket do
            Process.demonitor(ref, [:flush])
            Map.delete(acc, ref)
          else
            acc
          end
        end)

      player = %{player | socket: socket}

      state =
        %{
          state
          | players: Map.put(state.players, player.id, player),
            monitors: Map.put(monitors, Process.monitor(socket), socket)
        }
        |> choose_host()

      joined(state, player)
    else
      {:reply, {:error, "Your seat has expired. Join a new match."}, state}
    end
  end

  defp joined(state, player) do
    state = touch(state)
    broadcast(state)
    {:reply, {:ok, %{code: state.code, player_id: player.id, token: player.token}}, state}
  end

  defp next_round(state) do
    cancel_timer(state.timer)
    round = state.round + 1
    started_at = state.clock.() + state.countdown_ms
    target = Enum.at(state.targets, round - 1)
    timer = Process.send_after(self(), {:begin_round, round}, state.countdown_ms)

    %{
      state
      | round: round,
        phase: :countdown,
        started_at: started_at,
        deadline: started_at + target + state.extra_ms,
        timer: timer,
        submissions: %{},
        results: []
    }
  end

  defp submit(state, player) do
    now = state.clock.()

    cond do
      Map.has_key?(state.submissions, player.id) ->
        {:reply, {:error, "Your guess is already locked in."}, state}

      now >= state.deadline ->
        state |> reveal() |> respond()

      true ->
        elapsed = max(now - state.started_at, 0)
        state = %{state | submissions: Map.put(state.submissions, player.id, elapsed)}

        state =
          if map_size(state.submissions) == map_size(state.players),
            do: reveal(state),
            else: state

        respond(state)
    end
  end

  defp reveal(state) do
    cancel_timer(state.timer)
    target = Enum.at(state.targets, state.round - 1)

    results =
      state.players
      |> Enum.map(fn {id, p} ->
        elapsed = Map.get(state.submissions, id)

        %{
          player_id: id,
          name: p.name,
          elapsed_ms: elapsed,
          error_ms: if(elapsed, do: abs(elapsed - target), else: @miss_penalty)
        }
      end)
      |> Enum.sort_by(&{&1.error_ms, &1.name, &1.player_id})

    best = hd(results).error_ms

    players =
      Map.new(state.players, fn {id, p} ->
        result = Enum.find(results, &(&1.player_id == id))
        won = result.elapsed_ms != nil and result.error_ms == best

        {id,
         %{
           p
           | total_error_ms: p.total_error_ms + result.error_ms,
             wins: p.wins + if(won, do: 1, else: 0)
         }}
      end)

    %{
      state
      | players: players,
        results: results,
        timer: nil,
        phase: if(state.round == length(state.targets), do: :finished, else: :reveal)
    }
    |> touch()
  end

  defp respond(state) do
    state = touch(state)
    broadcast(state)
    {:reply, :ok, state}
  end

  defp choose_host(state) do
    host = Map.get(state.players, state.host_id)

    if host && host.socket do
      state
    else
      next =
        state.players
        |> Map.values()
        |> Enum.filter(& &1.socket)
        |> Enum.min_by(& &1.order, fn -> nil end)

      %{state | host_id: if(next, do: next.id, else: nil)}
    end
  end

  defp disconnect(state, socket) do
    players =
      Map.new(state.players, fn {id, p} ->
        {id, if(p.socket == socket, do: %{p | socket: nil}, else: p)}
      end)

    %{state | players: players} |> choose_host()
  end

  defp public(state) do
    now = state.clock.()

    %{
      code: state.code,
      solo: state.solo,
      host_id: state.host_id,
      phase: state.phase,
      round: state.round,
      rounds: length(state.targets),
      target_ms: Enum.at(state.targets, max(state.round - 1, 0)),
      starts_in_ms: if(state.started_at, do: state.started_at - now, else: nil),
      remaining_ms: if(state.deadline, do: max(state.deadline - now, 0), else: nil),
      players:
        state.players
        |> Map.values()
        |> Enum.sort_by(& &1.order)
        |> Enum.map(fn p ->
          %{
            id: p.id,
            name: p.name,
            connected: p.socket != nil,
            stopped: Map.has_key?(state.submissions, p.id),
            wins: p.wins,
            total_error_ms: p.total_error_ms
          }
        end),
      results: state.results
    }
  end

  defp broadcast(state) do
    snapshot = public(state)

    Enum.each(state.players, fn {_, p} ->
      if p.socket, do: send(p.socket, {:room_state, snapshot})
    end)
  end

  defp touch(state), do: %{state | last_activity: state.clock.()}

  defp random_token(bytes),
    do: :crypto.strong_rand_bytes(bytes) |> Base.url_encode64(padding: false)

  defp cancel_timer(nil), do: :ok
  defp cancel_timer(timer), do: Process.cancel_timer(timer)
end
