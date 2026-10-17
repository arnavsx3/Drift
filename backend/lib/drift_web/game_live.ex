defmodule DriftWeb.GameLive do
  @moduledoc "LiveView entry point; the room GenServer remains the game authority."
  use Phoenix.LiveView, layout: false

  @impl true
  def render(assigns) do
    ~H"""
    <main>
      <h1>Drift</h1>
    </main>
    """
  end
end
