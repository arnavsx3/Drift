defmodule DriftWeb.Router do
  @moduledoc "Browser sessions use CSRF protection and secure response headers."
  use Phoenix.Router
  import Phoenix.LiveView.Router

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, html: {DriftWeb.Layouts, :root})
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
  end

  get("/health", DriftWeb.HealthController, :show)

  scope "/", DriftWeb do
    pipe_through(:browser)
    live("/", GameLive)
  end
end
