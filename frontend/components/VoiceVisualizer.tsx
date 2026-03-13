"use client"

interface Props {
  volume: number // 0–1
  active: boolean
}

export function VoiceVisualizer({ volume, active }: Props) {
  const bars = 5
  return (
    <span className="inline-flex items-end gap-[3px] h-4" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const offset = Math.sin((i / bars) * Math.PI) * volume
        const height = active ? 4 + offset * 12 : 4
        return (
          <span
            key={i}
            className="w-[3px] bg-bone rounded-full transition-all duration-75"
            style={{ height: `${height}px` }}
          />
        )
      })}
    </span>
  )
}
