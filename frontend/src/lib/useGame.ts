import { useCallback, useEffect, useRef, useState } from 'react'
import type { Room, Seat } from './types'

const STORAGE = 'drift.seat'

function loadSeat(): Seat | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE) || 'null')
    return value && typeof value.code === 'string' && typeof value.token === 'string'
      && typeof value.player_id === 'string' && typeof value.name === 'string' ? value : null
  } catch { return null }
}

export function useGame() {
  const [room, setRoom] = useState<Room | null>(null)
  const [seat, setSeat] = useState<Seat | null>(loadSeat)
  const [connection, setConnection] = useState<'connecting' | 'connected' | 'offline'>('connecting')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [startAt, setStartAt] = useState(0)
  const socketRef = useRef<WebSocket | null>(null)
  const seatRef = useRef(seat)
  const roomRef = useRef<Room | null>(null)
  const nameRef = useRef(seat?.name || '')
  const restoringRef = useRef(false)

  const clearSeat = useCallback(() => {
    seatRef.current = null
    roomRef.current = null
    setSeat(null)
    setRoom(null)
    try { sessionStorage.removeItem(STORAGE) } catch { /* Memory-only play still works. */ }
  }, [])

  useEffect(() => {
    let alive = true
    let retry: ReturnType<typeof setTimeout>
    let heartbeat: ReturnType<typeof setInterval>
    let attempt = 0

    const connect = () => {
      if (!alive) return
      setConnection('connecting')
      const url = new URL('/ws', window.location.href)
      url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        if (!alive) { ws.close(); return }
        attempt = 0
        setConnection('connected')
        const saved = seatRef.current
        if (saved) {
          restoringRef.current = true
          setBusy(true)
          ws.send(JSON.stringify({ type: 'join', code: saved.code, name: saved.name, token: saved.token }))
        }
        heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
        }, 20_000)
      }

      ws.onmessage = event => {
        if (!alive) return
        let message
        try { message = JSON.parse(event.data) } catch { return }
        if (message.type === 'joined') {
          const next: Seat = { code: message.code, player_id: message.player_id, token: message.token,
            name: nameRef.current || seatRef.current?.name || 'Player' }
          seatRef.current = next
          setSeat(next)
          restoringRef.current = false
          setBusy(false)
          setError('')
          try { sessionStorage.setItem(STORAGE, JSON.stringify(next)) } catch { /* Optional persistence. */ }
        } else if (message.type === 'state') {
          const next = message.room as Room
          const previous = roomRef.current
          if (next.starts_in_ms !== null && (!previous || previous.round !== next.round
            || (next.phase === 'countdown' && previous.phase !== 'countdown'))) {
            setStartAt(performance.now() + next.starts_in_ms)
          }
          roomRef.current = next
          setRoom(next)
          setBusy(false)
        } else if (message.type === 'error') {
          setError(message.message)
          setBusy(false)
          if (restoringRef.current) { restoringRef.current = false; clearSeat() }
        }
      }

      ws.onclose = event => {
        clearInterval(heartbeat)
        if (!alive) return
        setBusy(false)
        setConnection('offline')
        // Re-anchor the clock from the next room snapshot after a reconnect.
        roomRef.current = null
        if (event.code === 4001 || event.code === 4002) {
          clearSeat()
          setError(event.code === 4001 ? 'Your seat was opened in another tab.' : 'That room expired. Start a fresh one.')
        }
        retry = setTimeout(connect, Math.min(500 * 2 ** attempt++, 10_000))
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      alive = false
      clearTimeout(retry)
      clearInterval(heartbeat)
      socketRef.current?.close()
    }
  }, [clearSeat])

  const send = useCallback((message: Record<string, unknown>) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError('Waiting for a connection. Please try again in a moment.')
      return false
    }
    setError('')
    socketRef.current.send(JSON.stringify(message))
    return true
  }, [])

  const enter = useCallback((name: string, mode: 'solo' | 'party' | 'join', code: string) => {
    nameRef.current = name.trim()
    if (!nameRef.current) { setError('Give yourself a name first.'); return }
    const message = mode === 'join'
      ? { type: 'join', name: nameRef.current, code: code.trim().toUpperCase() }
      : { type: 'create', name: nameRef.current, solo: mode === 'solo' }
    if (send(message)) setBusy(true)
  }, [send])

  const leave = useCallback(() => {
    clearSeat()
    setError('')
    setBusy(false)
    socketRef.current?.close()
    const url = new URL(window.location.href)
    url.searchParams.delete('room')
    window.history.replaceState(null, '', url)
  }, [clearSeat])

  return { room, seat, connection, error, busy, startAt, enter, leave, send, dismissError: () => setError('') }
}
