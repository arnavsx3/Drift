defmodule DriftWeb.Server do
  @moduledoc "Cowboy HTTP listener, supervised alongside the game processes."

  def child_spec(_) do
    %{id: __MODULE__, start: {__MODULE__, :start_link, []}, type: :supervisor}
  end

  def start_link do
    routes = [{:_, [{"/health", DriftWeb.Health, %{}}]}]
    dispatch = :cowboy_router.compile(routes)
    port = Application.fetch_env!(:drift, :port)
    :cowboy.start_clear(:drift_http, [{:port, port}], %{env: %{dispatch: dispatch}})
  end
end
