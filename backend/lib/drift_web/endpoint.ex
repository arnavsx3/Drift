defmodule DriftWeb.Endpoint do
  @moduledoc "Phoenix HTTP endpoint and LiveView socket transport."
  use Phoenix.Endpoint, otp_app: :drift

  @session_options [
    store: :cookie,
    key: "_drift_session",
    signing_salt: "drift-session",
    same_site: "Lax"
  ]

  socket("/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options], max_frame_size: 4096],
    longpoll: false
  )

  plug(Plug.Static,
    at: "/",
    from: {:drift, "priv/static"},
    only: ~w(assets favicon.svg)
  )

  plug(Plug.RequestId)
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])
  plug(Plug.Parsers, parsers: [:urlencoded, :json], json_decoder: Jason)
  plug(Plug.MethodOverride)
  plug(Plug.Head)
  plug(Plug.Session, @session_options)
  plug(DriftWeb.Router)
end
