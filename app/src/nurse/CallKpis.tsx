import { useEffect, useState } from "react";
import { evaluate } from "../lib/rules";
import { LEVEL_TEXT } from "../data/moms";
import { Card, Pill } from "../ui/parts";
import { NO_ANSWER, readCallAnswers, toCheckIn } from "./LiveCall";

type Row = { id: string; momName: string; status: string; endedReason: string | null; startedAt: string; endedAt: string | null; cost: number | null; data: Parameters<typeof toCheckIn>[0] | null; momText: string };

// Minutes a nurse spends on one manual follow-up call. A planning assumption, shown on screen as one.
const MANUAL_MIN = 10;

export function CallKpis() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [off, setOff] = useState(false);

  useEffect(() => {
    let stop = false; let t: number;
    const load = async () => {
      try {
        const r = await fetch("/api/calls");
        if (!r.ok) throw new Error("Call results unavailable");
        const j = await r.json();
        if (!Array.isArray(j.calls)) throw new Error("Invalid call results");
        if (!stop) { setRows(j.calls); setOff(false); }
      } catch { if (!stop) setOff(true); }
      if (!stop) t = window.setTimeout(load, 15000);
    };
    load();
    return () => { stop = true; window.clearTimeout(t); };
  }, []);

  if (off) return <p role="status" className="text-sm text-body">Live demo call results are unavailable. This panel will check again.</p>;
  if (!rows) return <p role="status" className="text-sm text-body">Loading demo call results…</p>;
  if (!rows.length) return <p className="text-sm text-body">No live demo calls have been recorded yet.</p>;

  const done = rows.filter((r) => r.status === "ended");
  const reached = done.filter(row => !NO_ANSWER.test(row.endedReason ?? "") && row.data?.reached !== false &&
    (row.data?.reached === true || Boolean(row.momText?.trim())));
  const levels = reached.flatMap(row => {
    const answers = readCallAnswers(row.data, row.momText ?? "");
    return answers ? [{ row, level: evaluate(toCheckIn(answers, 5)).level }] : [];
  });
  const urgent = levels.filter((l) => l.level === "red" || l.level === "red911").length;
  const yellow = levels.filter((l) => l.level === "yellow").length;
  const secs = done.filter((r) => r.endedAt).map((r) => (new Date(r.endedAt!).getTime() - new Date(r.startedAt).getTime()) / 1000);
  const avgMin = secs.length ? secs.reduce((a, b) => a + b, 0) / secs.length / 60 : 0;
  const costs = done.map((r) => r.cost).filter((c): c is number => c !== null);
  const avgCost = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null;
  const saved = reached.length * MANUAL_MIN;

  const tiles: [string, string, string][] = [
    ["Live AI calls", String(rows.length), `${reached.length} reached the mom`],
    ["Reach rate", done.length ? `${Math.round((reached.length / done.length) * 100)}%` : "–", "reached among ended calls"],
    ["Flagged urgent", String(urgent), `urgent · ${yellow} more for review today`],
    ["Avg call length", secs.length ? `${avgMin.toFixed(1)} min` : "–", "duration of ended calls"],
    ["Estimated staff time", `${saved} min`, `assumes ${MANUAL_MIN} min per manual call`],
    ["Cost per call", avgCost !== null ? `$${avgCost.toFixed(2)}` : "–", "reported phone and AI cost"],
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-xl font-extrabold text-navy">Live call results</h2>
        <span className="text-sm text-body">Demo-phone calls · Refreshes every 15 seconds</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map(([label, value, sub]) => (
          <Card key={label} className="p-4">
            <div className="text-xs font-semibold text-body">{label}</div>
            <div className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{value}</div>
            <div className="mt-1 text-[11px] text-body">{sub}</div>
          </Card>
        ))}
      </div>
      {levels.length > 0 && (
        <Card className="divide-y divide-line">
          {levels.slice(0, 5).map(({ row, level }) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-semibold">{row.momName}</span>
              <span className="text-body">{new Date(row.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
              {row.data?.sys && row.data?.dia ? <span className="font-bold tabular-nums">{row.data.sys}/{row.data.dia}</span> : <span className="text-body">no BP</span>}
              <Pill level={level}>{LEVEL_TEXT[level]}</Pill>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}
