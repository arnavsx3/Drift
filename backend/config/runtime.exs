import Config

port = String.to_integer(System.get_env("PORT", "4000"))

origins =
  System.get_env(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000,http://127.0.0.1:4000"
  )
  |> String.split(",", trim: true)

config :drift, port: port, origins: origins

secret =
  System.get_env("SECRET_KEY_BASE") ||
    if config_env() == :prod do
      raise "Set SECRET_KEY_BASE before running Drift in production (mix phx.gen.secret)."
    else
      :crypto.strong_rand_bytes(64) |> Base.encode64()
    end

config :drift, DriftWeb.Endpoint,
  secret_key_base: secret,
  http: [ip: {127, 0, 0, 1}, port: port],
  check_origin: origins
