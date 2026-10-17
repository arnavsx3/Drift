defmodule Drift.RoomTest do
  use ExUnit.Case, async: true
  alias Drift.Room

  setup do
    clock = :atomics.new(1, [])
    code = "TEST#{System.unique_integer([:positive])}"

    room =
      start_supervised!(
        {Room,
         code: code,
         clock: fn -> :atomics.get(clock, 1) end,
         targets: [7_000, 5_000],
         countdown_ms: 3_000}
      )

    {:ok, host} = Room.join(room, "Arnav", self())
    guest_socket = spawn(fn -> Process.sleep(:infinity) end)
    on_exit(fn -> Process.exit(guest_socket, :kill) end)
    {:ok, guest} = Room.join(room, "Sam", guest_socket)
    %{room: room, clock: clock, host: host, guest: guest, guest_socket: guest_socket}
  end

  defp begin_round(room, clock, round, now) do
    :atomics.put(clock, 1, now)
    send(room, {:begin_round, round})
    assert Room.snapshot(room).phase == :playing
  end

  test "only the host starts rounds; early stops are rejected", ctx do
    assert {:error, _} = Room.action(ctx.room, ctx.guest_socket, "start")
    assert :ok = Room.action(ctx.room, self(), "start")
    assert Room.snapshot(ctx.room).phase == :countdown
    assert {:error, _} = Room.action(ctx.room, self(), "stop")
    assert {:error, _} = Room.action(ctx.room, self(), "next")
  end

  test "server time determines scores and guesses stay private until everyone stops", ctx do
    :ok = Room.action(ctx.room, self(), "start")
    begin_round(ctx.room, ctx.clock, 1, 3_000)
    :atomics.put(ctx.clock, 1, 10_120)
    assert :ok = Room.action(ctx.room, self(), "stop")
    state = Room.snapshot(ctx.room)
    assert state.results == []
    assert Enum.find(state.players, &(&1.id == ctx.host.player_id)).stopped
    refute Map.has_key?(hd(state.players), :token)
    refute Map.has_key?(state, :submissions)
    assert {:error, _} = Room.action(ctx.room, self(), "stop")

    :atomics.put(ctx.clock, 1, 10_270)
    :ok = Room.action(ctx.room, ctx.guest_socket, "stop")
    state = Room.snapshot(ctx.room)
    assert state.phase == :reveal

    assert [%{elapsed_ms: 7_120, error_ms: 120}, %{elapsed_ms: 7_270, error_ms: 270}] =
             state.results

    assert Enum.find(state.players, &(&1.id == ctx.host.player_id)).wins == 1
  end

  test "timeouts penalize missed guesses, ignore stale timers, and finish the match", ctx do
    :ok = Room.action(ctx.room, self(), "start")
    begin_round(ctx.room, ctx.clock, 1, 3_000)
    send(ctx.room, {:round_timeout, 0})
    assert Room.snapshot(ctx.room).phase == :playing
    :atomics.put(ctx.clock, 1, 10_000)
    :ok = Room.action(ctx.room, self(), "stop")
    send(ctx.room, {:round_timeout, 1})
    state = Room.snapshot(ctx.room)
    assert state.phase == :reveal
    assert Enum.find(state.results, &(&1.player_id == ctx.guest.player_id)).error_ms == 20_000
    :ok = Room.action(ctx.room, self(), "next")
    begin_round(ctx.room, ctx.clock, 2, 13_000)
    send(ctx.room, {:round_timeout, 1})
    assert Room.snapshot(ctx.room).phase == :playing
    send(ctx.room, {:round_timeout, 2})
    assert Room.snapshot(ctx.room).phase == :finished
    :ok = Room.action(ctx.room, self(), "start")
    state = Room.snapshot(ctx.room)
    assert state.round == 1
    assert Enum.all?(state.players, &(&1.total_error_ms == 0 and &1.wins == 0))
  end

  test "reconnection preserves the seat and invalidates the previous connection", ctx do
    replacement = spawn(fn -> Process.sleep(:infinity) end)
    on_exit(fn -> Process.exit(replacement, :kill) end)
    assert {:ok, resumed} = Room.join(ctx.room, "Sam", replacement, ctx.guest.token)
    assert resumed == ctx.guest
    assert {:error, _} = Room.action(ctx.room, ctx.guest_socket, "stop")
    assert {:error, _} = Room.join(ctx.room, "Sam", replacement, "wrong-token")
    assert length(Room.snapshot(ctx.room).players) == 2
  end

  test "a disconnected host transfers control to a connected player", ctx do
    :ok = Room.action(ctx.room, self(), "start")
    replacement = spawn(fn -> Process.sleep(:infinity) end)
    on_exit(fn -> Process.exit(replacement, :kill) end)
    {:ok, _} = Room.join(ctx.room, "Arnav", replacement, ctx.host.token)
    Process.exit(replacement, :kill)
    wait_for(fn -> Room.snapshot(ctx.room).host_id == ctx.guest.player_id end)
    assert Room.snapshot(ctx.room).host_id == ctx.guest.player_id
  end

  test "new players cannot enter an ongoing match", ctx do
    :ok = Room.action(ctx.room, self(), "start")
    assert {:error, _} = Room.join(ctx.room, "Late", self())
    assert {:ok, _} = Room.join(ctx.room, "Sam", ctx.guest_socket, ctx.guest.token)
  end

  test "solo rooms start with one player and reject a second seat" do
    room =
      start_supervised!({Room, code: "SOLO#{System.unique_integer([:positive])}", solo: true},
        id: :solo
      )

    assert {:ok, _} = Room.join(room, "Solo", self())
    assert {:error, _} = Room.join(room, "Guest", self())
    assert :ok = Room.action(room, self(), "start")
  end

  test "party rooms require a friend and have an eight-player limit" do
    room = start_supervised!({Room, code: "FULL#{System.unique_integer([:positive])}"}, id: :full)
    {:ok, _} = Room.join(room, "Host", self())
    assert {:error, _} = Room.action(room, self(), "start")

    for i <- 2..8 do
      assert {:ok, _} = Room.join(room, "Guest #{i}", self())
    end

    assert {:error, _} = Room.join(room, "Ninth", self())
  end

  test "expired rooms terminate normally and unregister their code", ctx do
    monitor = Process.monitor(ctx.room)
    :atomics.put(ctx.clock, 1, 16 * 60 * 1_000)
    send(ctx.room, :check_expiry)
    assert_receive {:DOWN, ^monitor, :process, _, :normal}
    assert {:error, _} = Drift.Rooms.find(ctx.host.code)
  end

  test "bad names don't leave orphan rooms" do
    count = DynamicSupervisor.count_children(Drift.RoomSupervisor).active
    assert {:error, _} = Drift.Rooms.create("", self())
    assert DynamicSupervisor.count_children(Drift.RoomSupervisor).active == count
    assert {:error, _} = Drift.Rooms.find("NOTREAL")
  end

  defp wait_for(check, remaining \\ 20)
  defp wait_for(_, 0), do: flunk("condition did not become true")

  defp wait_for(check, remaining) do
    unless check.() do
      Process.sleep(10)
      wait_for(check, remaining - 1)
    end
  end
end
