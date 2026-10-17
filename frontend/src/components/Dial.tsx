interface Props {
  value: string
  label: string
  active?: boolean
  hidden?: boolean
  compact?: boolean
}

export function Dial({
  value,
  label,
  active = false,
  hidden = false,
  compact = false,
}: Props) {
  return (
    <div
      className={`dial ${active ? 'dial-active' : ''} ${compact ? 'dial-compact' : ''}`}
    >
      <svg viewBox="0 0 320 320" className="dial-face" aria-hidden="true">
        <circle cx="160" cy="160" r="142" className="dial-track" />
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i * Math.PI) / 30 - Math.PI / 2
          const long = i % 5 === 0
          return (
            <line
              key={i}
              x1={160 + Math.cos(angle) * (long ? 123 : 130)}
              y1={160 + Math.sin(angle) * (long ? 123 : 130)}
              x2={160 + Math.cos(angle) * 138}
              y2={160 + Math.sin(angle) * 138}
              className={long ? 'tick tick-major' : 'tick'}
            />
          )
        })}
        <circle cx="160" cy="18" r="5" className="dial-dot" />
      </svg>
      <div className="dial-center">
        <span className="dial-label">{label}</span>
        <span className={`dial-value ${hidden ? 'dial-hidden' : ''}`}>
          {value}
        </span>
        <span className="dial-unit">
          {hidden ? 'trust your instinct' : 'seconds'}
        </span>
      </div>
    </div>
  )
}
