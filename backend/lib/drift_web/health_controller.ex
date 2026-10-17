defmodule DriftWeb.HealthController do
  @moduledoc false
  use Phoenix.Controller, formats: [:json]

  def show(conn, _params), do: json(conn, %{status: "ok", app: "drift"})
end
