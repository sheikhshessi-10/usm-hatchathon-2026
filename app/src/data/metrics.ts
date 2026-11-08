import { status, type Mom } from "./moms";

export function cohortMetrics(moms: Mom[]) {
  const today = moms.map(m => status(m).today).filter(c => c !== undefined);
  const answered = today.filter(c => c.answered).length;
  const bpCaptured = today.filter(c => c.answered && Number.isFinite(c.sys) && Number.isFinite(c.dia)).length;
  const calls = moms.flatMap(m => m.calls);
  const tasksDue = moms.flatMap(m => (m.careTasks ?? []).filter(t => t.dueDay <= m.dayToday).map(t => ({ ...t, currentDay: m.dayToday })));
  const tasksCompleted = tasksDue.filter(t => t.completedDay !== undefined && t.completedDay <= t.currentDay).length;
  const tasksOverdue = tasksDue.filter(t => t.completedDay === undefined && t.dueDay < t.currentDay).length;
  return {
    enrolled: moms.length, answered, bpCaptured, scheduledToday: moms.length,
    callDays: calls.length, answeredCallDays: calls.filter(c => c.answered).length,
    attempts: calls.reduce((n, c) => n + c.attempts, 0),
    tasksDue: tasksDue.length, tasksCompleted, tasksOverdue,
    openAlerts: moms.filter(m => status(m).level !== "green" && !m.handled).length,
  };
}
export const rate = (n: number, d: number) => d ? `${Math.round(100 * n / d)}%` : "N/A";
