import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MOMS, status, type Mom } from "./moms";

export type Review = { patientId: string; disposition: "reviewed" | "escalated" | "follow-up"; note: string; contactOutcome: "not-recorded" | "unreached" | "reached"; at: string };
export type Task = { id: string; patientId: string; title: string; owner: "Nurse" | "Doctor"; dueDay: number; completed: boolean; source: "plan" | "doctor" };
export type Workflow = { reviews: Review[]; tasks: Task[]; handled: Record<string, string> };
export const initialWorkflow = (): Workflow => ({ reviews: [], handled: {}, tasks: MOMS.flatMap(m => (m.careTasks ?? []).map((t, i) => ({ id: `${m.id}-plan-${i}`, patientId: m.id, title: t.note, owner: "Nurse", dueDay: t.dueDay, completed: t.completedDay !== undefined, source: "plan" }))) });
const KEY = "carebridge-workflow-v1";
export function readWorkflow(raw: string | null): Workflow {
  const fallback = initialWorkflow();
  if (!raw) return fallback;
  try {
    const x = JSON.parse(raw) as Workflow;
    const known = (id: unknown) => MOMS.some(m => m.id === id);
    if (!Array.isArray(x.reviews) || !Array.isArray(x.tasks) || !x.handled || typeof x.handled !== "object" || Array.isArray(x.handled)) return fallback;
    if (!x.reviews.every(r => known(r.patientId) && ["reviewed", "escalated", "follow-up"].includes(r.disposition) && typeof r.note === "string" && typeof r.at === "string" && ["not-recorded", "unreached", "reached"].includes(r.contactOutcome))) return fallback;
    if (!x.tasks.every(t => known(t.patientId) && typeof t.id === "string" && typeof t.title === "string" && ["Nurse", "Doctor"].includes(t.owner) && ["plan", "doctor"].includes(t.source) && Number.isInteger(t.dueDay) && t.dueDay >= 0 && typeof t.completed === "boolean")) return fallback;
    if (new Set(x.tasks.map(t => t.id)).size !== x.tasks.length || !Object.entries(x.handled).every(([id, note]) => known(id) && typeof note === "string")) return fallback;
    if (!fallback.tasks.every(t => x.tasks.some(saved => saved.id === t.id && saved.patientId === t.patientId && saved.source === "plan"))) return fallback;
    return x;
  } catch { return fallback; }
}
export function continuityMetrics(moms: Mom[], state: Workflow) {
  const ids = new Set(moms.map(m => m.id));
  const tasks = state.tasks.filter(t => ids.has(t.patientId));
  const due = tasks.filter(t => t.dueDay <= moms.find(m => m.id === t.patientId)!.dayToday);
  const overdue = due.filter(t => !t.completed && t.dueDay < moms.find(m => m.id === t.patientId)!.dayToday);
  const urgent = moms.filter(m => status(m).level.startsWith("red"));
  // A review or escalation is an acknowledgement, not proof of treatment or recovery.
  const acknowledged = urgent.filter(m => state.reviews.some(r => r.patientId === m.id));
  const missed = moms.filter(m => !status(m).today?.answered);
  const recovered = missed.filter(m => state.reviews.filter(r => r.patientId === m.id && r.contactOutcome !== "not-recorded").slice(-1)[0]?.contactOutcome === "reached");
  return { enrolled: moms.length, urgent: urgent.length, acknowledged: acknowledged.length,
    pendingUrgent: urgent.length - acknowledged.length,
    due: due.length, completedDue: due.filter(t => t.completed).length, overdue: overdue.length,
    missed: missed.length, contactRestored: recovered.length,
    reviewed: moms.filter(m => state.reviews.some(r => r.patientId === m.id)).length,
    handoffRequests: state.reviews.filter(r => ids.has(r.patientId) && r.disposition === "follow-up").length,
  };
}
type CareContext = { state: Workflow; moms: Mom[]; storageWarning: boolean; review: (r: Omit<Review, "at">) => void; addTask: (t: Omit<Task, "id" | "completed" | "source">) => void; completeTask: (id: string) => void; handle: (id: string, note: string) => void; reset: () => void };
const Context = createContext<CareContext | null>(null);
export function CareProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Workflow>(() => { try { return readWorkflow(typeof localStorage === "undefined" ? null : localStorage.getItem(KEY)); } catch { return initialWorkflow(); } });
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); setStorageWarning(false); } catch { setStorageWarning(true); } }, [state]);
  const moms = MOMS.map(m => ({ ...m, handled: Object.prototype.hasOwnProperty.call(state.handled, m.id), nurseNote: state.handled[m.id] }));
  const review = (r: Omit<Review, "at">) => { if (!r.note.trim() || !MOMS.some(m => m.id === r.patientId)) return; setState(s => ({ ...s, reviews: [...s.reviews, { ...r, note: r.note.trim(), at: new Date().toISOString() }] })); };
  const addTask = (t: Omit<Task, "id" | "completed" | "source">) => { if (!t.title.trim() || !Number.isInteger(t.dueDay) || t.dueDay < 0 || !MOMS.some(m => m.id === t.patientId)) return; setState(s => ({ ...s, tasks: [...s.tasks, { ...t, title: t.title.trim(), id: crypto.randomUUID(), completed: false, source: "doctor" }] })); };
  return <Context.Provider value={{ state, moms, storageWarning, review, addTask, completeTask: id => setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, completed: true } : t) })), handle: (id, note) => setState(s => ({ ...s, handled: { ...s.handled, [id]: note } })), reset: () => setState(initialWorkflow()) }}>{children}</Context.Provider>;
}
export function useCare() { const ctx = useContext(Context); if (!ctx) throw new Error("CareProvider required"); return ctx; }
