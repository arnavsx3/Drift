defmodule DriftWeb.MatchComponents do
  @moduledoc "The lobby, round controls, and connected-player sidebar."
  use Phoenix.Component
  import DriftWeb.UIComponents
  import DriftWeb.ResultsComponents
  import DriftWeb.Presentation

  attr(:room, :map, required: true)
  attr(:player_id, :string, required: true)

  def match(assigns) do
    me = Enum.find(assigns.room.players, &(&1.id == assigns.player_id))

    assigns =
      assigns
      |> assign(:host, assigns.room.host_id == assigns.player_id)
      |> assign(:stopped, me != nil and me.stopped)
      |> assign(:online_count, Enum.count(assigns.room.players, & &1.connected))

    ~H"""
    <main class="pt-[39px] max-[720px]:pt-[30px]">
      <div class="mb-[25px] flex items-center justify-between gap-5 max-[720px]:mb-[22px] max-[720px]:items-start">
        <div>
          <p class="font-mono text-[9px] tracking-[1.6px] text-[#8c8e98] max-[720px]:text-[7px]">
            {if @room.solo,
              do: "A LITTLE TIME TO YOURSELF",
              else: "GOOD COMPANY. QUESTIONABLE TIMING."}
          </p>
          <h1 class="mt-[9px] font-display text-[48px] leading-[1.2] tracking-[-0.8px] max-[720px]:text-[37px]">
            {match_title(@room)}
          </h1>
        </div>
        <button
          phx-click="leave"
          class="inline-flex items-center gap-2 py-2 text-[11px] text-[#555862] max-[720px]:pt-[22px]"
        >
          ↗ Leave {if @room.solo, do: "practice", else: "room"}
        </button>
      </div>
      <div class="mb-[7px] flex items-center justify-between gap-3 border-t border-line py-[15px] text-[10px] text-[#898b96] max-[720px]:text-[8px]">
        <span class="flex items-center gap-[9px] text-[#656975]">
          <span class="size-1.5 rounded-full bg-brand"></span>{if @room.solo,
            do: "Solo practice",
            else: "Private room #{@room.code}"}
        </span>
        <span>
          {if @room.round > 0,
            do: "Round #{@room.round} of #{@room.rounds}",
            else: "#{@room.rounds} rounds · one good instinct"}
        </span>
      </div>
      <div class="grid grid-cols-[minmax(0,_1fr)_300px] items-start gap-6 max-[1150px]:grid-cols-[minmax(0,_1fr)_270px] max-[900px]:grid-cols-[minmax(0,_1fr)_230px] max-[900px]:gap-[15px] max-[720px]:grid-cols-1">
        <div class="overflow-hidden rounded-[13px] border border-[#e0e1e4] bg-white">
          <.results
            :if={@room.phase in [:reveal, :finished]}
            room={@room}
            player_id={@player_id}
            host={@host}
          />
          <section
            :if={@room.phase not in [:reveal, :finished]}
            class="px-[34px] pt-[23px] pb-7 text-center max-[900px]:p-5 max-[720px]:p-[23px]"
            aria-label="Game timer"
          >
            <div class="mb-[9px] flex items-center justify-between gap-3.5">
              <span class="font-mono text-[8px] tracking-[1.4px] text-[#9498a6]">
                {if @room.phase == :lobby,
                  do: "THE CHALLENGE",
                  else: "ROUND #{String.pad_leading(to_string(@room.round), 2, "0")}"}
              </span>
              <span class="rounded-[5px] bg-[#f0f1fc] px-[9px] py-[7px] font-mono text-[9px] text-[#7278a7]">
                {if @room.phase == :lobby,
                  do: "Five targets. One match.",
                  else: "Target #{seconds(@room.target_ms)}s"}
              </span>
            </div>
            <div
              id="round-clock"
              phx-hook="Clock"
              data-clock-key={"#{@room.code}:#{@room.round}"}
              data-phase={@room.phase}
              data-starts-in={@room.starts_in_ms || 0}
              data-stopped={@stopped}
            >
              <div id="clock-face" phx-update="ignore">
                <.dial animated label="YOUR INTERNAL CLOCK AWAITS" value="?.??" />
                <h2
                  data-clock-heading
                  class="mb-2.5 font-display text-[29px] leading-[1.2] tracking-[-0.2px] max-[900px]:text-[25px] max-[720px]:text-[29px]"
                >
                </h2>
              </div>
            </div>
            <div :if={@room.phase == :lobby}>
              <h2 class="mb-2.5 font-display text-[29px] leading-[1.2] max-[900px]:text-[25px]">
                {if @room.solo,
                  do: "It’s you versus your sense of time.",
                  else: "A little rivalry is good for you."}
              </h2>
              <p class="m-auto max-w-85 text-[11px] leading-[1.8] text-[#92949e]">
                {if @room.solo,
                  do:
                    "The timer will disappear after 1.5 seconds. Stop when you think you’ve reached the target.",
                  else:
                    "Share your room link. Once your friends are in, the host can get things ticking."}
              </p>
              <div
                :if={not @room.solo}
                class="mt-[18px] rounded-[7px] border border-dashed border-[#d6d8e5] bg-[#fafafb] px-[13px] py-[11px] text-left"
              >
                <div class="flex items-center justify-between gap-3">
                  <span
                    data-testid="room-code"
                    class="font-mono text-[13px] tracking-[2px] text-[#535b93]"
                  >
                    {@room.code}
                  </span>
                  <button
                    id="copy-invite"
                    phx-hook="CopyInvite"
                    data-code={@room.code}
                    class="text-[10px] text-[#555862]"
                  >
                    Copy invite link
                  </button>
                </div>
                <label id="copy-fallback" hidden class="mt-3 block text-[10px] text-muted">
                  Copy this link<input
                    id="invite-url"
                    readonly
                    class="mt-2 w-full rounded border border-line bg-white p-2"
                  />
                </label>
              </div>
              <.primary
                :if={@host}
                phx-click="action"
                phx-value-action="start"
                disabled={not @room.solo and @online_count < 2}
              >
                {cond do
                  @room.solo -> "Start practice"
                  @online_count < 2 -> "Waiting for a friend"
                  true -> "Start the match"
                end}
              </.primary>
              <p :if={not @host} class="mt-[23px] text-[11px] text-[#979ba9]">
                The host will start when everyone’s ready.
              </p>
            </div>
            <div :if={@room.phase == :countdown}>
              <h2 class="mb-2.5 font-display text-[29px]">
                Aim for {seconds(@room.target_ms)} seconds.
              </h2>
              <p class="text-[11px] text-[#92949e]">
                Get ready. The clock starts after the countdown.
              </p>
              <button
                disabled
                class="mt-[21px] min-h-[49px] w-full rounded-[7px] bg-[#f0f1fc] text-[12px] text-[#8a8fb9]"
              >
                Here we go…
              </button>
            </div>
            <div :if={@room.phase == :playing}>
              <p class="m-auto max-w-85 text-[11px] leading-[1.8] text-[#92949e]">
                {if @stopped,
                  do: "Waiting for the others. All guesses reveal together.",
                  else: "Hit stop when you think #{seconds(@room.target_ms)} seconds have passed."}
              </p>
              <button
                id="stop"
                phx-click="action"
                phx-value-action="stop"
                phx-disable-with="Locking in…"
                disabled={@stopped}
                class={[
                  "mt-[21px] inline-flex min-h-14 w-full items-center justify-center gap-[13px] rounded-[7px] px-[22px] py-[13px] font-mono text-[12px] tracking-[1px] transition [.phx-disconnected_&]:pointer-events-none [.phx-disconnected_&]:opacity-50",
                  if(@stopped,
                    do: "bg-[#e9ece4] text-[#778a61] opacity-100 shadow-none",
                    else: "bg-[#e7946d] text-white shadow-[0_3px_0_#bd7151] hover:bg-[#db865f]"
                  )
                ]}
              >
                {if @stopped, do: "Locked in", else: "STOP THE CLOCK"}
              </button>
              <span class="mt-[15px] block text-[9px] text-[#a2a4ae]">
                {if @stopped, do: "Breathe. The reveal is coming.", else: "One shot. Make it count."}
              </span>
            </div>
          </section>
        </div>
        <aside class="rounded-[12px] border border-[#e2e2dc] bg-[#f1f0ea] px-[19px] py-[22px] max-[900px]:px-3.5 max-[720px]:p-[22px]">
          <div class="flex items-center justify-between">
            <h2 class="text-[13px] font-[550]">
              {if @room.solo, do: "Your session", else: "The room"}
            </h2>
            <span class="rounded bg-[#e7e7e1] px-[7px] py-1 font-mono text-[9px] text-[#93949c]">
              {@online_count}/{if @room.solo, do: 1, else: 8}
            </span>
          </div>
          <p class="mt-2.5 text-[10px] text-[#91939b]">
            {if @room.phase == :lobby,
              do: "No accounts. Just good company.",
              else: "Lowest total drift wins."}
          </p>
          <div class="mt-[18px]">
            <div
              :for={{p, i} <- Enum.with_index(leaders(@room.players))}
              class="flex items-center gap-2.5 border-b border-[#e3e3df] py-3"
            >
              <div
                data-testid="player-avatar"
                class={[
                  "relative grid size-[33px] shrink-0 place-items-center rounded-full text-[12px]",
                  avatar_tone(i)
                ]}
              >
                {String.upcase(String.first(p.name))}
                <span class={[
                  "absolute right-0 bottom-0 size-2 rounded-full border-2 border-[#f1f0ea]",
                  if(p.connected, do: "bg-[#8d9d70]", else: "bg-[#b2b2b2]")
                ]}>
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <strong class="flex items-center gap-[5px] text-[11px] font-[550] wrap-anywhere">
                  {p.name}<small
                    :if={p.id == @player_id}
                    class="font-mono text-[8px] font-normal text-[#9b9eaa]"
                  >you</small>
                </strong>
                <span class="mt-1 block text-[9px] text-[#999aa3]">
                  {player_status(p, @room.phase)}
                </span>
              </div>
              <span class="shrink-0 font-mono text-[10px] text-[#989cb6]">
                {if @room.phase == :lobby,
                  do: if(p.id == @room.host_id, do: "♛", else: ""),
                  else: "#{seconds(p.total_error_ms)}s"}
              </span>
            </div>
          </div>
          <div class="mt-[18px] flex gap-2.5 border-t border-[#e0e0d9] pt-[18px] text-[#9c9fac]">
            <.icon name="Sparkles" size={17} />
            <p class="text-[10px] leading-[1.8]">
              A perfect clock is boring.<br />
              <strong class="font-[450] text-[#747882]">
                A little drift is human.
              </strong>
            </p>
          </div>
        </aside>
      </div>
      <p class="pt-[23px] pb-[30px] text-center text-[9px] leading-[1.7] text-[#999ba5]">
        {if @room.phase == :lobby,
          do: "Tip: play on a stable connection. Your guess is timed when it reaches the server.",
          else: "Miss a round? It ends automatically, with a 20-second drift penalty."}
      </p>
    </main>
    """
  end

  defp match_title(%{phase: :lobby, solo: true}), do: "Find your rhythm."
  defp match_title(%{phase: :lobby}), do: "Gather your people."
  defp match_title(_), do: "Trust your gut."
end
