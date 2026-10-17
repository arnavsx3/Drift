defmodule DriftWeb.Layouts do
  @moduledoc "The document shell for Drift's server-rendered interface."
  use Phoenix.Component

  def root(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#f6f5f0" />
        <meta name="csrf-token" content={Plug.CSRFProtection.get_csrf_token()} />
        <meta
          name="description"
          content="Trust your timing. A multiplayer game about your internal clock."
        />
        <link rel="icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link phx-track-static rel="stylesheet" href="/assets/app.css" />
        <script phx-track-static defer type="module" src="/assets/app.js">
        </script>
        <title>Drift — Trust your timing.</title>
      </head>
      <body class="min-w-80 bg-paper font-sans leading-[normal] text-ink antialiased [-webkit-tap-highlight-color:transparent] [font-synthesis:none] [text-rendering:optimizeLegibility]">
        {@inner_content}
      </body>
    </html>
    """
  end
end
