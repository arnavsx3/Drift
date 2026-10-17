defmodule Drift.Rooms do
  @moduledoc "Creates bounded, temporary game rooms and finds them by join code."
  alias Drift.Room

  def create(name, socket, opts \\ []) do
    code = for _ <- 1..6, into: "", do: <<Enum.random(~c"ABCDEFGHJKLMNPQRSTUVWXYZ23456789")>>

    case DynamicSupervisor.start_child(
           Drift.RoomSupervisor,
           {Room, Keyword.put(opts, :code, code)}
         ) do
      {:ok, pid} ->
        case Room.join(pid, name, socket) do
          {:ok, identity} ->
            {:ok, pid, identity}

          error ->
            DynamicSupervisor.terminate_child(Drift.RoomSupervisor, pid)
            error
        end

      {:error, {:already_started, _}} ->
        create(name, socket, opts)

      {:error, :max_children} ->
        {:error, "The server is full. Please try again shortly."}

      _ ->
        {:error, "Couldn't create a room. Try again."}
    end
  end

  def find(code) when is_binary(code) do
    case Registry.lookup(Drift.RoomRegistry, String.upcase(String.trim(code))) do
      [{pid, _}] -> {:ok, pid}
      [] -> {:error, "Room not found. Check the code or create a new room."}
    end
  end

  def find(_), do: {:error, "Enter a valid room code."}
end
