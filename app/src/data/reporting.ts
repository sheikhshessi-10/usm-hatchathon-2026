import { DEMO_AS_OF, status, type Mom } from "./moms";
import { continuityMetrics, type Workflow } from "./workflow";
import { OPEN_DATA } from "./openData";

export const pathway = (m: Mom) => {
  const kind = m.careTasks?.[0]?.kind ?? "";
  if (["urgent_assessment", "bp_review"].includes(kind)) return "Blood pressure";
  if (kind === "glucose_test") return "Metabolic follow-up";
  if (["lactation_review", "breast_assessment"].includes(kind)) return "Breast and feeding";
  if (kind === "mood_screen") return "Emotional wellbeing";
  if (kind === "contact_recovery") return "Access and contact";
  return "Physical recovery";
};
export function reportSnapshot(moms: Mom[], state: Workflow) {
  const k = continuityMetrics(moms, state);
  const recordedCheckIns = moms.filter(m => status(m).today !== undefined);
  const answerCount = recordedCheckIns.filter(m => status(m).today?.answered).length;
  const milestones = [
    { label: "Latest recorded check-in answered", numerator: answerCount, denominator: recordedCheckIns.length, definition: "Answered latest recorded check-in / patients with a recorded check-in. Records may predate the current scenario day." },
    { label: "Doctor review documented", numerator: k.reviewed, denominator: moms.length, definition: "Unique selected patients with a documented doctor review / selected patients." },
    { label: "Due care actions completed", numerator: k.completedDue, denominator: k.due, definition: "Completed actions due by each patient's current postpartum day / all due actions. Future actions excluded." },
    { label: "Assigned handoffs accepted", numerator: k.handoffsAccepted, denominator: k.handoffRequests, definition: "Doctor-assigned actions explicitly accepted by the receiving role / doctor-assigned actions." },
    { label: "Assigned handoffs accepted and completed", numerator: k.handoffsClosed, denominator: k.handoffRequests, definition: "Doctor-assigned actions with both acceptance and completion / doctor-assigned actions." },
    { label: "Restored contact documented", numerator: k.contactRestored, denominator: k.missed, definition: "Patients whose latest recorded check-in was missed and whose latest explicit contact outcome is reached / patients whose latest recorded check-in was missed." },
  ];
  const dates = new Map<string, { date: string; answered: number; missed: number }>();
  for (const m of moms) for (const call of m.calls) {
    if (!m.history) continue;
    const date = new Date(Date.parse(m.history.deliveryDate + "T12:00:00Z") + call.day * 86400000).toISOString().slice(0,10);
    const d = dates.get(date) ?? { date, answered: 0, missed: 0 };
    if (call.answered) d.answered++; else d.missed++;
    dates.set(date, d);
  }
  const patientRows = moms.map(m => {
    const tasks = state.tasks.filter(t=>t.patientId===m.id);
    return { id:m.id,name:m.name,pathway:pathway(m),postpartumDay:m.dayToday,clinicalLevel:status(m).level,
      checkInAnswered:status(m).today?.answered??null,doctorReviewed:state.reviews.some(r=>r.patientId===m.id),
      dueActions:tasks.filter(t=>t.dueDay<=m.dayToday).length,
      completedDueActions:tasks.filter(t=>t.dueDay<=m.dayToday&&t.completed).length,
      overdueActions:tasks.filter(t=>!t.completed&&t.dueDay<m.dayToday).length,
      sourceObservation:m.openData?.row??null,
    };
  });
  return { asOf:DEMO_AS_OF,dataType:"Synthetic workflow with open-data-derived baseline anchors",metrics:k,milestones,
    outreach:[...dates.values()].sort((a,b)=>a.date.localeCompare(b.date)),patients:patientRows,
    referenceSources:OPEN_DATA,
    limitations:["Selected demonstration cases, not a representative population sample.","Scenario date is fixed; workflow updates reflect the current browser session, not a historical as-of snapshot.","UCI pregnancy observations are from rural Bangladesh; demographic and BP values are adapted to fictional scenarios, not real US postpartum histories.","PRAMS 2022 population benchmarks are separate from first-ten-day workflow KPIs and cannot establish AVENLYTH effectiveness.","No causal effect, clinical recovery, mortality benefit, or readmissions prevented is measured."],
  };
}
// Prefix formula-like strings before quoting so spreadsheet programs do not execute cells.
export function csvCell(value: unknown): string {
  let s=String(value??""); if (/^(?:[\t\r\n]|\s*[=+\-@])/.test(s)) s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
export function cohortCsv(snapshot: ReturnType<typeof reportSnapshot>): string {
  const columns=["id","name","pathway","postpartumDay","clinicalLevel","checkInAnswered","doctorReviewed","dueActions","completedDueActions","overdueActions","sourceObservation"] as const;
  return '\uFEFF'+[["scenarioDate","dataType","baselineSource",...columns].map(csvCell).join(","),...snapshot.patients.map(p=>[snapshot.asOf,snapshot.dataType,OPEN_DATA.uci.doi,...columns.map(k=>p[k])].map(csvCell).join(","))].join("\r\n");
}
