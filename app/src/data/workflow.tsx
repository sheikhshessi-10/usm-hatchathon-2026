import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MOMS, status, type Mom } from "./moms";

export type Review = { patientId: string; disposition: "reviewed" | "escalated" | "follow-up"; note: string; contactOutcome: "not-recorded" | "unreached" | "reached"; at: string };
export type Task = { id: string; patientId: string; title: string; owner: "Nurse" | "Doctor"; dueDay: number; completed: boolean; source: "plan" | "doctor"; acceptedAt?: string; acceptedBy?: "Nurse" | "Doctor"; completedAt?: string };
export type Workflow = { reviews: Review[]; tasks: Task[]; handled: Record<string, string> };
export const initialWorkflow = (): Workflow => ({ reviews: [], handled: {}, tasks: MOMS.flatMap(m => (m.careTasks ?? []).map((t, i) => ({ id: `${m.id}-plan-${i}`, patientId: m.id, title: t.note, owner: "Nurse", dueDay: t.dueDay, completed: t.completedDay !== undefined, source: "plan" }))) });
const KEY = "carebridge-workflow-v1";
export function parseWorkflow(raw: string): Workflow | null {
  const fallback = initialWorkflow();
  try {
    const x = JSON.parse(raw) as Workflow;
    const known = (id: unknown) => MOMS.some(m => m.id === id);
    const date = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v));
    if (!x || !Array.isArray(x.reviews) || !Array.isArray(x.tasks) || !x.handled || typeof x.handled !== "object" || Array.isArray(x.handled)) return null;
    if (!x.reviews.every(r => r && known(r.patientId) && ["reviewed", "escalated", "follow-up"].includes(r.disposition) && typeof r.note === "string" && r.note.trim().length>0 && r.note.length<=3000 && date(r.at) && ["not-recorded", "unreached", "reached"].includes(r.contactOutcome))) return null;
    if (!x.tasks.every(t => t && known(t.patientId) && typeof t.id === "string" && t.id.length>0 && typeof t.title === "string" && t.title.trim().length>0 && t.title.length<=300 && ["Nurse", "Doctor"].includes(t.owner) && ["plan", "doctor"].includes(t.source) && Number.isInteger(t.dueDay) && t.dueDay >= 0 && t.dueDay<=365 && typeof t.completed === "boolean")) return null;
    if (new Set(x.tasks.map(t => t.id)).size !== x.tasks.length || !Object.entries(x.handled).every(([id, note]) => known(id) && typeof note === "string" && note.trim().length>0 && note.length<=3000)) return null;
    if (!fallback.tasks.every(t => x.tasks.some(saved => saved.id === t.id && saved.patientId === t.patientId && saved.source === "plan"))) return null;
    if (!x.tasks.every(t => (t.acceptedAt === undefined && t.acceptedBy === undefined || date(t.acceptedAt) && t.acceptedBy === t.owner) && (t.completedAt === undefined || t.completed && date(t.completedAt)) && (!t.acceptedAt || !t.completedAt || Date.parse(t.completedAt)>=Date.parse(t.acceptedAt)))) return null;
    return x;
  } catch { return null; }
}
export function readWorkflow(raw: string | null): Workflow { return raw ? parseWorkflow(raw) ?? initialWorkflow() : initialWorkflow(); }

