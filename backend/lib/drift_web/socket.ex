defmodule DriftWeb.Socket do
  @moduledoc "Small, validated WebSocket protocol. Each socket can occupy one seat."
  alias Drift.{Room, Rooms}

  def init(req, _opts) do
    origin = :cowboy_req.header("origin", req)

    if origin == :undefined or origin in Application.fetch_env!(:drift, :origins) do
      {:cowboy_websocket, req, %{room: nil, count: 0, window: now()},
       %{idle_timeout: 60_000, max_frame_size: 4096}}
    else
      req = :cowboy_req.reply(403, %{}, "Origin not allowed", req)
      {:ok, req, %{}}
    end
  end

  def websocket_init(state), do: {:ok, state}

  def websocket_handle({:text, text}, state) do
    state = if now() - state.window > 2_000, do: %{state | count: 0, window: now()}, else: state
    state = %{state | count: state.count + 1}

    if state.count > 40 do
      reply(%{type: "error", message: "Slow down a little. Try again in a moment."}, state)
    else
      case JSON.decode(text) do
        {:ok, message} when is_map(message) -> dispatch(message, state)
        _ -> reply(%{type: "error", message: "Invalid message."}, state)
      end
    end
  end

  def websocket_handle(_, state), do: {:ok, state}

  def websocket_info({:room_state, room}, state), do: reply(%{type: "state", room: room}, state)

  def websocket_info(:connection_replaced, state),
    do: {:reply, {:close, 4001, "Connected in another tab"}, state}

  def websocket_info(:room_closed, state), do: {:reply, {:close, 4002, "Room expired"}, state}

  def websocket_info({:DOWN, ref, :process, _pid, _reason}, %{room_ref: ref} = state),
    do: {:reply, {:close, 4002, "Room closed"}, state}

  def websocket_info(_, state), do: {:ok, state}

  defp dispatch(%{"type" => "ping"}, state), do: reply(%{type: "pong"}, state)

  defp dispatch(%{"type" => "create", "name" => name} = message, %{room: nil} = state) do
    case Rooms.create(name, self(), solo: Map.get(message, "solo", false) == true) do
      {:ok, pid, identity} ->
        reply(
          Map.put(identity, :type, "joined"),
          Map.merge(state, %{room: pid, room_ref: Process.monitor(pid)})
        )

      {:error, message} ->
        error(message, state)
    end
  end

  defp dispatch(
         %{"type" => "join", "name" => name, "code" => code} = message,
         %{room: nil} = state
       ) do
    with {:ok, pid} <- Rooms.find(code),
         {:ok, identity} <- Room.join(pid, name, self(), Map.get(message, "token")) do
      reply(
        Map.put(identity, :type, "joined"),
        Map.merge(state, %{room: pid, room_ref: Process.monitor(pid)})
      )
    else
      {:error, message} -> error(message, state)
    end
  end

  defp dispatch(%{"type" => type}, %{room: pid} = state)
       when type in ["start", "stop", "next"] and not is_nil(pid) do
    case Room.action(pid, self(), type) do
      :ok -> {:ok, state}
      {:error, message} -> error(message, state)
    end
  end

  defp dispatch(_, state), do: error("That action isn't available. Join a room first.", state)
  defp error(message, state), do: reply(%{type: "error", message: message}, state)
  defp reply(message, state), do: {:reply, {:text, JSON.encode!(message)}, state}
  defp now, do: System.monotonic_time(:millisecond)
end
