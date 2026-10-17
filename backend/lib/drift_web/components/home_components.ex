defmodule DriftWeb.HomeComponents do
  @moduledoc "Home screen and entry form, rendered and validated by Elixir."
  use Phoenix.Component
  import DriftWeb.UIComponents

  attr(:mode, :string, required: true)
  attr(:name, :string, required: true)
  attr(:code, :string, required: true)
  attr(:connected, :boolean, required: true)

  def home(assigns) do
    ~H"""
    <main class="grid grid-cols-[1fr_475px] gap-x-[70px] pt-[58px] max-[1150px]:grid-cols-[1fr_420px] max-[1150px]:gap-[38px] max-[900px]:grid-cols-[1fr_365px] max-[900px]:gap-x-[26px] max-[900px]:pt-[39px] max-[720px]:grid-cols-[1fr] max-[720px]:gap-y-[30px] max-[720px]:pt-7 min-[1400px]:gap-x-25 min-[1400px]:pt-[70px]">
      <section class="relative pt-[17px] max-[720px]:pt-0 max-[720px]:text-center [&_h1]:mx-0 [&_h1]:mt-[27px] [&_h1]:mb-6 [&_h1]:font-display [&_h1]:text-[82px] [&_h1]:leading-[0.99] [&_h1]:font-normal [&_h1]:tracking-[-2.3px] max-[1150px]:[&_h1]:text-[72px] max-[900px]:[&_h1]:text-[61px] max-[720px]:[&_h1]:mx-0 max-[720px]:[&_h1]:my-[22px] max-[720px]:[&_h1]:text-[66px] max-[720px]:[&_h1]:leading-[0.98] max-[380px]:[&_h1]:text-[59px] min-[1400px]:[&_h1]:text-[91px] [&_h1_em]:font-normal [&_h1_em]:text-brand">
        <div class="inline-flex items-center gap-[9px] rounded-[20px] border border-[#e0dfd8] bg-[#f0efe9] px-[13px] py-[9px] font-mono text-[10px] leading-[normal] font-normal tracking-[1.3px] max-[720px]:px-2.5 max-[720px]:py-2 max-[720px]:text-[8px]">
          <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          NO CLOCK. JUST INSTINCT.
        </div>
        <h1>
          You have a<br />
          <em>sense of time.</em>
          <br /> Or do you?
        </h1>
        <p class="text-[14px] leading-[1.9] text-[#7b7b85] max-[1150px]:text-[12px] max-[900px]:text-[11px] max-[720px]:m-auto max-[720px]:max-w-[330px] max-[720px]:text-[12px]">
          The clock disappears. You decide when to stop. <br class="max-[900px]:hidden" />
          A tiny challenge for your
          beautifully imperfect brain.
        </p>
        <div class="mt-6 flex flex-wrap gap-[23px] text-[11px] text-[#646570] max-[900px]:gap-3 max-[900px]:text-[9px] max-[720px]:mt-[18px] max-[720px]:justify-center max-[720px]:gap-[19px] max-[720px]:text-[10px] [&_span]:flex [&_span]:items-center [&_span]:gap-[7px] [&_svg]:text-[#777b91]">
          <span>
            <.icon name="Clock3" size={16} /> Five quick rounds
          </span>
          <span>
            <.icon name="Users" size={16} /> Solo or with friends
          </span>
        </div>
        <div class="mx-0 mt-8 mb-6 h-px w-65 bg-line max-[720px]:hidden" />
        <div class="flex items-center gap-3.5 text-[11px] leading-[1.8] text-[#81818a] max-[720px]:hidden [&_strong]:font-medium [&_strong]:text-[#565861]">
          <div class="flex pl-0 [&_span]:-ml-[7px] [&_span]:grid [&_span]:h-8 [&_span]:w-8 [&_span]:place-items-center [&_span]:rounded-full [&_span]:border-[2px] [&_span]:border-[#f6f5f0] [&_span]:bg-[#dedfe9] [&_span]:text-[10px] [&_span]:text-[#5b6085] [&_span:first-child]:ml-0 [&_span:first-child]:bg-[#e8d9c8] [&_span:first-child]:text-[#886b50] [&_span:last-child]:bg-[#e2e6d9] [&_span:last-child]:text-[#768061]">
            <span>A</span>
            <span>J</span>
            <span>?</span>
          </div>
          <p>
            Good with friends. <br />
            <strong>Even better with a little rivalry.</strong>
          </p>
        </div>
        <div class="absolute right-2 bottom-1.5 flex -rotate-[8deg] items-center gap-[7px] font-display text-[17px] leading-[normal] font-normal text-[#9394a2] italic max-[1150px]:-right-[15px] max-[1150px]:text-[15px] max-[900px]:hidden [&_path]:fill-none [&_path]:stroke-[#b2b3bf] [&_path]:stroke-[1.5] [&_path]:[stroke-linecap:round] [&_svg]:h-[30px] [&_svg]:w-[42px] [&_svg]:overflow-visible">
          <svg viewBox="0 0 64 34" aria-hidden="true">
            <path d="M2 12c24 32 38 10 53-4m-12 1 14-3-2 14" />
          </svg>
          <span>let’s see what your gut’s got</span>
        </div>
      </section>

      <section
        class="overflow-hidden rounded-[15px] border border-[#e1e1dc] bg-white shadow-[0_10px_35px_#272a3306] max-[720px]:w-full max-[720px]:max-w-[450px] max-[720px]:justify-self-center"
        aria-labelledby="entry-heading"
      >
        <div class="flex items-center justify-between px-[25px] pt-[22px] pb-0 text-[#8c8e9b] max-[900px]:px-5 max-[900px]:pt-5 max-[900px]:pb-0">
          <span
            class="font-mono text-[9px] leading-[normal] font-normal tracking-[1.6px] text-[#8c8e98] max-[900px]:text-[8px] max-[900px]:tracking-[1.1px]"
            id="entry-heading"
          >
            MEET YOUR INTERNAL CLOCK
          </span>
          <.icon name="Sparkles" size={17} />
        </div>
        <div class="flex flex-col items-center px-0 pt-[3px] pb-6 max-[720px]:pb-[22px]">
          <.dial value="07.00" label="CAN YOU FEEL SEVEN SECONDS?" compact />
          <span class="-mt-[3px] inline-flex items-center gap-[7px] text-[10px] text-[#9395a4]">
            <.icon name="EyeOff" size={13} /> Soon, you won’t see this.
          </span>
        </div>
        <div class="border-t border-[#eeeeea] bg-[#fafaf8] px-[27px] pt-[23px] pb-5 max-[900px]:p-5 max-[720px]:p-[22px]">
          <div
            class="mb-[23px] flex gap-[3px] rounded-[8px] bg-[#ecece8] p-1 [&_button]:flex [&_button]:flex-1 [&_button]:items-center [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-[5px] [&_button]:bg-transparent [&_button]:px-2 [&_button]:py-2.5 [&_button]:text-[10px] [&_button]:whitespace-nowrap [&_button]:text-[#86868e] max-[900px]:[&_button]:gap-1 max-[900px]:[&_button]:px-[5px] max-[900px]:[&_button]:py-2.5 max-[900px]:[&_button]:text-[9px] max-[720px]:[&_button]:gap-1.5 max-[720px]:[&_button]:px-2 max-[720px]:[&_button]:py-[11px] max-[720px]:[&_button]:text-[10px] max-[380px]:[&_button]:gap-1 max-[380px]:[&_button]:text-[9px] [&_button:hover:not([aria-pressed=true])]:text-brand [&_button[aria-pressed=true]]:bg-white [&_button[aria-pressed=true]]:font-semibold [&_button[aria-pressed=true]]:text-[#3c4050] [&_button[aria-pressed=true]]:shadow-[0_1px_3px_#23232312]"
            role="group"
            aria-label="Choose how to play"
          >
            <button aria-pressed={to_string(@mode == "solo")} phx-click="mode" phx-value-mode="solo">
              <.icon name="TimerReset" size={15} /> Solo
            </button>
            <button aria-pressed={to_string(@mode == "party")} phx-click="mode" phx-value-mode="party">
              <.icon name="Users" size={15} /> With friends
            </button>
            <button aria-pressed={to_string(@mode == "join")} phx-click="mode" phx-value-mode="join">
              <.icon name="Radio" size={15} /> Join room
            </button>
          </div>
          <form id="entry-form" phx-submit="enter" phx-change="form">
            <label for="nickname">What should we call you?</label>
            <input
              class="block w-full rounded-[7px] border border-[#dedee0] bg-white px-[15px] py-[13px] text-[12px] text-[#303442] outline-offset-2 placeholder:text-[#abacb3] focus:border-[#8b93ed]"
              id="nickname"
              name="nickname"
              value={@name}
              placeholder="Your nickname"
              maxlength={20}
              required
              autocomplete="nickname"
              disabled={not @connected}
            />
            <div :if={@mode == "join"}>
              <label for="room-code">
                Your six-character room code
              </label>
              <input
                id="room-code"
                name="room-code"
                class="block w-full rounded-[7px] border border-[#dedee0] bg-white px-[15px] py-[13px] font-mono text-[12px] tracking-[3px] text-[#303442] outline-offset-2 placeholder:text-[#abacb3] focus:border-[#8b93ed]"
                value={@code}
                placeholder="ABC234"
                maxlength={6}
                minlength={6}
                pattern="[A-Z2-9]{6}"
                required
                autocomplete="off"
                spellcheck={false}
                disabled={not @connected}
              />
            </div>
            <button
              class="inline-flex min-h-[46px] w-full items-center justify-start gap-[13px] rounded-[7px] bg-brand px-[22px] py-[13px] text-left text-[12px] font-[550] text-white shadow-[0_2px_3px_#303cb515] transition-[background,transform] duration-150 motion-reduce:transition-none [&_svg:last-child]:ml-auto [&:disabled]:opacity-50 [&:hover:not(:disabled)]:-translate-y-px [&:hover:not(:disabled)]:bg-brand-dark"
              disabled={not @connected}
              type="submit"
            >
              {entry_label(@mode)}
              <.icon name="ArrowRight" size={18} />
            </button>
          </form>
          <p class="mt-4 flex items-center justify-center gap-[5px] text-[8.5px] text-[#93949e] max-[720px]:text-[8px] [&_svg]:text-[#8c91aa]">
            <.icon name="Check" size={13} /> No sign-up. No pressure. Okay, a little pressure.
          </p>
        </div>
      </section>

      <section
        class="col-span-full mt-[58px] grid grid-cols-[repeat(3,_1fr)] gap-7 border-t border-line px-0 pt-7 pb-[30px] max-[720px]:mt-1 max-[720px]:grid-cols-[1fr] max-[720px]:gap-6 max-[720px]:px-0 max-[720px]:py-[25px] min-[1400px]:mt-[70px] [&_h2]:mx-0 [&_h2]:mt-px [&_h2]:mb-1.5 [&_h2]:text-[12px] [&_h2]:font-[550] max-[720px]:[&_h2]:text-[12px] [&_p]:text-[10px] [&_p]:leading-[1.6] [&_p]:text-[#8a8b94] max-[720px]:[&_p]:text-[10px] [&>div]:flex [&>div]:items-start [&>div]:gap-[15px] max-[720px]:[&>div]:max-w-75 max-[720px]:[&>div]:justify-start"
        aria-label="How Drift works"
      >
        <div>
          <span class="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border border-[#dedee0] font-mono text-[11px] leading-[normal] font-normal text-[#9598a5]">
            01
          </span>
          <div>
            <h2>Meet your target.</h2>
            <p>A few seconds. Sounds easy enough.</p>
          </div>
        </div>
        <div>
          <span class="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border border-[#dedee0] font-mono text-[11px] leading-[normal] font-normal text-[#9598a5]">
            02
          </span>
          <div>
            <h2>Lose the clock.</h2>
            <p>It disappears. Your instinct takes over.</p>
          </div>
        </div>
        <div>
          <span class="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border border-[#dedee0] font-mono text-[11px] leading-[normal] font-normal text-[#9598a5]">
            03
          </span>
          <div>
            <h2>Find your drift.</h2>
            <p>Hit stop. See just how close you got.</p>
          </div>
        </div>
      </section>
    </main>
    """
  end

  defp entry_label("solo"), do: "Find your rhythm"
  defp entry_label("party"), do: "Create a room"
  defp entry_label("join"), do: "Join the room"
end
