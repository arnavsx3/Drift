defmodule Drift.MixProject do
  use Mix.Project

  def project do
    [
      app: :drift,
      version: "0.1.0",
      elixir: "~> 1.18",
      start_permanent: Mix.env() == :prod,
      deps: [
        {:phoenix, "~> 1.8.0"},
        {:phoenix_live_view, "~> 1.1.0"},
        {:phoenix_html, "~> 4.2"},
        {:plug_cowboy, "~> 2.8"},
        {:cowboy, "~> 2.20.0"},
        {:jason, "~> 1.4"},
        {:lazy_html, ">= 0.1.0", only: :test}
      ]
    ]
  end

  def application do
    [extra_applications: [:logger, :crypto], mod: {Drift.Application, []}]
  end
end
