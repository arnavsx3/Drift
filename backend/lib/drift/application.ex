defmodule Drift.Application do
  @moduledoc "Starts the room registry, dynamic room supervisor, and web server."
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Registry, keys: :unique, name: Drift.RoomRegistry},
      {DynamicSupervisor, strategy: :one_for_one, name: Drift.RoomSupervisor, max_children: 500}
    ]

    children =
      if Application.get_env(:drift, :http_enabled, true),
        do: children ++ [DriftWeb.Server],
        else: children

    Supervisor.start_link(children, strategy: :one_for_one, name: Drift.Supervisor)
  end
end
