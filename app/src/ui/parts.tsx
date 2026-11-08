import type { ReactNode } from "react";
import type { Level } from "../lib/rules";
import type { Call } from "../data/moms";

export const levelStyle: Record<Level, { chip: string; stripe: string; dot: string; text: string }> = {
  red911: { chip: "bg-red text-white", stripe: "bg-red", dot: "bg-red", text: "text-red" },
  red: { chip: "bg-red-soft text-red ring-1 ring-red/30", stripe: "bg-red", dot: "bg-red", text: "text-red" },
  yellow: { chip: "bg-amber-soft text-amber ring-1 ring-amber/30", stripe: "bg-[#e0a800]", dot: "bg-[#e0a800]", text: "text-amber" },
  green: { chip: "bg-green-soft text-green ring-1 ring-green/25", stripe: "bg-green", dot: "bg-green", text: "text-green" },
};

export function Pill({ level, children }: { level: Level; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${levelStyle[level].chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${level === "red911" ? "bg-white" : levelStyle[level].dot}`} />
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-white shadow-[0_1px_2px_rgba(20,22,26,0.04)] ${className}`}>{children}</div>;
}

/** Tiny systolic line for list rows. */
export function Sparkline({ calls, level }: { calls: Call[]; level: Level }) {
  const pts = calls.filter((c) => c.answered && c.sys).map((c) => c.sys!);
  if (pts.length < 2) return <div className="h-8 w-24" />;
  const lo = 115, hi = 175, w = 96, h = 32;
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * w, h - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * h]);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const stroke = level === "green" ? "#1f7a3a" : level === "yellow" ? "#c48a00" : "#b3261e";
  const [lx, ly] = xy[xy.length - 1];
  return (
    <svg width={w + 6} height={h + 6} viewBox={`-3 -3 ${w + 6} ${h + 6}`} aria-hidden="true">
      <line x1="0" x2={w} y1={h - ((160 - lo) / (hi - lo)) * h} y2={h - ((160 - lo) / (hi - lo)) * h} stroke="#e3e1e1" strokeDasharray="3 3" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3" fill={stroke} />
    </svg>
  );
}

/** Blood pressure chart with the home target and severe lines. */
export function BPChart({ calls, height = 220 }: { calls: Call[]; height?: number }) {
  const W = 640, H = height, L = 40, R = 44, T = 22, B = 28;
  const lo = 60, hi = 180;
  const days = calls.map((c) => c.day);
  const minD = Math.min(...days), maxD = Math.max(...days, minD + 1);
  const x = (d: number) => L + ((d - minD) / (maxD - minD)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ans = calls.filter((c) => c.answered && c.sys);
  const line = (k: "sys" | "dia") => ans.map((c, i) => `${i ? "L" : "M"}${x(c.day)},${y(c[k]!)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Blood pressure by day">
      {[80, 100, 120, 140, 160].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#efeded" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#55585f">{v}</text>
        </g>
      ))}
      <rect x={L} y={y(180)} width={W - L - R} height={y(160) - y(180)} fill="#b3261e" opacity="0.06" />
      <line x1={L} x2={W - R} y1={y(160)} y2={y(160)} stroke="#b3261e" strokeDasharray="5 4" />
      <line x1={L} x2={W - R} y1={y(150)} y2={y(150)} stroke="#c48a00" strokeDasharray="5 4" />
      <path d={line("sys")} fill="none" stroke="#0a2a4d" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={line("dia")} fill="none" stroke="#0a2a4d" strokeWidth="2" strokeDasharray="1 0" opacity="0.4" strokeLinejoin="round" />
      {calls.map((c) =>
        c.answered && c.sys ? (
          <g key={c.day}>
            <circle cx={x(c.day)} cy={y(c.sys)} r="4.5" fill={c.sys >= 160 ? "#b3261e" : c.sys >= 150 ? "#c48a00" : "#0a2a4d"} stroke="#fff" strokeWidth="2" />
            <circle cx={x(c.day)} cy={y(c.dia!)} r="3.5" fill="#fff" stroke="#0a2a4d" strokeOpacity="0.5" strokeWidth="1.5" />
            <text x={x(c.day)} y={y(c.sys) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#14161a">{c.sys}/{c.dia}</text>
          </g>
        ) : (
          <text key={c.day} x={x(c.day)} y={y(120)} textAnchor="middle" fontSize="11" fill="#b3261e" fontWeight="600">missed</text>
        ),
      )}
      {calls.map((c) => (
        <text key={"d" + c.day} x={x(c.day)} y={H - 8} textAnchor="middle" fontSize="11" fill="#55585f">Day {c.day}</text>
      ))}
    </svg>
  );
}
