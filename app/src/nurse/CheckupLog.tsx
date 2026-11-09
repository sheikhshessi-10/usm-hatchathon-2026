import { useEffect, useState } from "react";
import type { CallPatient } from "../data/callPatient";
import { Card } from "../ui/parts";

type Row = {
  id: string; momName: string; status: string; startedAt: string; endedAt: string | null; endedReason: string | null;
  data: { reached?: boolean; checkupComplete?: boolean; checklist?: { id: string; status?: string }[] } | null;
};

/** Every AI check-up call for this patient, logged with how many doctor's orders were covered. Refreshes every 10 seconds. */
export function CheckupLog({ patient }: { patient: CallPatient }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let stop = false; let t: number;
    const load = async () => {
      try {
        const r = await fetch("/api/calls");
        if (r.ok) { const j = await r.json(); if (!stop) setRows((j.calls as Row[]).filter((c) => c.momName.startsWith(patient.name))); }
      } catch { /* try again */ }
      if (!stop) t = window.setTimeout(load, 10000);
    };
    load();
    return () => { stop = true; window.clearTimeout(t); };
  }, [patient.name]);

  return (
    <Card className="p-5">
      <h3 className="font-bold">Check-up log for {patient.name}</h3>
      <p className="text-sm text-body">Each AI call is saved with what was checked. Updates every 10 seconds.</p>
      {!rows ? <p className="mt-3 text-sm text-body">Loading...</p> : rows.length === 0 ? <p className="mt-3 text-sm text-body">No calls yet. Place one from the Live call step.</p> : (
        <ul className="mt-3 divide-y divide-line text-sm">
          {rows.slice(0, 8).map((r) => {
            const list = r.data?.checklist ?? [];
            const asked = list.filter((c) => c.status && c.status !== "not_asked").length;
            const concerns = list.filter((c) => c.status === "concern").length;
            const done = r.status === "ended";
            const ok = done && r.data?.reached !== false && (r.data?.checkupComplete ?? (asked > 0 && asked === patient.checks.length));
            const label = !done ? "Call in progress" : r.data?.reached === false || !r.data ? "Not completed" : ok ? "Check-up complete" : "Partial check-up";
            const tone = !done ? "bg-ground text-navy" : ok ? (concerns ? "bg-red-soft text-red" : "bg-green-soft text-green") : "bg-amber-soft text-amber";
            const mins = r.endedAt ? Math.max(1, Math.round((Date.parse(r.endedAt) - Date.parse(r.startedAt)) / 60000)) : null;
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{new Date(r.startedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{mins ? ` · ${mins} min` : ""}</span>
                <span className="text-body">{list.length ? `${asked}/${patient.checks.length} orders checked${concerns ? ` · ${concerns} concern${concerns > 1 ? "s" : ""}` : ""}` : ""}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{label}{ok && concerns ? " · sent to nurse" : ""}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
