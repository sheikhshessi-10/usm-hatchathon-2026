import { useEffect, useRef, useState } from "react";
import { Activity, ArrowUpRight, CheckCircle2, ClipboardList, Search, Stethoscope } from "lucide-react";
import { DEMO_AS_OF, LEVEL_TEXT, status, type Mom } from "../data/moms";
import { continuityMetrics, useCare, type Review } from "../data/workflow";
import { rate } from "../data/metrics";
import { RANK } from "../lib/rules";
import { PatientCheckIn } from "../ui/PatientCheckIn";
import { CareAction } from "../ui/CareAction";
import { BPChart, Card, Pill } from "../ui/parts";

type Filter = "all" | "urgent" | "unreviewed" | "overdue";
export default function DoctorDashboard() {
  const { moms, state, reset } = useCare();
  const workspace = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const requested = typeof location !== "undefined" ? location.hash.split("/")[1] : undefined;
  const [selected, setSelected] = useState(moms.some(m => m.id === requested) ? requested! : "m1");
  useEffect(()=>{const onHash=()=>{const id=location.hash.split("/")[1];setSelected(moms.some(m=>m.id===id)?id:"m1");};addEventListener("hashchange",onHash);return()=>removeEventListener("hashchange",onHash);},[]);
  const k = continuityMetrics(moms, state);
  const shown = moms.filter(m => {
    if (!`${m.name} ${m.useCase} ${m.county}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "urgent") return status(m).level.startsWith("red");
    if (filter === "unreviewed") return !state.reviews.some(r => r.patientId === m.id);
    if (filter === "overdue") return state.tasks.some(t => t.patientId === m.id && !t.completed && t.dueDay < m.dayToday);
    return true;
  }).sort((a,b) => RANK[status(b).level] - RANK[status(a).level]);
  const mom = moms.find(m => m.id === selected)!;
  return <main className="min-h-screen bg-ground px-4 pb-12 pt-6 text-ink sm:px-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-card bg-navy p-6 text-white sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold"><Stethoscope size={16}/> CareBridge · Clinical workspace</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Doctor portal</h1>
        <p className="mt-2 max-w-2xl text-white/80">Close the gaps between discharge, outreach, clinical review, and the next care team.</p>
        <a className="mt-3 inline-block text-sm font-bold text-gold underline" href="#reports">Open charts and reporting</a>
        <p className="mt-3 text-xs text-white/60">Synthetic cohort snapshot {DEMO_AS_OF} · browser-local demonstration · no prescriptions, referrals, or notifications are sent.</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="space-y-3 border-b border-line p-4">
            <label className="flex items-center gap-2 rounded-lg border border-line px-3"><Search size={16}/><input aria-label="Search doctor patients" className="min-w-0 w-full bg-transparent py-2 text-sm outline-none" placeholder="Patient, pathway, county" value={query} onChange={e=>setQuery(e.target.value)}/></label>
            <label className="block text-xs font-semibold">Review queue<select value={filter} onChange={e=>setFilter(e.target.value as Filter)} className="mt-1 w-full rounded-lg border border-line bg-white p-2 text-sm"><option value="all">All {moms.length} patients</option><option value="urgent">Urgent clinical findings</option><option value="unreviewed">Awaiting doctor review</option><option value="overdue">Overdue care actions</option></select></label>
          </div>
          <div className="max-h-64 overflow-y-auto lg:max-h-[640px]">{shown.map(m=><button key={m.id} aria-pressed={m.id===selected} onClick={()=>{setSelected(m.id);location.hash=`#doctor/${m.id}`;if(window.matchMedia?.("(max-width: 1023px)").matches) workspace.current?.focus();}} className={`block w-full border-b border-line p-4 text-left hover:bg-hover ${m.id===selected?"bg-hover ring-inset ring-2 ring-navy/20":""}`}><div className="flex items-center justify-between gap-2"><span className="font-bold">{m.name}</span>{state.reviews.some(r=>r.patientId===m.id)&&<CheckCircle2 size={15} className="text-green"/>}</div><p className="mt-1 text-xs text-body">{m.useCase} · day {m.dayToday}</p><div className="mt-2"><Pill level={status(m).level}>{LEVEL_TEXT[status(m).level]}</Pill></div></button>)}{!shown.length&&<p className="p-6 text-sm text-body">No patients match this queue.</p>}</div>
        </Card>
        <div ref={workspace} tabIndex={-1} aria-label="Selected patient workspace" className="min-w-0"><PatientWorkspace key={mom.id} mom={mom}/></div>
      </div>
      <details className="rounded-card border border-line bg-white p-5">
        <summary className="cursor-pointer font-bold text-navy">Cohort metrics <span className="ml-2 text-sm font-normal text-body">{k.pendingUrgent} urgent reviews pending</span></summary>
        <div className="mt-4">
          <section aria-label="Continuity of care KPIs" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Urgent reviews pending" value={String(k.pendingUrgent)} detail={`${k.acknowledged}/${k.urgent} urgent patients acknowledged; not clinical resolution`} />
        <Metric label="Due care actions completed" value={rate(k.completedDue,k.due)} detail={`${k.completedDue}/${k.due} due tasks completed; future tasks excluded`} />
        <Metric label="Overdue care actions" value={String(k.overdue)} detail="Incomplete actions past their due postpartum day" />
        <Metric label="Restored contact documented" value={rate(k.contactRestored,k.missed)} detail={`${k.contactRestored}/${k.missed} unreached patients with explicitly documented restored contact`} />
      </section>
      <p className="mt-3 text-sm text-body"><b>Continuity coverage</b><br/> {k.reviewed}/{k.enrolled} patients have a documented doctor review. {k.handoffsPending} handoffs await receiving-role acceptance. {k.handoffsAccepted}/{k.handoffRequests} assigned actions accepted; {k.handoffsClosed}/{k.handoffRequests} assigned actions accepted and completed. Review dispositions alone do not create or close a handoff. Clinical recovery, readmissions prevented, and time to response are not measured by this demo.</p>
        </div>
      </details>
      <button className="text-xs font-semibold text-body underline" onClick={()=>{if(window.confirm("Reset demo check-ins, reviews, care actions, and nurse notes?"))reset();}}>Reset demo workflow</button>
    </div>
  </main>;
}
function Metric({label,value,detail}:{label:string;value:string;detail:string}){return <Card className="p-5"><div className="text-xs font-semibold text-body">{label}</div><div className="mt-2 text-3xl font-extrabold text-navy">{value}</div><p className="mt-2 text-xs text-body">{detail}</p></Card>;}
function PatientWorkspace({mom}:{mom:Mom}) {
  const { state, review, addTask, recoveryRequired } = useCare();
  const [note,setNote]=useState(""); const [disposition,setDisposition]=useState<Review["disposition"]>("reviewed");
  const [title,setTitle]=useState(""); const [owner,setOwner]=useState<"Doctor"|"Nurse">("Nurse"); const [due,setDue]=useState(String(mom.dayToday));
  const [contactOutcome,setContactOutcome]=useState<Review["contactOutcome"]>("not-recorded");
  const [reviewSaved,setReviewSaved]=useState("");
  const [actionSaved,setActionSaved]=useState("");
  const s=status(mom), reviews=state.reviews.filter(r=>r.patientId===mom.id), tasks=state.tasks.filter(t=>t.patientId===mom.id);
  return <div className="min-w-0 space-y-5">
    <Card className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-extrabold">{mom.name}</h2><p className="mt-1 text-sm text-body">{mom.age} years · {mom.county} County · postpartum day {mom.dayToday}</p><p className="mt-2 font-semibold">{mom.useCase}</p></div><Pill level={s.level}>{LEVEL_TEXT[s.level]}</Pill></div>
      <p className="mt-3 text-sm">{mom.diagnosis} · {mom.delivery}</p>
      <div className="mt-4 rounded-xl bg-ground p-4"><h3 className="flex items-center gap-2 text-sm font-bold"><Activity size={16}/> Current findings</h3>{s.findings.length?<ul className="mt-2 list-disc pl-5 text-sm">{s.findings.map((f,i)=><li key={i}>{f.reason}</li>)}</ul>:<p className="mt-2 text-sm">No current flagged finding. Outstanding care tasks still require follow-up.</p>}</div>
      <p className="mt-3 text-sm"><b>Nurse handoff:</b> {mom.nurseNote || "No nurse note recorded."}</p>
      <PatientCheckIn mom={mom} />
      <a href={`#nurse/${mom.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-navy">Open nurse workspace <ArrowUpRight size={15}/></a>
    </Card>
    <Card className="p-5"><h3 className="flex items-center gap-2 font-bold"><Stethoscope size={17}/> Doctor assessment and disposition</h3>
      <form className="mt-4 space-y-3" onSubmit={e=>{e.preventDefault();review({patientId:mom.id,disposition,note,contactOutcome});setNote("");setReviewSaved("Doctor review saved to the demo record.");}}>
        <label className="block text-sm font-semibold">Review note<textarea required maxLength={3000} value={note} onChange={e=>setNote(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-line p-3 font-normal" placeholder="Assessment, uncertainty, action taken, and follow-up owner"/></label>
        <label className="block text-sm font-semibold">Disposition<select value={disposition} onChange={e=>setDisposition(e.target.value as Review["disposition"])} className="mt-1 block w-full rounded-lg border border-line bg-white p-2"><option value="reviewed">Reviewed — no outcome inferred</option><option value="escalated">Escalation documented</option><option value="follow-up">Follow-up needed — assign action below</option></select></label>
        <label className="block text-sm font-semibold">Contact outcome<select value={contactOutcome} onChange={e=>setContactOutcome(e.target.value as Review["contactOutcome"])} className="mt-1 block w-full rounded-lg border border-line bg-white p-2"><option value="not-recorded">Not recorded</option><option value="unreached">Patient not reached</option><option value="reached">Patient reached — documented in note</option></select></label>
        <button disabled={recoveryRequired || !note.trim()} className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Save doctor review</button>
      </form><p role="status" className="mt-2 text-sm text-green">{reviewSaved}</p>
      <ol className="mt-3 space-y-3">{[...reviews].reverse().map((r,i)=><li key={i} className="rounded-lg bg-ground p-3 text-sm"><div className="text-xs font-semibold text-body">{r.disposition} · {new Date(r.at).toLocaleString()}</div><p className="mt-1 whitespace-pre-wrap">{r.note}</p></li>)}</ol>
    </Card>
    <Card className="p-5"><h3 className="flex items-center gap-2 font-bold"><ClipboardList size={17}/> Care actions and handoffs</h3><ul className="mt-3 space-y-3">{tasks.map(t=><li key={t.id} className="rounded-xl border border-line p-3 text-sm"><p className="font-semibold">{t.title}</p><p className="mt-1 text-xs text-body">{t.owner} · due postpartum day {t.dueDay} · {t.completed?"Completed":t.dueDay<mom.dayToday?"Overdue":"Pending"}</p><CareAction task={t} actor="Doctor"/></li>)}</ul>
      <form className="mt-4 space-y-3 border-t border-line pt-4" onSubmit={e=>{e.preventDefault();addTask({patientId:mom.id,title,owner,dueDay:Number(due)});setTitle("");setActionSaved("Care action added to the demo care plan.");}}>
        <label className="block text-sm font-semibold">New care action<input required maxLength={300} value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-2 font-normal" placeholder="Specific next action and handoff"/></label>
        <div className="flex flex-wrap gap-3"><label className="text-sm">Owner<select value={owner} onChange={e=>setOwner(e.target.value as "Nurse"|"Doctor")} className="ml-2 rounded-lg border border-line bg-white p-2"><option>Nurse</option><option>Doctor</option></select></label><label className="text-sm">Due postpartum day<input required type="number" min="0" max="365" step="1" value={due} onChange={e=>setDue(e.target.value)} className="ml-2 w-20 rounded-lg border border-line p-2"/></label></div>
        <button disabled={recoveryRequired || !title.trim()||due===""||!Number.isInteger(Number(due))||Number(due)<0||Number(due)>365} className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-40">Assign care action</button>
      </form>
      <p role="status" className="mt-2 text-sm text-green">{actionSaved}</p>
    </Card>
    <details className="rounded-card border border-line bg-white p-5"><summary className="cursor-pointer font-bold">Longitudinal clinical record</summary><div className="mt-3"><BPChart calls={mom.calls}/></div>
      <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-body">Recorded medicines</dt><dd>{mom.meds.join("; ")||"None recorded"}</dd></div><div><dt className="text-xs text-body">Next planned care</dt><dd>{mom.visit}</dd></div><div><dt className="text-xs text-body">Delivery and discharge</dt><dd>{mom.history?.gestationalWeeks} weeks · discharged day {mom.history?.dischargeDay}</dd></div><div><dt className="text-xs text-body">Access barriers</dt><dd>{mom.history?.barriers.join("; ")||"None recorded"}</dd></div></dl>
      <details className="mt-4 rounded-lg border border-line p-3"><summary className="cursor-pointer text-sm font-semibold">Prenatal history and check-in evidence</summary><ol className="mt-3 space-y-3 text-sm">{mom.history?.prenatal.map(e=><li key={e.gestationalWeek}><b>Prenatal week {e.gestationalWeek}:</b> {e.bp.join("/")} · {e.note}</li>)}{mom.calls.map(c=><li key={c.day}><b>Postpartum day {c.day}:</b> {c.answered?`${c.sys}/${c.dia} · ${c.time}`:`Unanswered after ${c.attempts} attempts`}{c.transcript&&<p className="mt-1 italic">{c.transcript}</p>}</li>)}</ol></details>
    </details>
  </div>;
}
