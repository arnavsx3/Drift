import Config

config :drift, http_enabled: config_env() != :test

config :phoenix, :json_library, Jason

config :drift, DriftWeb.Endpoint,
  adapter: Phoenix.Endpoint.Cowboy2Adapter,
  server: false,
  url: [host: "localhost"],
  pubsub_server: Drift.PubSub,
  live_view: [signing_salt: "drift-live-view"],
  render_errors: [formats: [html: DriftWeb.ErrorHTML], layout: false]

config :logger, :console, format: "$time $metadata[$level] $message\n"
