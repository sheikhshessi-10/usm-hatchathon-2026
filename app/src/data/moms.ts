// Made-up sample patients for the demo. No real people.
import { evaluate, worst, type BabyCheck, type CheckIn, type Finding, type Level, type MomSymptom } from "../lib/rules";

export type Call = CheckIn & { time: string; transcript?: string; attempts: number };

export type Mom = {
  id: string;
  name: string;
  age: number;
  county: string;
  phone: string;
  phoneType: "flip phone" | "smartphone";
  diagnosis: string;
  delivery: string;
  baby: { name: string; feeding: "breast" | "bottle" | "both" };
  meds: string[];
  dayToday: number;
  visit: string;
  calls: Call[];
  handled?: boolean;
  nurseNote?: string;
  useCase?: string;
  concerns?: { level: Level; reason: string }[];
  careTasks?: { kind: string; dueDay: number; completedDay?: number; note: string }[];
  history?: {
    synthetic: true;
    deliveryDate: string;
    gestationalWeeks: number;
    prenatal: { gestationalWeek: number; bp: [number, number]; note: string }[];
    dischargeDay: number;
    barriers: string[];
    bpFollowUp?: { dueDay: number; scheduledDay?: number; completedDay?: number };
  };
};

export type Status = { level: Level; findings: Finding[]; today: Call | undefined };

type Row = [sys: number, dia: number, symptoms?: MomSymptom[], baby?: BabyCheck, answered?: boolean];

const TIMES = ["9:04 AM", "9:12 AM", "9:31 AM", "10:02 AM", "9:47 AM", "9:15 AM", "9:20 AM", "9:08 AM", "9:40 AM", "9:11 AM"];
const okBaby = (d: number): BabyCheck => ({ feedsPerDay: 9, wetDiapers: d >= 5 ? 7 : 3, tempF: 98.6, yellowSkin: "none" });

function calls(rows: Row[], startDay: number): Call[] {
  return rows.map(([sys, dia, symptoms = [], baby, answered = true], i) => {
    const day = startDay + i;
    return answered
      ? { day, answered, sys, dia, symptoms, baby: baby ?? okBaby(day), time: TIMES[i % TIMES.length], attempts: 1 }
      : { day, answered, symptoms: [], time: "No answer", attempts: 3 };
  });
}

