defmodule DriftWeb.Server do
  @moduledoc "Cowboy HTTP listener, supervised alongside the game processes."

  def child_spec(_) do
    %{id: __MODULE__, start: {__MODULE__, :start_link, []}, type: :supervisor}
  end

  def start_link do
    dist = Path.expand("../../../frontend/dist", __DIR__)

    routes = [
      {:_,
       [
         {"/health", DriftWeb.Health, %{}},
         {"/ws", DriftWeb.Socket, %{}},
         {"/assets/[...]", :cowboy_static, {:dir, Path.join(dist, "assets")}},
         {"/favicon.svg", :cowboy_static, {:file, Path.join(dist, "favicon.svg")}},
         {"/", :cowboy_static, {:file, Path.join(dist, "index.html")}}
       ]}
    ]

    dispatch = :cowboy_router.compile(routes)
    port = Application.fetch_env!(:drift, :port)

    :cowboy.start_clear(:drift_http, [{:port, port}], %{
      env: %{dispatch: dispatch},
      invalid_response_headers: :error_terminate
    })
  end
end
