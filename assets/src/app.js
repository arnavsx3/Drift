import { Socket } from 'phoenix'
import { LiveSocket } from 'phoenix_live_view'
import './tailwind.css'

const STORAGE = 'drift.seat'
const readSeat = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE) || 'null')
  } catch {
    return null
  }
}
let sound = false
let audio
const unlockAudio = () => {
  if (!audio || audio.state === 'closed') audio = new AudioContext()
  void audio.resume()
}
const beep = (frequency) => {
  if (!sound || audio?.state !== 'running') return
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.06, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12)
  oscillator.start()
  oscillator.stop(audio.currentTime + 0.13)
}

const Hooks = {
  Session: {
    mounted() {
      sound = this.el.dataset.sound === 'true'
      this.handleEvent('save-seat', (seat) => {
        try {
          sessionStorage.setItem(STORAGE, JSON.stringify(seat))
        } catch {
          // Storage is optional; the current live connection can still play.
        }
      })
      this.handleEvent('clear-seat', () => {
        try {
          sessionStorage.removeItem(STORAGE)
        } catch {
          // Private browsing policies may disable storage.
        }
      })
      this.onSound = (event) => {
        if (!event.target.closest('#sound')) return
        sound = !sound
        if (sound) unlockAudio()
      }
      this.el.addEventListener('click', this.onSound)
    },
    updated() {
      sound = this.el.dataset.sound === 'true'
    },
    destroyed() {
      this.el.removeEventListener('click', this.onSound)
    },
  },
  Dialog: {
    mounted() {
      this.previousFocus = document.activeElement
      this.el.showModal()
      this.onCancel = (event) => {
        event.preventDefault()
        this.pushEvent('close_instructions', {})
      }
      this.el.addEventListener('cancel', this.onCancel)
    },
    destroyed() {
      this.el.removeEventListener('cancel', this.onCancel)
      this.el.close()
      this.previousFocus?.focus()
    },
  },
  CopyInvite: {
    mounted() {
      this.copy = async () => {
        const url = new URL(`/?room=${this.el.dataset.code}`, location.href)
          .href
        try {
          await navigator.clipboard.writeText(url)
          this.el.textContent = 'Copied!'
          clearTimeout(this.timer)
          this.timer = setTimeout(() => {
            this.el.textContent = 'Copy invite link'
          }, 2000)
        } catch {
          const input = document.getElementById('invite-url')
          input.value = url
          document.getElementById('copy-fallback').hidden = false
          input.focus()
          input.select()
        }
      }
      this.el.addEventListener('click', this.copy)
    },
    destroyed() {
      clearTimeout(this.timer)
      this.el.removeEventListener('click', this.copy)
    },
  },
  Clock: {
    mounted() {
      this.tick = () => {
        const { phase, stopped } = this.el.dataset
        const elapsed = Math.max(0, performance.now() - this.startsAt)
        const countdown = Math.max(
          1,
          Math.ceil((this.startsAt - performance.now()) / 1000),
        )
        const hidden = elapsed >= 1500
        const locked = stopped === 'true'
        const value =
          phase === 'lobby'
            ? '?.??'
            : phase === 'countdown'
              ? String(countdown).padStart(2, '0')
              : locked
                ? '✓'
                : hidden
                  ? '?.??'
                  : (elapsed / 1000).toFixed(2)
        const label =
          phase === 'lobby'
            ? 'YOUR INTERNAL CLOCK AWAITS'
            : phase === 'countdown'
              ? 'TAKE A BREATH'
              : locked
                ? 'GUESS LOCKED IN'
                : hidden
                  ? 'THE CLOCK IS YOURS'
                  : 'FIND THE RHYTHM'
        this.el.querySelector('[data-clock-value]').textContent = value
        this.el.querySelector('[data-clock-label]').textContent = label
        this.el.querySelector('[data-clock-heading]').textContent =
          phase !== 'playing'
            ? ''
            : locked
              ? 'Your instinct is on the record.'
              : hidden
                ? 'Feel it. Don’t overthink it.'
                : 'Keep this rhythm in your head.'
        const key =
          phase === 'countdown'
            ? `${this.key}-${countdown}`
            : phase === 'playing'
              ? `${this.key}-go`
              : ''
        if (key && key !== this.beeped) {
          this.beeped = key
          beep(phase === 'playing' ? 660 : 440)
        }
        if (phase === 'countdown' || phase === 'playing')
          this.frame = requestAnimationFrame(this.tick)
      }
      this.updated()
    },
    updated() {
      if (this.key !== this.el.dataset.clockKey) {
        this.key = this.el.dataset.clockKey
        this.startsAt = performance.now() + Number(this.el.dataset.startsIn)
      }
      cancelAnimationFrame(this.frame)
      this.tick()
    },
    destroyed() {
      cancelAnimationFrame(this.frame)
    },
  },
}

const liveSocket = new LiveSocket('/live', Socket, {
  params: () => ({
    _csrf_token: document.querySelector('meta[name="csrf-token"]').content,
    seat: readSeat(),
  }),
  hooks: Hooks,
})
liveSocket.connect()
