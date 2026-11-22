/**
 * Кольцевая диаграмма. data: [{ label, value, color }]
 */
export function DonutChart({
  data = [],
  size = 176,
  thickness = 20,
  centerLabel,
  centerValue,
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = (size - thickness) / 2
  const circ = 2 * Math.PI * radius
  // Начало каждого сегмента — сумма длин предыдущих.
  const segments = data.map((d, i) => {
    const dash = (d.value / total) * circ
    const offset = data
      .slice(0, i)
      .reduce((s, prev) => s + (prev.value / total) * circ, 0)
    return { color: d.color, dash, offset }
  })

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-ink/6"
          strokeWidth={thickness}
        />
        {segments.map(({ color, dash, offset }, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
      </svg>
      {(centerValue != null || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue != null && (
            <span className="font-display text-xl font-bold text-ink tnum">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="eyebrow text-ink-muted">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