const BASE_MOMS: Mom[] = [
  {
    id: "m1", name: "Keisha Williams", age: 27, county: "Perry", phone: "(601) 555-0142", phoneType: "flip phone",
    diagnosis: "Preeclampsia without severe features", delivery: "Vaginal birth, Nov 3",
    baby: { name: "Baby boy Williams", feeding: "breast" }, meds: ["Nifedipine ER 30 mg daily"], dayToday: 5,
    visit: "BP check Nov 10 (not booked)",
    calls: [
      ...calls([[136, 86], [138, 88], [146, 92]], 2),
      { day: 5, answered: true, sys: 166, dia: 112, symptoms: ["headache"], baby: okBaby(5), time: "9:12 AM", attempts: 1,
        transcript: "It said one sixty-six over one twelve. And I've had a bad headache since last night, Tylenol didn't help." },
    ],
  },
  {
    id: "m2", name: "Maria Hernandez", age: 31, county: "Forrest", phone: "(601) 555-0178", phoneType: "smartphone",
    diagnosis: "Gestational hypertension", delivery: "C-section, Nov 2", baby: { name: "Baby girl Hernandez", feeding: "both" },
    meds: ["Labetalol 200 mg twice daily"], dayToday: 6, visit: "BP check Nov 9",
    calls: calls([[139, 88], [142, 90], [145, 92], [148, 94]], 3),
  },
  {
    id: "m3", name: "Ashley Turner", age: 22, county: "Greene", phone: "(601) 555-0119", phoneType: "flip phone",
    diagnosis: "Routine recovery; postpartum access barriers", delivery: "Vaginal birth, Nov 4", baby: { name: "Baby girl Turner", feeding: "breast" },
    meds: [], dayToday: 4, visit: "Recovery visit Nov 18",
    calls: calls([[122, 78], [120, 76], [0, 0, [], undefined, false]], 2),
  },
  {
    id: "m4", name: "Tamika Johnson", age: 34, county: "Jones", phone: "(601) 555-0163", phoneType: "smartphone",
    diagnosis: "Post-cesarean wound concern", delivery: "C-section, Nov 1", baby: { name: "Baby boy Johnson", feeding: "bottle" },
    meds: ["Acetaminophen as needed per discharge plan"], dayToday: 7, visit: "Incision review Nov 9",
    calls: calls([[122, 76], [124, 78], [120, 76], [122, 78], [124, 80]], 3),
  },
  {
    id: "m5", name: "Brittany Moore", age: 29, county: "Lamar", phone: "(601) 555-0101", phoneType: "smartphone",
    diagnosis: "Gestational diabetes, diet controlled", delivery: "Vaginal birth, Nov 2", baby: { name: "Baby girl Moore", feeding: "breast" },
    meds: [], dayToday: 6, visit: "Glucose test Dec 14 (not booked)",
    calls: calls([[122, 78], [124, 80], [120, 76], [122, 78], [124, 80]], 2),
  },
  {
    id: "m6", name: "Jasmine Davis", age: 25, county: "Covington", phone: "(601) 555-0187", phoneType: "flip phone",
    diagnosis: "Breast pain and feeding difficulty", delivery: "Vaginal birth, Nov 3", baby: { name: "Baby boy Davis", feeding: "breast" },
    meds: [], dayToday: 5, visit: "Lactation review Nov 9",
    calls: calls([[118, 76], [120, 78], [118, 74], [120, 76]], 2),
  },
  {
    id: "m7", name: "Emily Carter", age: 33, county: "Forrest", phone: "(601) 555-0124", phoneType: "smartphone",
    diagnosis: "Postpartum mood concern", delivery: "C-section, Nov 1", baby: { name: "Baby girl Carter", feeding: "bottle" },
    meds: [], dayToday: 7, visit: "Mood assessment Nov 9",
    calls: calls([[120, 78], [122, 78], [118, 76], [120, 78], [122, 80]], 3),
  },
  {
    id: "m8", name: "Latoya Bennett", age: 30, county: "Marion", phone: "(601) 555-0156", phoneType: "flip phone",
    diagnosis: "Postpartum anemia after delivery blood loss", delivery: "Vaginal birth, Nov 4", baby: { name: "Baby boy Bennett", feeding: "breast" },
    meds: ["Ferrous sulfate per discharge prescription"], dayToday: 4, visit: "Anemia review Nov 7 (missed)",
    calls: calls([[118, 76], [116, 74], [118, 76]], 2),
  },
  {
    id: "m9", name: "Hannah Price", age: 24, county: "Wayne", phone: "(601) 555-0135", phoneType: "smartphone",
    diagnosis: "Routine postpartum recovery", delivery: "Vaginal birth, Nov 5", baby: { name: "Baby girl Price", feeding: "both" },
    meds: [], dayToday: 3, visit: "Routine follow-up Nov 20",
    calls: calls([[116, 74], [118, 76]], 2),
  },
  {
    id: "m10", name: "Shanice Greene", age: 28, county: "Jefferson Davis", phone: "(601) 555-0190", phoneType: "flip phone",
    diagnosis: "Pelvic and perineal recovery", delivery: "Vaginal birth, Nov 2", baby: { name: "Baby boy Greene", feeding: "bottle" },
    meds: ["Acetaminophen as needed per discharge plan"], dayToday: 6, visit: "Recovery review Nov 10",
    calls: calls([[122, 78], [120, 78], [118, 76], [120, 78], [122, 78]], 2),
  },
  {
    id: "m11", name: "Olivia Reed", age: 36, county: "Forrest", phone: "(601) 555-0111", phoneType: "smartphone",
    diagnosis: "Postpartum bleeding concern", delivery: "C-section, Oct 30", baby: { name: "Baby Reed", feeding: "both" },
    meds: [], dayToday: 9, visit: "Urgent bleeding assessment today (pending)",
    calls: calls([[122, 78], [124, 80], [122, 78], [120, 78], [122, 80], [124, 80], [126, 82]], 3),
  },
  {
    id: "m12", name: "Sofia Martin", age: 26, county: "Lamar", phone: "(601) 555-0112", phoneType: "smartphone",
    diagnosis: "Gestational diabetes; postpartum testing transition", delivery: "Vaginal birth, Oct 31",
    baby: { name: "Baby Martin", feeding: "breast" }, meds: [], dayToday: 8,
    visit: "Glucose test Dec 12 (scheduled)",
    calls: calls([[120, 78], [118, 76], [120, 78], [118, 76], [120, 78], [118, 76], [120, 78]], 2),
  },
  {
    id: "m13", name: "Avery Brooks", age: 23, county: "Jones", phone: "(601) 555-0113", phoneType: "flip phone",
    diagnosis: "Postpartum follow-up access gap", delivery: "Vaginal birth, Nov 1", baby: { name: "Baby Brooks", feeding: "both" },
    meds: [], dayToday: 7, visit: "Recovery visit Nov 8 (missed)",
    calls: calls([[120, 78], [118, 76], [120, 78], [118, 76], [0, 0, [], undefined, false], [0, 0, [], undefined, false]], 2),
  },
  {
    id: "m14", name: "Leah Foster", age: 32, county: "Pearl River", phone: "(601) 555-0114", phoneType: "smartphone",
    diagnosis: "Lactation concern with fever", delivery: "C-section, Nov 4", baby: { name: "Baby Foster", feeding: "bottle" },
    meds: [], dayToday: 4, visit: "Same-day clinician review (pending)",
    calls: calls([[120, 78], [122, 80]], 3),
  },
  {
    id: "m15", name: "Nora Ellis", age: 38, county: "Stone", phone: "(601) 555-0115", phoneType: "smartphone",
    diagnosis: "Routine recovery; contraception and primary care handoff", delivery: "Vaginal birth, Oct 29", baby: { name: "Baby Ellis", feeding: "breast" },
    meds: [], dayToday: 10, visit: "Recovery review completed Nov 5; planning visit Nov 19",
    calls: calls([[122, 78], [120, 78], [118, 76], [120, 78], [118, 76], [120, 78], [118, 76], [120, 78], [118, 76]], 2),
  },
];


