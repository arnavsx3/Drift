defmodule DriftWeb.GameLiveTest do
  use ExUnit.Case, async: false
  import Phoenix.ConnTest
  import Phoenix.LiveViewTest
  alias Drift.{Room, Rooms}
  @endpoint DriftWeb.Endpoint

  test "the initial HTTP response renders the home screen without JavaScript" do
    conn = get(build_conn(), "/")
    assert html_response(conn, 200) =~ "sense of time."
    assert html_response(conn, 200) =~ "csrf-token"
    refute html_response(conn, 200) =~ "React"
  end

  test "a solo LiveView creates a seat, plays, reveals, and leaves cleanly" do
    {:ok, view, _} = live(build_conn(), "/")
    view |> form("#entry-form", nickname: "Solo") |> render_submit()
    assert_push_event(view, "save-seat", %{code: code, player_id: id, token: token})
    assert is_binary(token)
    assert has_element?(view, "button", "Start practice")
    {:ok, room} = Rooms.find(code)
    view |> element("button", "Start practice") |> render_click()
    assert Room.snapshot(room).phase == :countdown
    send(room, {:begin_round, 1})
    assert Room.snapshot(room).phase == :playing
    assert render(view) =~ "STOP THE CLOCK"
    view |> element("#stop") |> render_click()
    assert render(view) =~ "Next round"
    assert has_element?(view, "[data-testid=result-row]")
    view |> element("button", "Leave practice") |> render_click()
    assert_push_event(view, "clear-seat", %{})
    assert has_element?(view, "#entry-form")
    assert Enum.find(Room.snapshot(room).players, &(&1.id == id)).connected == false
  end

  test "an invalid room is recoverable and names are validated on the server" do
    {:ok, view, _} = live(build_conn(), "/?room=ZZZZZZ")
    view |> form("#entry-form", nickname: "Lost", "room-code": "ZZZZZZ") |> render_submit()
    assert has_element?(view, "[role=alert]", "Room not found")
    view |> element("button", "Solo") |> render_click()
    render_submit(view, "enter", %{"nickname" => String.duplicate("a", 21)})
    assert has_element?(view, "[role=alert]", "Choose a name")
    view |> form("#entry-form", nickname: "Found") |> render_submit()
    assert has_element?(view, "button", "Start practice")
  end

  test "private guesses, host transfer, and resume tokens work through LiveView" do
    {:ok, host, _} = live(build_conn(), "/")
    host |> element("button", "With friends") |> render_click()
    host |> form("#entry-form", nickname: "Host") |> render_submit()
    assert_push_event(host, "save-seat", %{code: code})
    {:ok, guest, _} = live(build_conn(), "/?room=#{code}")
    guest |> form("#entry-form", nickname: "Guest", "room-code": code) |> render_submit()
    assert_push_event(guest, "save-seat", seat)
    {:ok, room} = Rooms.find(code)
    assert render(host) =~ "Start the match"
    host |> element("button", "Start the match") |> render_click()
    send(room, {:begin_round, 1})
    assert Room.snapshot(room).phase == :playing
    render(host)
    host |> element("#stop") |> render_click()
    assert has_element?(host, "#stop[disabled]", "Locked in")
    refute has_element?(host, "[data-testid=result-list]")
    render(guest)
    guest |> element("#stop") |> render_click()
    assert length(Room.snapshot(room).results) == 2
    assert has_element?(guest, "[data-testid=result-row]")

    host |> element("button", "Leave room") |> render_click()
    assert render(guest) =~ "Next round"

    conn =
      put_connect_params(build_conn(), %{
        "seat" => Map.new(seat, fn {k, v} -> {to_string(k), v} end)
      })

    {:ok, resumed, _} = live(conn, "/")
    assert render(resumed) =~ "Guest"
    assert has_element?(resumed, "button", "Next round")
    assert render(guest) =~ "Your seat was opened in another tab."
    assert length(Room.snapshot(room).players) == 2
  end

  test "an expired or failed room clears the browser seat" do
    {:ok, view, _} = live(build_conn(), "/")
    view |> form("#entry-form", nickname: "Solo") |> render_submit()
    assert_push_event(view, "save-seat", %{code: code})
    {:ok, room} = Rooms.find(code)
    Process.exit(room, :kill)
    assert_push_event(view, "clear-seat", %{})
    assert has_element?(view, "[role=alert]", "That room closed")
  end

  test "a new invite takes priority over a previously saved seat" do
    {:ok, room, seat} = Rooms.create("Previous", self(), solo: true)
    saved = seat |> Map.put(:name, "Previous") |> Map.new(fn {k, v} -> {to_string(k), v} end)

    {:ok, view, _} =
      build_conn() |> put_connect_params(%{"seat" => saved}) |> live("/?room=ZZZZZZ")

    assert_push_event(view, "clear-seat", %{})
    assert has_element?(view, "button", "Join the room")
    assert length(Room.snapshot(room).players) == 1
  end

  test "unrecognised browser events cannot control a match" do
    {:ok, view, _} = live(build_conn(), "/")
    render_click(view, "mode", %{"mode" => "invalid"})
    render_click(view, "action", %{"action" => "start"})
    assert has_element?(view, "[role=alert]", "Join a room first")
    assert has_element?(view, "#entry-form")
  end

  test "malformed query and form values do not crash the LiveView" do
    {:ok, view, _} = live(build_conn(), "/?room[]=invalid")
    assert has_element?(view, "#entry-form")
    render_change(view, "form", %{"nickname" => %{}, "room-code" => []})
    assert has_element?(view, "#entry-form")
    render_submit(view, "enter", %{"nickname" => []})
    assert has_element?(view, "[role=alert]", "Choose a name")
  end

  test "browser event flooding is limited" do
    {:ok, view, _} = live(build_conn(), "/")
    for _ <- 1..41, do: render_click(view, "mode", %{"mode" => "solo"})
    assert has_element?(view, "[role=alert]", "Slow down a little")
    refute has_element?(view, "button", "Start practice")
  end

  test "stale room notifications cannot clear a newly created seat" do
    {:ok, view, _} = live(build_conn(), "/")
    view |> form("#entry-form", nickname: "First") |> render_submit()
    assert_push_event(view, "save-seat", %{code: first_code})
    {:ok, first_room} = Rooms.find(first_code)
    view |> element("button", "Leave practice") |> render_click()
    view |> form("#entry-form", nickname: "Second") |> render_submit()
    send(view.pid, {:room_closed, first_room})
    send(view.pid, {:connection_replaced, first_room})
    assert render(view) =~ "Second"
    assert has_element?(view, "button", "Start practice")
    refute has_element?(view, "[role=alert]")
  end
end
