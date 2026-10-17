defmodule DriftWeb.UIComponents do
  @moduledoc "Shared LiveView controls, the clock face, and the document navigation."
  use Phoenix.Component

  attr(:error, :string, default: nil)
  attr(:sound, :boolean, default: false)
  attr(:instructions, :boolean, default: false)
  slot(:inner_block, required: true)

  def shell(assigns) do
    ~H"""
    <div
      id="drift"
      phx-hook="Session"
      data-sound={to_string(@sound)}
      class="m-auto max-w-360 px-16 max-[1150px]:px-9 max-[720px]:px-[23px] max-[380px]:px-4 min-[1400px]:px-[90px] motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none [&_*:focus-visible]:outline-3 [&_*:focus-visible]:outline-offset-4 [&_*:focus-visible]:outline-[#8f9bff] [&_button]:cursor-pointer [&_button]:touch-manipulation [&_button:disabled]:cursor-default [&_input]:touch-manipulation [&_form_label]:mb-[9px] [&_form_label]:block [&_form_label]:text-[11px] [&_form_label]:font-[550] [&_form_label]:text-[#5c5e69] [&_form_input]:mb-4"
    >
      <header class="flex h-25 items-center gap-6 border-b border-line max-[720px]:h-20 max-[720px]:gap-3">
        <a
          href="/"
          phx-click="leave"
          class="inline-flex items-center gap-[9px] text-[35px] font-bold tracking-[-2px] max-[720px]:text-[31px]"
          aria-label="Drift home"
        >
          <span class="grid size-[35px] place-items-center rounded-full border border-[#b7b9c4] text-brand">
            <.icon name="TimerReset" size={23} />
          </span>
          <span>drift<span class="text-brand">.</span></span>
        </a>
        <span class="ml-[5px] text-[12px] text-muted max-[720px]:hidden">
          A little game of timing.
        </span>
        <nav
          aria-label="Main navigation"
          class="ml-auto flex items-center gap-[23px] max-[720px]:gap-[15px]"
        >
          <button
            phx-click="instructions"
            class="inline-flex items-center gap-2 py-2 text-[12px] text-[#555862] max-[720px]:text-[10px]"
          >
            <.icon name="CircleHelp" size={16} /> How to play
          </button>
          <span class="h-[17px] w-px bg-line"></span>
          <button
            id="sound"
            phx-click="sound"
            aria-label={if @sound, do: "Turn sound off", else: "Turn sound on"}
            aria-pressed={to_string(@sound)}
            class="inline-flex items-center gap-2 py-2 text-[12px] text-[#555862]"
          >
            <.icon name={if @sound, do: "Volume2", else: "VolumeX"} size={18} />
            <span class="max-[720px]:hidden">Sound {if @sound, do: "on", else: "off"}</span>
          </button>
        </nav>
      </header>
      <div
        :if={@error}
        role="alert"
        class="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#edd3c2] bg-[#f9e9df] px-[17px] py-3 text-[12px] text-[#954d29]"
      >
        <span>{@error}</span><button phx-click="dismiss" aria-label="Dismiss message"><.icon
          name="X"
          size={17}
        /></button>
      </div>
      <div
        id="connection-status"
        role="status"
        class="mt-4 hidden rounded-lg bg-[#eeeefb] px-[17px] py-3 text-[12px] text-[#626992] [.phx-disconnected_&]:block"
      >
        Connection lost. Reconnecting…
      </div>
      {render_slot(@inner_block)}
      <footer class="flex justify-between gap-5 border-t border-line py-[22px] text-[9px] leading-[1.6] text-[#95959d] max-[720px]:flex-col max-[720px]:gap-2.5 max-[720px]:text-[8px]">
        <span>A perfect clock is boring. A little drift is human.</span>
        <a href="https://github.com/arnavsx3/Drift" target="_blank" rel="noreferrer">
          Made with Elixir/OTP & Phoenix LiveView ↗
        </a>
      </footer>
      <.instructions :if={@instructions} />
    </div>
    """
  end

  def instructions(assigns) do
    ~H"""
    <dialog
      id="instructions"
      phx-hook="Dialog"
      aria-labelledby="instructions-title"
      class="fixed m-auto max-h-[90dvh] w-[calc(100%_-_40px)] max-w-120 overflow-auto rounded-[16px] border-0 bg-white p-9 text-ink shadow-[0_20px_100px_#1d214330] max-[720px]:px-[25px] [&::backdrop]:bg-[#20253860] [&::backdrop]:backdrop-blur-[4px]"
    >
      <button
        phx-click="instructions"
        aria-label="Close instructions"
        autofocus
        class="absolute top-3.5 right-3.5 p-[7px] text-muted"
      >
        <.icon name="X" size={20} />
      </button>
      <p class="font-mono text-[9px] tracking-[1.6px] text-muted">ONE BUTTON. ONE INSTINCT.</p>
      <h2 id="instructions-title" class="mt-[15px] mb-[22px] font-display text-[38px] leading-[1.1]">
        A little lesson in letting go.
      </h2>
      <ol class="my-3 list-decimal pl-5 text-[12px] leading-[1.8] text-[#828697] [&_li]:mb-3.5 [&_strong]:font-[550] [&_strong]:text-[#52596e]">
        <li><strong>Know your target.</strong> Stop at 5, 6, 7, 8, or 10 seconds.</li>
        <li>
          <strong>Watch, then feel.</strong>
          After a three-second countdown, the clock runs visibly for 1.5 seconds, then hides.
        </li>
        <li>
          <strong>Hit STOP.</strong>
          One guess per round. Everyone’s guesses stay hidden until the reveal.
        </li>
        <li>
          <strong>Keep your drift low.</strong>
          Lowest total absolute error over five rounds wins. Ties share the win.
        </li>
      </ol>
      <p class="my-[22px] text-[10px] leading-[1.8] text-muted">
        A missed round adds 20 seconds to your total drift. Scores use server receipt time. Rooms expire after 15 minutes without game activity.
      </p>
      <.primary phx-click="instructions">I’ve got a good feeling</.primary>
    </dialog>
    """
  end

  attr(:disabled, :boolean, default: false)
  attr(:rest, :global, include: ~w(type))
  slot(:inner_block, required: true)

  def primary(assigns) do
    ~H"""
    <button
      disabled={@disabled}
      class="inline-flex min-h-[46px] w-full items-center justify-between gap-[13px] rounded-[7px] bg-brand px-[22px] py-[13px] text-left text-[12px] font-[550] text-white shadow-[0_2px_3px_#303cb515] transition duration-150 disabled:opacity-50 hover:enabled:-translate-y-px hover:enabled:bg-brand-dark [.phx-disconnected_&]:pointer-events-none [.phx-disconnected_&]:opacity-50"
      {@rest}
    >
      {render_slot(@inner_block)}<.icon name="ArrowRight" size={18} />
    </button>
    """
  end

  attr(:label, :string, required: true)
  attr(:value, :string, required: true)
  attr(:compact, :boolean, default: false)
  attr(:animated, :boolean, default: false)

  def dial(assigns) do
    ~H"""
    <div class={[
      "relative mx-auto",
      if(@compact,
        do: "size-[245px]",
        else:
          "mt-1 mb-2.5 size-[285px] max-[900px]:size-[250px] max-[720px]:size-[280px] max-[380px]:size-60"
      )
    ]}>
      <svg viewBox="0 0 320 320" class="size-full overflow-visible" aria-hidden="true">
        <circle cx="160" cy="160" r="142" class="fill-none stroke-[#eeeef1] stroke-1" />
        <line
          :for={i <- 0..59}
          x1={tick(i, :x, if(rem(i, 5) == 0, do: 123, else: 130))}
          y1={tick(i, :y, if(rem(i, 5) == 0, do: 123, else: 130))}
          x2={tick(i, :x, 138)}
          y2={tick(i, :y, 138)}
          class={
            if rem(i, 5) == 0, do: "stroke-[#a5aac2] stroke-[1.7]", else: "stroke-[#d5d7e0] stroke-1"
          }
        />
        <circle cx="160" cy="18" r="5" class="fill-brand" />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span
          data-clock-label={@animated}
          class="mb-[15px] text-center font-mono text-[8px] tracking-[1.3px] text-[#999ca9]"
        >
          {@label}
        </span>
        <span
          data-clock-value={@animated}
          class={[
            "font-mono leading-none tracking-[-4px] text-[#303649] tabular-nums",
            if(@compact, do: "text-[50px]", else: "text-[59px] max-[380px]:text-[50px]")
          ]}
        >
          {@value}
        </span>
        <span class="mt-[15px] font-mono text-[10px] text-[#a4a6b3]">seconds</span>
      </div>
    </div>
    """
  end

  attr(:name, :string, required: true)
  attr(:size, :integer, default: 18)

  def icon(assigns) do
    assigns = assign(assigns, :paths, paths(assigns.name))

    ~H"""
    <svg
      width={@size}
      height={@size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="shrink-0"
      aria-hidden="true"
    >
      <path :for={path <- @paths} d={path} />
    </svg>
    """
  end

  defp paths("ArrowRight"), do: ["M5 12h14m-6-6 6 6-6 6"]
  defp paths("X"), do: ["m6 6 12 12M6 18 18 6"]
  defp paths("Check"), do: ["m5 12 4 4 10-10"]

  defp paths("Users"),
    do: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87",
      "M13 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0"
    ]

  defp paths("Sparkles"), do: ["m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z"]

  defp paths("EyeOff"),
    do: [
      "m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9 5c5-2 10 3 13 7-1 2-2 3-4 4M6 6c-2 1-3 3-4 6 3 5 7 8 13 6"
    ]

  defp paths("CircleHelp"),
    do: ["M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0", "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m0 4h.01"]

  defp paths("Volume2"), do: ["m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"]
  defp paths("VolumeX"), do: ["m11 5-6 4H2v6h3l6 4zM17 9l5 6m-5 0 5-6"]
  defp paths(_), do: ["M21 12a9 9 0 1 0-9 9M12 7v5l3 2M18 2v5h5"]

  defp tick(i, axis, radius) do
    angle = i * :math.pi() / 30 - :math.pi() / 2
    160 + radius * if(axis == :x, do: :math.cos(angle), else: :math.sin(angle))
  end
end
