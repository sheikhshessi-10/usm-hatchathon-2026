import { useEffect, useMemo, useRef, useState } from "react";
import { LiveCall } from "./LiveCall";
import { fromMom } from "../data/callPatient";
import { CallKpis } from "./CallKpis";
import {
  ArrowRight, Baby, CheckCircle2, ChevronRight, PhoneMissed, Search, Sparkles, X,
} from "lucide-react";
import { DEMO_AS_OF, status, LEVEL_TEXT, type Mom } from "../data/moms";
import { LABEL, RANK, type Level } from "../lib/rules";
import { useDialog } from "../ui/useDialog";
import { PatientCheckIn } from "../ui/PatientCheckIn";
import { CareAction } from "../ui/CareAction";
import { BPChart, Card, Pill, Sparkline, levelStyle } from "../ui/parts";

import { continuityMetrics, useCare } from "../data/workflow";
import { rate } from "../data/metrics";

type Filter = "all" | "act" | "review" | "ok" | "check-in" | "handoff";

export default function NurseDashboard() {
  const { moms, state, handle } = useCare();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(()=>{const id=typeof location!=="undefined"?location.hash.split("/")[1]:undefined;return moms.some(m=>m.id===id)?id!:null;});
  useEffect(()=>{const onHash=()=>{const id=location.hash.startsWith("#nurse/")?location.hash.split("/")[1]:undefined;setOpenId(moms.some(m=>m.id===id)?id!:null);};addEventListener("hashchange",onHash);return()=>removeEventListener("hashchange",onHash);},[]);

  const rows = useMemo(() => {
    return moms
      .map((m) => { const s = status(m); return { m, s, lvl: s.level }; })
      .sort((a, b) => RANK[b.lvl] - RANK[a.lvl] || a.m.name.localeCompare(b.m.name));
  }, [moms]);

  const counts = {
    act: rows.filter((r) => r.lvl === "red" || r.lvl === "red911").length,
    review: rows.filter((r) => r.lvl === "yellow").length,
    ok: rows.filter((r) => r.lvl === "green").length,
    missed: rows.filter((r) => r.s.today && !r.s.today.answered).length,
  };

  const waiting = new Set(state.tasks.filter(task =>
    task.source === "doctor" && task.owner === "Nurse" && !task.acceptedAt && !task.completed
  ).map(task => task.patientId));

  const shown = rows.filter(({ m, lvl }) => {
    if (!`${m.name} ${m.county} ${m.useCase ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (filter === "act") return lvl === "red" || lvl === "red911";
    if (filter === "review") return lvl === "yellow";
    if (filter === "ok") return lvl === "green";
    if (filter === "check-in") return Boolean(state.checkIns[m.id]);
    if (filter === "handoff") return waiting.has(m.id);
    return true;
  });

  const open = moms.find((m) => m.id === openId) ?? null;
  const markHandled = (id: string, note: string) =>
    handle(id, note);

  const metrics = continuityMetrics(moms, state);
  const today = new Date(DEMO_AS_OF + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex min-h-screen bg-ground text-ink">
      <main className="flex-1 min-w-0 px-4 sm:px-8 pt-6 pb-12">
        <div className="mx-auto max-w-6xl flex flex-col gap-6">
          {/* Hero, LGS style navy band */}
          <section className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-navy via-navy to-navy-900 px-5 py-5 text-white sm:px-10 sm:py-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">{today} · Synthetic demonstration cohort</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Nurse worklist</h1>
                <p className="text-white/80 text-[17px]">
                  <b className="text-white">{counts.act} {counts.act === 1 ? "mom needs" : "moms need"} you now.</b> {rows.length} moms in their first 10 days at home.
                </p>
                <button
                  onClick={() => { setFilter("act"); setQ(""); const first = rows.find((r) => r.lvl === "red" || r.lvl === "red911"); if (first) setOpenId(first.m.id); }}
                  disabled={counts.act === 0}
                  className="mt-2 inline-flex w-fit items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:brightness-95 active:brightness-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  Review urgent alerts <ArrowRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <Stat label="Act now" value={counts.act} tone="red" />
                <Stat label="Review today" value={counts.review} tone="yellow" />
                <Stat label="On track" value={counts.ok} tone="green" />
                <Stat label="Missed calls" value={counts.missed} tone="plain" />
              </div>
            </div>
          </section>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative w-full sm:w-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
              <input
                id="search" aria-label="Search nurse patients" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, county, or pathway"
                className="h-11 w-full sm:w-64 rounded-full border border-line bg-white pl-9 pr-4 text-sm outline-none focus:border-navy/40"
              />
            </label>
            {([
              ["all", "All moms", rows.length],
              ["act", "Act now", counts.act],
              ["review", "Review today", counts.review],
              ["ok", "On track", counts.ok],
              ["check-in", "Portal check-ins", Object.keys(state.checkIns).length],
              ["handoff", "Handoffs to accept", waiting.size],
            ] as const).map(([k, label, n]) => (
              <button
                key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  filter === k ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:bg-hover"
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 text-[11px] ${filter === k ? "bg-white/15" : "bg-hover text-body"}`}>{n}</span>
              </button>
            ))}
          </div>

          <h2 className="text-lg font-extrabold text-navy">Patient queue <span className="ml-1 text-sm font-normal text-body" role="status">{shown.length} of {rows.length} patients</span></h2>
          {/* Queue */}
          <Card className="overflow-hidden">
            <div className="hidden md:grid grid-cols-[6px_1.6fr_1fr_1.4fr_1fr_120px] items-center gap-4 border-b border-line px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-body">
              <span /><span>Mom</span><span>Today's reading</span><span>Why</span><span>Last 7 days</span><span />
            </div>
            {shown.map(({ m, s, lvl }) => (
              <button
                key={m.id} onClick={() => setOpenId(m.id)}
                className="group grid w-full grid-cols-[6px_1fr] md:grid-cols-[6px_1.6fr_1fr_1.4fr_1fr_120px] items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 text-left last:border-0 hover:bg-[#faf9f9] focus-visible:bg-hover focus-visible:outline-offset-[-3px]"
              >
                <span className={`h-10 w-1.5 rounded-full self-center ${levelStyle[lvl].stripe} md:row-auto row-span-3`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{m.name}</span>
                  </div>
                  <div className="text-[13px] text-body">Day {m.dayToday} · {m.useCase} · {m.county} County</div>
                </div>
                <div className="col-start-2 md:col-auto">
                  {s.today?.answered && s.today.sys != null && s.today.dia != null ? (
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-extrabold tabular-nums ${lvl === "green" ? "text-ink" : levelStyle[lvl].text}`}>{s.today.sys}/{s.today.dia}</span>
                      <span className="text-xs text-body">{s.today.time}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber"><PhoneMissed size={15} aria-hidden="true" /> {s.today?.answered ? "No BP recorded" : s.today ? `No answer · ${s.today.attempts ?? 0} tries` : "No call recorded"}</span>
                  )}
                </div>
                <div className="col-start-2 md:col-auto flex flex-wrap gap-1.5">
                  {s.findings.length ? (
                    <>
                      <Pill level={lvl}>{LEVEL_TEXT[lvl]}</Pill>
                      <span className="text-[13px] text-body w-full">{s.findings.map((f) => (f.who === "baby" ? "Baby: " : "") + f.reason).join(" · ")}</span>
                    </>
                  ) : <Pill level="green">On track</Pill>}
                  {m.handled && <span className="text-xs font-semibold text-body">Nurse note recorded</span>}
                  {state.checkIns[m.id] && <span className="text-xs font-semibold text-[#632e4e]">Portal check-in</span>}
                  {waiting.has(m.id) && <span className="text-xs font-semibold text-navy">Handoff to accept</span>}
                </div>
                <div className="hidden md:block"><Sparkline calls={m.calls} level={lvl} /></div>
                <span className="hidden md:inline-flex items-center justify-end gap-1 text-sm font-semibold text-navy opacity-70 group-hover:opacity-100">
                  Open <ChevronRight size={16} />
                </span>
              </button>
            ))}
            {!shown.length && <div className="px-5 py-8 text-center text-sm text-body"><p>No patients match your search and filters.</p><button type="button" className="mt-2 min-h-11 font-bold text-navy underline" onClick={() => { setQ(""); setFilter("all"); }}>Clear search and filters</button></div>}
          </Card>
          <details className="rounded-card border border-line bg-white p-5">
            <summary className="cursor-pointer font-bold text-navy">Call operations metrics</summary>
            <div className="mt-4"><CallKpis /></div>
          </details>
          <details className="rounded-card border border-line bg-white p-5">
            <summary className="cursor-pointer font-bold text-navy">Continuity of care metrics</summary><a className="mt-1 inline-block text-sm font-semibold text-navy underline" href="#reports">Open charts, definitions, and exports</a>
            <p className="mt-1 text-xs text-body">Care completion and unresolved workflow gaps. Clinical severity remains separate from workflow acknowledgements.</p>
            <dl className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div><dt>Urgent doctor reviews pending</dt><dd className="text-xl font-bold">{metrics.pendingUrgent}/{metrics.urgent}</dd></div>
              <div><dt>Due care actions completed</dt><dd className="text-xl font-bold">{metrics.completedDue}/{metrics.due} · {rate(metrics.completedDue, metrics.due)}</dd></div>
              <div><dt>Overdue care actions</dt><dd className="text-xl font-bold">{metrics.overdue}</dd></div>
              <div><dt>Restored contact documented</dt><dd className="text-xl font-bold">{metrics.contactRestored}/{metrics.missed}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-body">{metrics.reviewed}/{metrics.enrolled} documented doctor reviews. A review does not establish restored contact or recovery. Future tasks are excluded from completion rates.</p>
          </details>

        </div>
      </main>


      {open && <Drawer key={open.id} mom={open} onClose={() => {setOpenId(null);if(location.hash.startsWith("#nurse/"))location.hash="#nurse";}} onHandled={markHandled} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "red" | "yellow" | "green" | "plain" }) {
  const dot = { red: "bg-[#ff6b5e]", yellow: "bg-gold", green: "bg-[#4cc27a]", plain: "bg-white/40" }[tone];
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.07] px-3 py-2 sm:px-4 sm:py-3 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-white/70"><span className={`h-2 w-2 rounded-full ${dot}`} />{label}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">{value}</div>
    </div>
  );
}

function Drawer({ mom, onClose, onHandled }: { mom: Mom; onClose: () => void; onHandled: (id: string, note: string) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialog(dialogRef);
  const s = status(mom);
  const lvl: Level = s.level;
  const [note, setNote] = useState(mom.nurseNote ?? "");
  const [noteSaved, setNoteSaved] = useState(false);
  const t = s.today;
  const summary = buildSummary(mom);
  const { state, recoveryRequired } = useCare();
  const doctorReviews = state.reviews.filter(r => r.patientId === mom.id);

  return (
    <dialog ref={dialogRef} aria-label={`${mom.name} details`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-[760px] overflow-hidden bg-ground text-ink shadow-2xl backdrop:bg-navy-900/40">
      <div className="relative flex h-full w-full flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#eeeded] bg-white/80 px-6 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight">{mom.name}</h2>
              <Pill level={lvl}>{LEVEL_TEXT[lvl]}</Pill>
            </div>
            <p className="text-sm text-body">{mom.age} · {mom.diagnosis} · {mom.delivery} · Day {mom.dayToday} of 10 · {mom.county} County</p>
          </div>
          <button onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-white hover:bg-hover" aria-label="Close panel"><X size={18} /></button>
        </header>

        <div className="flex flex-col gap-5 p-6">
          {/* Alert + actions */}
          {s.findings.length > 0 && (
            <div className={`rounded-card p-5 ${lvl === "yellow" ? "bg-amber-soft ring-1 ring-amber/30" : "bg-red-soft ring-1 ring-red/30"}`}>
              <div className="flex flex-col gap-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${levelStyle[lvl].text}`}>{t?.time ? `Latest check-in · ${t.time}` : "Latest check-in"}</span>
                {s.findings.map((f, i) => <p key={i} className="text-[17px] font-bold">{f.who === "baby" ? "Baby: " : ""}{f.reason}</p>)}
                <p className="text-sm text-body mt-1">
                  {lvl === "yellow" ? mom.handled ? "A nurse note is recorded. The clinical finding remains visible." : "Synthetic workflow: nurse review is pending." : "Urgent concern in a synthetic scenario. No real notification or emergency referral has been sent."}
                </p>
              </div>
            </div>
          )}

          <LiveCall patient={fromMom(mom)} />

          <PatientCheckIn mom={mom} />

          <Card className="p-5"><h3 className="font-bold">Doctor coordination</h3>
            <a href={`#doctor/${mom.id}`} className="mt-2 inline-block text-sm font-bold text-navy underline">Open doctor review for {mom.name}</a>
            {doctorReviews.length ? doctorReviews.map((r,i)=><div key={i} className="mt-3 rounded-lg bg-ground p-3 text-sm"><b>{r.disposition}</b><p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{r.note}</p></div>) : <p className="mt-2 text-sm text-body">Awaiting doctor assessment.</p>}
            <ul className="mt-3 space-y-2">{state.tasks.filter(t=>t.patientId===mom.id).map(t=><li key={t.id} className="rounded-lg border border-line p-3 text-sm [overflow-wrap:anywhere]">{t.title}<p className="text-xs text-body">{t.owner} · due day {t.dueDay} · {t.completed ? "Completed" : "Pending"}</p><CareAction task={t} actor="Nurse"/></li>)}</ul>
          </Card>
          {/* Handle */}
          <Card className="p-5">
            <label htmlFor="note" className="font-bold">Demo nurse note</label>
            <textarea
              id="note" value={note} onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }} rows={3}
              placeholder="Document contact outcome, action owner, and the next follow-up step." maxLength={3000}
              className="mt-2 w-full rounded-lg border border-line bg-white p-3 text-sm outline-none focus:border-navy/40"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => { onHandled(mom.id, note); setNoteSaved(true); }}
                disabled={recoveryRequired || !note.trim() || note.trim() === mom.nurseNote}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-navy hover:brightness-95 disabled:opacity-50"
              >
                <CheckCircle2 size={16} /> Save nurse note
              </button>
            </div>
            {noteSaved && <p role="status" className="mt-2 text-sm text-green">Nurse note saved.</p>}
          </Card>
          <details className="rounded-card border border-line bg-white p-5">
            <summary className="cursor-pointer font-bold">Patient history, calls, and care plan</summary>
            <div className="mt-4 space-y-4">
              {/* AI summary */}
              <Card className="p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-navy"><Sparkles size={16} className="text-gold-dark" /> What to look at</div>
                <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px]">
                  {summary.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
                <p className="mt-3 text-xs text-body">Template summary from synthetic check-ins; no AI model or real discharge record is connected.</p>
              </Card>

              {mom.history && <Card className="p-5">
                <h3 className="font-bold">Synthetic pregnancy and care history</h3>
                <p className="mt-2 text-sm">Delivery {mom.history.deliveryDate} at {mom.history.gestationalWeeks} weeks · discharged postpartum day {mom.history.dischargeDay}.</p>
                <ul className="mt-2 list-disc pl-5 text-sm">{mom.history.prenatal.map(e => <li key={e.gestationalWeek}>Week {e.gestationalWeek}: {e.bp.join("/")} mmHg · {e.note}</li>)}</ul>
                <p className="mt-2 text-sm">Access barriers: {mom.history.barriers.join("; ") || "None recorded in this synthetic scenario"}.</p>
                <p className="mt-2 text-sm">Care pathway: {mom.useCase}.</p>
                <ul className="mt-2 list-disc pl-5 text-sm">{state.tasks.filter(t => t.patientId === mom.id).map(t => <li key={t.id}>{t.title}: due postpartum day {t.dueDay} · {t.completed ? "completed" : t.dueDay < mom.dayToday ? "overdue" : "pending"}.</li>)}</ul>
              </Card>}

              {/* Chart */}
              <Card className="p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-bold">Blood pressure since going home</h3>
                  <span className="text-xs text-body">● top · ○ bottom · <span className="text-red">- - severe 160</span> · <span className="text-amber">- - home target 150</span></span>
                </div>
                <div className="mt-2"><BPChart calls={mom.calls} /></div>
              </Card>

              {/* Timeline */}
              <Card className="p-5">
                <h3 className="font-bold">Daily calls</h3>
                <ol className="mt-3 flex flex-col">
                  {[...mom.calls].reverse().map((c) => (
                    <li key={c.day} className="grid grid-cols-[64px_1fr] gap-3 border-t border-line py-3 first:border-0">
                      <div className="text-sm"><div className="font-bold">Day {c.day}</div><div className="text-xs text-body">{c.time}</div></div>
                      {c.answered ? (
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold tabular-nums">{c.sys}/{c.dia}</span>
                            {c.symptoms.length ? c.symptoms.map((x) => <span key={x} className="rounded-full bg-red-soft px-2 py-0.5 text-xs font-semibold text-red">{LABEL[x]}</span>) : <span className="text-xs text-body">No symptoms</span>}
                          </div>
                          {c.baby && (
                            <div className="flex items-center gap-1.5 text-xs text-body"><Baby size={13} /> {c.baby.feedsPerDay} feeds · {c.baby.wetDiapers} wet diapers · {c.baby.tempF}°F{c.baby.yellowSkin && c.baby.yellowSkin !== "none" ? ` · yellow ${c.baby.yellowSkin}` : ""}</div>
                          )}
                          {c.transcript && <p className="mt-1 rounded-lg bg-hover px-3 py-2 text-[13px] italic text-ink">"{c.transcript}"</p>}
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-amber">No answer after {c.attempts} tries. No SMS is sent by this demo.</div>
                      )}
                    </li>
                  ))}
                </ol>
              </Card>

              {/* Plan */}
              <Card className="p-5">
                <h3 className="font-bold">Her care plan</h3>
                <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="text-body text-xs">Medicines</dt><dd className="font-semibold">{mom.meds.length ? mom.meds.join(", ") : "None"}</dd></div>
                  <div><dt className="text-body text-xs">Next visit</dt><dd className="font-semibold">{mom.visit}</dd></div>
                  <div><dt className="text-body text-xs">Danger numbers</dt><dd className="font-semibold">Demo BP rules: urgent at systolic ≥160 OR diastolic ≥110; review ≥150 OR ≥100; symptoms assessed separately</dd></div>
                  <div><dt className="text-body text-xs">Calls</dt><dd className="font-semibold">Daily, 9 AM, days 2 to 10 · {mom.phoneType}</dd></div>
                  <div><dt className="text-body text-xs">Baby</dt><dd className="font-semibold">{mom.baby.name} · {mom.baby.feeding}</dd></div>
                  <div><dt className="text-body text-xs">Rules from</dt><dd className="font-semibold">SMFM · AIM · POST-BIRTH · AAP</dd></div>
                </dl>
              </Card>

            </div>
          </details>
        </div>
      </div>
    </dialog>
  );
}

function buildSummary(m: Mom): string[] {
  const ans = m.calls.filter((c) => c.answered && c.sys);
  const out: string[] = [];
  if (ans.length >= 2) {
    const first = ans[0], last = ans[ans.length - 1];
    const diff = last.sys! - first.sys!;
    out.push(`Top number ${diff >= 0 ? "up" : "down"} ${Math.abs(diff)} since day ${first.day} (${first.sys}/${first.dia} → ${last.sys}/${last.dia}).`);
  }
  const sx = [...new Set(m.calls.flatMap((c) => c.symptoms))];
  if (sx.length) out.push(`Symptoms reported: ${sx.map((x) => LABEL[x]).join(", ")}.`);
  out.push(m.meds.length ? `On ${m.meds.join(", ")}. Reconcile with the documented care plan.` : "No ongoing medicines listed in this synthetic record.");
  const missed = m.calls.filter((c) => !c.answered).length;
  if (missed) out.push(`Missed ${missed} call${missed > 1 ? "s" : ""}. Confirm phone number and best time.`);
  if (m.visit.includes("not booked") || m.visit.includes("missed")) out.push(`Follow-up visit: ${m.visit}. Help her book it.`);
  return out;
}

