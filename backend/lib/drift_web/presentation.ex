defmodule DriftWeb.Presentation do
  @moduledoc "Pure display functions shared by the lobby, results, and leaderboard."

  def seconds(ms), do: :erlang.float_to_binary(ms / 1_000, decimals: 2)
  def drift_label(0), do: "Right on time"
  def drift_label(ms), do: "#{seconds(ms)}s off"
  def leaders(players), do: Enum.sort_by(players, &{&1.total_error_ms, &1.name, &1.id})

  def winners(%{phase: :finished, players: players}) do
    ranked = leaders(players)
    best = hd(ranked).total_error_ms
    ranked |> Enum.filter(&(&1.total_error_ms == best)) |> Enum.map(& &1.id)
  end

  def winners(%{results: []}), do: []

  def winners(%{results: results}) do
    best = Enum.min_by(results, & &1.error_ms).error_ms

    results
    |> Enum.filter(&(&1.error_ms == best and &1.elapsed_ms != nil))
    |> Enum.map(& &1.player_id)
  end

  def title(%{phase: :finished, solo: true}, _), do: "Your time, revealed."

  def title(%{phase: :finished} = room, id) do
    if id in winners(room), do: "Good instincts. Great finish.", else: "Time got away from you."
  end

  def title(room, id) do
    mine = Enum.find(room.results, &(&1.player_id == id))

    cond do
      mine == nil or mine.elapsed_ms == nil -> "This one slipped away."
      room.solo and mine.error_ms < 500 -> "You found your rhythm."
      room.solo -> "That’s your drift."
      id in winners(room) -> "You found your rhythm."
      true -> "Close. But how close?"
    end
  end

  def rows(%{phase: :finished, players: players}) do
    Enum.map(leaders(players), fn p ->
      %{
        id: p.id,
        name: p.name,
        value: seconds(p.total_error_ms),
        caption: "#{p.wins} round #{if p.wins == 1, do: "win", else: "wins"}",
        missed: false
      }
    end)
  end

  def rows(%{results: results}) do
    Enum.map(results, fn r ->
      missed = r.elapsed_ms == nil

      %{
        id: r.player_id,
        name: r.name,
        value: if(missed, do: "—", else: seconds(r.elapsed_ms)),
        caption: if(missed, do: "Missed · +20s penalty", else: drift_label(r.error_ms)),
        missed: missed
      }
    end)
  end

  def guess_position(result, target_ms) do
    percent = max(6, min(94, 50 + (result.elapsed_ms - target_ms) / target_ms * 42))
    "--guess-left: #{percent}%"
  end

  def avatar_tone(index) do
    Enum.at(
      [
        "bg-[#e2e4f6] text-[#737bc2]",
        "bg-[#efe0d5] text-[#b07e5b]",
        "bg-[#dfe8da] text-[#7a936d]",
        "bg-[#e8dfee] text-[#997aab]"
      ],
      rem(index, 4)
    )
  end

  def player_status(%{connected: false}, _), do: "Reconnecting…"
  def player_status(_, :lobby), do: "Ready for a little drift"

  def player_status(p, :finished),
    do: "#{p.wins} round #{if p.wins == 1, do: "win", else: "wins"}"

  def player_status(%{stopped: true}, _), do: "Guess locked in"
  def player_status(_, :reveal), do: "Missed this round"
  def player_status(_, _), do: "Finding their rhythm"
end
