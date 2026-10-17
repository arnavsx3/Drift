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
      className={`relative mx-auto ${compact ? 'size-[245px]' : 'mt-1 mb-2.5 size-[285px] max-[900px]:size-[250px] max-[720px]:size-[280px] max-[380px]:size-60'}`}
    >
      <svg
        viewBox="0 0 320 320"
        className="size-full overflow-visible"
        aria-hidden="true"
      >
        <circle
          cx="160"
          cy="160"
          r="142"
          className={`fill-none stroke-1 ${active ? 'stroke-[#d8dcff]' : 'stroke-[#eeeef1]'}`}
        />
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
              className={
                long
                  ? 'stroke-[#a5aac2] stroke-[1.7]'
                  : 'stroke-[#d5d7e0] stroke-1'
              }
            />
          )
        })}
        <circle
          cx="160"
          cy="18"
          r="5"
          className={`fill-brand ${active ? '[animation-duration:1.4s] motion-safe:animate-pulse' : ''}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-center font-mono leading-[normal] font-normal text-[#999ca9] ${compact ? 'mb-3 text-[6px] tracking-[1px]' : 'mb-[15px] text-[8px] tracking-[1.3px]'}`}
        >
          {label}
        </span>
        <span
          data-obscured={hidden}
          className={`font-mono leading-none font-normal tabular-nums data-[obscured=true]:tracking-normal ${compact ? 'text-[50px] tracking-[-3px]' : 'text-[59px] tracking-[-4px] max-[380px]:text-[50px]'} ${hidden ? 'text-brand' : 'text-[#303649]'}`}
        >
          {value}
        </span>
        <span className="mt-[15px] font-mono text-[10px] leading-[normal] font-normal text-[#a4a6b3]">
          {hidden ? 'trust your instinct' : 'seconds'}
        </span>
      </div>
    </div>
  )
}
