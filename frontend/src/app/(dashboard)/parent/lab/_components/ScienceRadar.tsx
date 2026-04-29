"use client";

/** 五维雷达图（展示型，无交互） */
export function ScienceRadar() {
  const cx = 100;
  const cy = 100;
  const r = 72;
  const axes = 5;
  const values = [0.82, 0.9, 0.76, 0.7, 0.88];
  const points = values
    .map((v, i) => {
      const a = (-Math.PI / 2 + (i * 2 * Math.PI) / axes) as number;
      const x = cx + r * v * Math.cos(a);
      const y = cy + r * v * Math.sin(a);
      return `${x},${y}`;
    })
    .join(" ");
  const labels = ["探究习惯", "安全规范", "观察记录", "表达交流", "好奇心"];
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" className="h-44 w-44 text-primary" aria-hidden>
        <polygon
          points={`${cx},${cy - r} ${cx + r * 0.95},${cy - r * 0.3} ${cx + r * 0.6},${cy + r * 0.85} ${cx - r * 0.6},${cy + r * 0.85} ${cx - r * 0.95},${cy - r * 0.3}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth={1}
        />
        <polygon points={points} fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.5} />
      </svg>
      <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {labels.map((lab, i) => (
          <li key={lab} className="flex justify-between gap-2">
            <span>{lab}</span>
            <span className="tabular-nums text-foreground">{Math.round(values[i]! * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