/** Fixed snapshot, deliberately selected high-risk scenarios; not population prevalence. */
export const DEMO_AS_OF = "2026-11-08";
export const DATASET_VERSION = "maternal-demo-v1";
const CASES: { useCase: string; concern?: { level: Level; reason: string }; task: string; due: number; completed?: number; note: string }[] = [
  { useCase: "Severe postpartum hypertension", task: "urgent_assessment", due: 5, note: "Severe BP and headache; urgent escalation remains open" },
  { useCase: "Rising postpartum BP", task: "bp_review", due: 7, note: "Scheduled BP review; rising readings need nurse review today" },
  { useCase: "Missed check-in", task: "contact_recovery", due: 4, note: "Confirm phone and preferred contact time" },
  { useCase: "C-section wound", concern: { level: "red", reason: "Incision redness and drainage reported" }, task: "wound_review", due: 7, note: "Clinician assessment requested; diagnosis pending" },
  { useCase: "Gestational diabetes follow-up", concern: { level: "yellow", reason: "Postpartum glucose testing not booked" }, task: "glucose_test", due: 56, note: "Book 75-g oral glucose tolerance test in postpartum window" },
  { useCase: "Breastfeeding support", concern: { level: "yellow", reason: "Breast tenderness and latch difficulty; no fever reported" }, task: "lactation_review", due: 6, note: "Lactation assessment requested" },
  { useCase: "Mood screening", concern: { level: "yellow", reason: "Anxiety and poor sleep; screening needed, no diagnosis inferred" }, task: "mood_screen", due: 8, note: "Clinician screening; no self-harm reported" },
  { useCase: "Anemia and missed follow-up", concern: { level: "yellow", reason: "Fatigue and missed anemia review" }, task: "anemia_review", due: 3, note: "Transport support and rescheduling" },
  { useCase: "Routine recovery", task: "recovery_contact", due: 14, note: "Routine postpartum contact planned" },
  { useCase: "Pelvic recovery", concern: { level: "yellow", reason: "Urinary leakage and perineal discomfort" }, task: "recovery_review", due: 8, note: "Assess recovery; pelvic health referral if indicated" },
  { useCase: "New heavy bleeding", concern: { level: "red", reason: "Reported bleeding through a pad in an hour" }, task: "bleeding_assessment", due: 9, note: "Urgent clinician assessment pending" },
  { useCase: "Glucose and primary care transition", task: "glucose_test", due: 42, note: "Test scheduled Dec 12; completion not yet due" },
  { useCase: "Transport and contact barriers", task: "contact_recovery", due: 7, note: "Missed visit and two missed calls; coordinate transport" },
  { useCase: "Breast symptoms with fever", concern: { level: "red", reason: "Breast redness and fever reported; possible infection needs assessment" }, task: "breast_assessment", due: 4, note: "Same-day clinician review requested" },
  { useCase: "Recovery and reproductive planning", task: "recovery_review", due: 7, completed: 7, note: "Recovery visit completed Nov 5; reproductive planning visit scheduled" },
];
export const MOMS: Mom[] = BASE_MOMS.map((m, i) => {
  const c = CASES[i];
  const deliveryDate = new Date(Date.parse(DEMO_AS_OF + "T12:00:00Z") - m.dayToday * 86400000).toISOString().slice(0, 10);
  const hypertension = i < 2;
  const diabetes = i === 4 || i === 11;
  const symptomByCase: Record<number, MomSymptom> = { 3: "wound", 10: "heavy_bleeding", 13: "fever" };
  const recordCalls = m.calls.map((call, index) => index === m.calls.length - 1 && c.concern
    ? { ...call, transcript: `Synthetic patient report: ${c.concern.reason}.`, symptoms: symptomByCase[i] ? [symptomByCase[i]] : call.symptoms }
    : call);
  return { ...m, calls: recordCalls, useCase: c.useCase, concerns: c.concern ? [c.concern] : [],
    careTasks: [{ kind: c.task, dueDay: c.due, completedDay: c.completed, note: c.note }],
    history: {
      synthetic: true, deliveryDate, gestationalWeeks: [37, 38, 39, 38, 39, 39, 38, 39, 39, 40, 39, 39, 38, 39, 39][i],
      prenatal: [
        { gestationalWeek: 20, bp: [118 + (i % 4) * 2, 74 + (i % 3) * 2], note: "Routine prenatal assessment" },
        { gestationalWeek: 36, bp: hypertension ? [144, 92] : [120 + (i % 3) * 2, 76 + (i % 2) * 2], note: hypertension ? m.diagnosis : diabetes ? "Gestational diabetes; diet and glucose monitoring documented" : "Routine third trimester assessment" },
      ],
      dischargeDay: m.delivery.startsWith("C-section") ? 3 : 2,
      barriers: i === 12 ? ["Transport unavailable", "Shared phone access"] : i === 7 ? ["Missed appointment", "Transport coordination needed"] : i === 0 ? ["Follow-up not booked"] : [],
      bpFollowUp: hypertension ? { dueDay: 7, scheduledDay: i === 1 ? 7 : undefined } : undefined,
    },
  };
});

export function status(m: Mom): Status {
  const today = m.calls[m.calls.length - 1];
  if (!today) return { level: "yellow", findings: [{ level: "yellow", who: "mom", reason: "No check-in recorded" }], today };
  const r = evaluate(today, m.calls.slice(0, -1));
  const findings: Finding[] = [...r.findings, ...(m.concerns ?? []).map(c => ({ ...c, who: "mom" as const }))];
  return { level: worst(findings.map(f => f.level)), findings, today };
}

export const LEVEL_TEXT: Record<Level, string> = { red911: "Call 911", red: "Act now", yellow: "Review today", green: "On track" };

