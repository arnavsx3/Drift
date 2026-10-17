defmodule Drift.MixProject do
  use Mix.Project

  def project do
    [
      app: :drift,
      version: "0.1.0",
      elixir: "~> 1.18",
      start_permanent: Mix.env() == :prod,
      deps: [{:cowboy, "~> 2.20.0"}]
    ]
  end

  def application do
    [extra_applications: [:logger, :crypto], mod: {Drift.Application, []}]
  end
end
