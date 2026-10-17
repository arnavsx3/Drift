defmodule DriftWeb.GameLive do
  @moduledoc "LiveView entry point; the room GenServer remains the game authority."
  use Phoenix.LiveView, layout: false
  import DriftWeb.UIComponents
  import DriftWeb.HomeComponents
  import DriftWeb.MatchComponents
  alias Drift.{Room, Rooms}

  @impl true
  def mount(params, _session, socket) do
    code = params |> Map.get("room", "") |> String.slice(0, 6) |> String.upcase()

    socket =
      assign(socket,
        room: nil,
        room_pid: nil,
        room_ref: nil,
        player_id: nil,
        mode: if(code == "", do: "solo", else: "join"),
        name: "",
        code: code,
        error: nil,
        sound: false,
        instructions: false,
        connected: connected?(socket)
      )

    socket =
      if connected?(socket), do: restore(socket, get_connect_params(socket)["seat"]), else: socket

    {:ok, socket}
  end

  @impl true
  def handle_params(_params, _uri, socket), do: {:noreply, socket}

  @impl true
  def render(assigns) do
    ~H"""
    <.shell error={@error} sound={@sound} instructions={@instructions}>
      <.home :if={@room == nil} mode={@mode} name={@name} code={@code} connected={@connected} />
      <.match :if={@room != nil} room={@room} player_id={@player_id} />
    </.shell>
    """
  end

  @impl true
  def handle_event("form", params, socket) do
    {:noreply,
     assign(socket,
       name: Map.get(params, "nickname", ""),
       code: Map.get(params, "room-code", socket.assigns.code)
     )}
  end

  def handle_event("mode", %{"mode" => mode}, socket) when mode in ["solo", "party", "join"],
    do: {:noreply, assign(socket, mode: mode, error: nil)}

  def handle_event("enter", params, %{assigns: %{room_pid: nil}} = socket) do
    name = Map.get(params, "nickname", "")
    code = Map.get(params, "room-code", "")

    result =
      if socket.assigns.mode == "join" do
        with {:ok, pid} <- Rooms.find(code),
             {:ok, identity} <- Room.join(pid, name, self()),
             do: {:ok, pid, identity}
      else
        Rooms.create(name, self(), solo: socket.assigns.mode == "solo")
      end

    {:noreply, enter_result(socket, result, name)}
  end

  def handle_event("action", %{"action" => action}, socket)
      when action in ["start", "next", "stop"] do
    result =
      if socket.assigns.room_pid,
        do: Room.action(socket.assigns.room_pid, self(), action),
        else: {:error, "Join a room first."}

    socket =
      case result do
        :ok -> assign(socket, :error, nil)
        {:error, message} -> assign(socket, :error, message)
      end

    {:noreply, socket}
  end

  def handle_event("leave", _, socket) do
    if socket.assigns.room_pid, do: Room.leave(socket.assigns.room_pid, self())

    {:noreply,
     socket |> clear_seat() |> assign(error: nil, code: "", mode: "solo") |> push_patch(to: "/")}
  end

  def handle_event("dismiss", _, socket), do: {:noreply, assign(socket, :error, nil)}

  def handle_event("instructions", _, socket),
    do: {:noreply, assign(socket, :instructions, not socket.assigns.instructions)}

  def handle_event("close_instructions", _, socket),
    do: {:noreply, assign(socket, :instructions, false)}

  def handle_event("sound", _, socket),
    do: {:noreply, assign(socket, :sound, not socket.assigns.sound)}

  def handle_event(_, _, socket), do: {:noreply, socket}

  @impl true
  def handle_info({:room_state, room}, socket) do
    # Ignore a snapshot queued before leaving or switching rooms.
    if socket.assigns.room_pid && socket.assigns.code == room.code do
      {:noreply, assign(socket, :room, room)}
    else
      {:noreply, socket}
    end
  end

  def handle_info(:connection_replaced, socket),
    do:
      {:noreply, socket |> clear_seat() |> assign(:error, "Your seat was opened in another tab.")}

  def handle_info(:room_closed, socket),
    do:
      {:noreply, socket |> clear_seat() |> assign(:error, "That room closed. Start a fresh one.")}

  def handle_info({:DOWN, ref, :process, _, _}, %{assigns: %{room_ref: ref}} = socket),
    do: handle_info(:room_closed, socket)

  def handle_info(_, socket), do: {:noreply, socket}

  defp restore(socket, %{"code" => code, "token" => token, "name" => name})
       when is_binary(code) and is_binary(token) and is_binary(name) do
    # An invite to a different room takes priority over the tab's previous seat.
    if socket.assigns.code not in ["", code] do
      push_event(socket, "clear-seat", %{})
    else
      result =
        with {:ok, pid} <- Rooms.find(code),
             {:ok, identity} <- Room.join(pid, name, self(), token),
             do: {:ok, pid, identity}

      socket = enter_result(socket, result, name)
      if socket.assigns.room_pid, do: socket, else: push_event(socket, "clear-seat", %{})
    end
  end

  defp restore(socket, _), do: socket

  defp enter_result(socket, {:ok, pid, identity}, name) do
    case Room.snapshot(pid) do
      room when is_map(room) ->
        socket
        |> assign(
          room: room,
          room_pid: pid,
          room_ref: Process.monitor(pid),
          player_id: identity.player_id,
          code: identity.code,
          name: String.trim(name),
          error: nil
        )
        |> push_event("save-seat", Map.put(identity, :name, String.trim(name)))

      {:error, message} ->
        assign(socket, :error, message)
    end
  end

  defp enter_result(socket, {:error, message}, _), do: assign(socket, :error, message)

  defp clear_seat(socket) do
    if socket.assigns.room_ref, do: Process.demonitor(socket.assigns.room_ref, [:flush])

    socket
    |> assign(room: nil, room_pid: nil, room_ref: nil, player_id: nil)
    |> push_event("clear-seat", %{})
  end
end