export function continuityMetrics(moms: Mom[], state: Workflow) {
  const ids = new Set(moms.map(m => m.id));
  const tasks = state.tasks.filter(t => ids.has(t.patientId));
  const due = tasks.filter(t => t.dueDay <= moms.find(m => m.id === t.patientId)!.dayToday);
  const overdue = due.filter(t => !t.completed && t.dueDay < moms.find(m => m.id === t.patientId)!.dayToday);
  const urgent = moms.filter(m => status(m).level.startsWith("red"));
  // A review or escalation is an acknowledgement, not proof of treatment or recovery.
  const acknowledged = urgent.filter(m => state.reviews.some(r => r.patientId === m.id));
  const missed = moms.filter(m => status(m).today?.answered === false);
  const recovered = missed.filter(m => state.reviews.filter(r => r.patientId === m.id && r.contactOutcome !== "not-recorded").slice(-1)[0]?.contactOutcome === "reached");
  return { enrolled: moms.length, urgent: urgent.length, acknowledged: acknowledged.length,
    pendingUrgent: urgent.length - acknowledged.length,
    due: due.length, completedDue: due.filter(t => t.completed).length, overdue: overdue.length,
    missed: missed.length, contactRestored: recovered.length,
    reviewed: moms.filter(m => state.reviews.some(r => r.patientId === m.id)).length,
    handoffRequests: tasks.filter(t => t.source === "doctor").length,
    handoffsAccepted: tasks.filter(t => t.source === "doctor" && t.acceptedAt).length,
    handoffsClosed: tasks.filter(t => t.source === "doctor" && t.acceptedAt && t.completed).length,
    handoffsPending: tasks.filter(t => t.source === "doctor" && !t.acceptedAt && !t.completed).length,
  };
}
type CareContext = { state: Workflow; moms: Mom[]; storageWarning: boolean; recoveryRequired: boolean; review: (r: Omit<Review, "at">) => void; addTask: (t: Omit<Task, "id" | "completed" | "source">) => void; acceptTask: (id: string, actor: Task["owner"]) => void; completeTask: (id: string, actor: Task["owner"]) => void; handle: (id: string, note: string) => void; reset: () => void };
const Context = createContext<CareContext | null>(null);
export function CareProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
      const parsed = raw !== null ? parseWorkflow(raw) : initialWorkflow();
      return { state: parsed ?? initialWorkflow(), recoveryRequired: raw !== null && !parsed };
    } catch { return { state: initialWorkflow(), recoveryRequired: true }; }
  });
  const state=session.state;
  const setState=(update:(s:Workflow)=>Workflow)=>setSession(s => s.recoveryRequired ? s : { ...s, state: update(s.state) });
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    if(session.recoveryRequired)return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }, [state, session.recoveryRequired]);
  const moms = MOMS.map(m => ({ ...m, handled: Object.prototype.hasOwnProperty.call(state.handled, m.id), nurseNote: state.handled[m.id] }));
  const review = (r: Omit<Review, "at">) => { if (!r.note.trim() || r.note.length>3000 || !["reviewed","escalated","follow-up"].includes(r.disposition) || !["not-recorded","unreached","reached"].includes(r.contactOutcome) || !MOMS.some(m => m.id === r.patientId)) return; setState(s => ({ ...s, reviews: [...s.reviews, { ...r, note: r.note.trim(), at: new Date().toISOString() }] })); };
  const addTask = (t: Omit<Task, "id" | "completed" | "source">) => { if (!t.title.trim() || !Number.isInteger(t.dueDay) || t.dueDay < 0 || t.dueDay>365 || t.title.length>300 || !["Nurse","Doctor"].includes(t.owner) || !MOMS.some(m => m.id === t.patientId)) return; setState(s => ({ ...s, tasks: [...s.tasks, { ...t, title: t.title.trim(), id: crypto.randomUUID(), completed: false, source: "doctor" }] })); };
  const acceptTask = (id: string, actor: Task["owner"]) => setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id && t.owner === actor && t.source === "doctor" && !t.acceptedAt && !t.completed ? { ...t, acceptedAt: new Date().toISOString(), acceptedBy: actor } : t) }));
  const completeTask = (id: string, actor: Task["owner"]) => setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id && t.owner === actor && !t.completed && (t.source === "plan" || t.acceptedAt) ? { ...t, completed: true, completedAt: new Date().toISOString() } : t) }));
  return <Context.Provider value={{ state, moms, storageWarning, recoveryRequired: session.recoveryRequired, review, addTask, acceptTask, completeTask, handle: (id, note) => { if(MOMS.some(m=>m.id===id)&&note.trim()&&note.length<=3000)setState(s => ({ ...s, handled: { ...s.handled, [id]: note.trim() } })); }, reset: () => setSession({state:initialWorkflow(),recoveryRequired:false}) }}>{children}</Context.Provider>;
}
export function useCare() { const ctx = useContext(Context); if (!ctx) throw new Error("CareProvider required"); return ctx; }
