import Config

config :drift,
  port: String.to_integer(System.get_env("PORT", "4000")),
  origins:
    System.get_env(
      "ALLOWED_ORIGINS",
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000,http://127.0.0.1:4000"
    )
    |> String.split(",", trim: true)
