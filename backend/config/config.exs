import Config

config :drift, http_enabled: config_env() != :test

config :logger, :console, format: "$time $metadata[$level] $message\n"
