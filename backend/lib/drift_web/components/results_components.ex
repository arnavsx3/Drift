defmodule DriftWeb.ResultsComponents do
  @moduledoc "Round reveal, guess timeline, and final match rankings."
  use Phoenix.Component
  import DriftWeb.UIComponents
  import DriftWeb.Presentation

  attr(:room, :map, required: true)
  attr(:player_id, :string, required: true)
  attr(:host, :boolean, required: true)

  def results(assigns) do
    assigns =
      assigns
      |> assign(:finished, assigns.room.phase == :finished)
      |> assign(:winners, winners(assigns.room))
      |> assign(:rows, rows(assigns.room))

    ~H"""
    <section
      class="px-[34px] py-[29px] text-center max-[900px]:px-[21px] max-[720px]:px-[22px]"
      aria-labelledby="results-title"
    >
      <div class="mx-auto mb-[18px] grid size-14 place-items-center rounded-full bg-[#eeeefb] text-[#838bd1]">
        ✧
      </div>
      <p class="font-mono text-[9px] tracking-[1.6px] text-[#8c8e98]">
        {if @finished, do: "THAT’S A WRAP", else: "ROUND #{@room.round} · THE REVEAL"}
      </p>
      <h2
        id="results-title"
        class="mt-[11px] mb-[9px] font-display text-[35px] leading-[1.2] max-[900px]:text-[30px]"
      >
        {title(@room, @player_id)}
      </h2>
      <p class="text-[10px] leading-[1.8] text-[#9699a6]">
        {if @finished,
          do: "Lowest total drift takes the match. Every millisecond counted.",
          else: "The target was #{seconds(@room.target_ms)} seconds. Here’s where everyone landed."}
      </p>
      <div
        :if={not @finished}
        class="relative mt-[19px] h-27"
        aria-label="Guess positions relative to the target"
      >
        <div class="absolute top-[51px] right-0 left-0 h-px bg-[#dfdfe9]"></div>
        <div class="absolute top-7 left-1/2 h-[46px] w-px bg-[#9099eb]">
          <span class="absolute -top-4 -translate-x-1/2 font-mono text-[7px] tracking-[1px] text-[#949bd1]">
            TARGET
          </span>
        </div>
        <div
          :for={{r, i} <- Enum.with_index(Enum.reject(@room.results, &is_nil(&1.elapsed_ms)))}
          class={[
            "absolute left-(--guess-left) grid size-6 -translate-x-1/2 place-items-center rounded-full border-2 border-white text-[9px]",
            avatar_tone(i),
            if(rem(i, 2) == 0, do: "top-[29px]", else: "top-14")
          ]}
          style={guess_position(r, @room.target_ms)}
          title={"#{r.name}: #{seconds(r.elapsed_ms)}s"}
        >
          {String.upcase(String.first(r.name))}
        </div>
        <div class="flex justify-between pt-21 font-mono text-[8px] text-[#a3a5b2]">
          <span>Too soon</span><span>A little late</span>
        </div>
      </div>
      <div data-testid="result-list" class="my-[22px] border-t border-[#edeef2] text-left">
        <div
          :for={{p, i} <- Enum.with_index(@rows)}
          data-testid="result-row"
          data-you={to_string(p.id == @player_id)}
          class="flex items-center gap-[13px] border-b border-[#edeef2] px-2.5 py-[15px] data-[you=true]:bg-[#f8f8fe]"
        >
          <span class="w-[22px] shrink-0 font-mono text-[10px] text-[#a9acc0]">
            {if p.id in @winners, do: "♛", else: String.pad_leading(to_string(i + 1), 2, "0")}
          </span>
          <div class="min-w-0 flex-1">
            <strong class="flex items-center gap-1.5 text-[12px] font-[550] wrap-anywhere">
              {p.name}<small
                :if={p.id == @player_id}
                class="font-mono text-[8px] font-normal text-[#9b9eaa]"
              >you</small>
            </strong>
            <span class="mt-[5px] block text-[10px] text-[#969aad]">{p.caption}</span>
          </div>
          <span class={[
            "font-mono text-[19px] tracking-[-0.6px]",
            if(p.missed, do: "text-[#adb0bb]", else: "text-[#616783]")
          ]}>
            {p.value}<small :if={not p.missed} class="ml-1 text-[10px] text-[#9a9fb3]">s</small>
          </span>
        </div>
      </div>
      <.primary
        :if={@host}
        phx-click="action"
        phx-value-action={if @finished, do: "start", else: "next"}
      >
        {if @finished, do: "One more match", else: "Next round"}
      </.primary>
      <p :if={not @host} class="mt-[23px] text-[11px] text-[#979ba9]">
        Waiting for the host to {if @finished, do: "start a rematch", else: "start the next round"}…
      </p>
    </section>
    """
  end
end
