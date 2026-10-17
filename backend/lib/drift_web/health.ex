defmodule DriftWeb.Health do
  @moduledoc false

  def init(req, state) do
    req =
      :cowboy_req.reply(
        200,
        %{"content-type" => "application/json"},
        JSON.encode!(%{status: "ok", app: "drift"}),
        req
      )

    {:ok, req, state}
  end
end
