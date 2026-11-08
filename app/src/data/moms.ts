// Made-up sample patients for the demo. No real people.
import { evaluate, type BabyCheck, type CheckIn, type Finding, type Level, type MomSymptom } from "../lib/rules";

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

export const MOMS: Mom[] = [
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
    calls: calls([[134, 84], [139, 88], [142, 90], [145, 92], [148, 94]], 2),
  },
  {
    id: "m3", name: "Ashley Turner", age: 22, county: "Greene", phone: "(601) 555-0119", phoneType: "flip phone",
    diagnosis: "Gestational hypertension", delivery: "Vaginal birth, Nov 4", baby: { name: "Baby girl Turner", feeding: "breast" },
    meds: [], dayToday: 4, visit: "BP check Nov 13",
    calls: calls([[132, 82], [130, 80], [0, 0, [], undefined, false]], 2),
  },
  {
    id: "m4", name: "Tamika Johnson", age: 34, county: "Jones", phone: "(601) 555-0163", phoneType: "smartphone",
    diagnosis: "Chronic hypertension", delivery: "Vaginal birth, Nov 1", baby: { name: "Baby boy Johnson", feeding: "bottle" },
    meds: ["Nifedipine ER 60 mg daily"], dayToday: 7, visit: "BP check Nov 9",
    calls: calls([[142, 90], [140, 88], [138, 88], [136, 86], [134, 84], [132, 82, [], { feedsPerDay: 8, wetDiapers: 6, tempF: 100.6, yellowSkin: "none" }]], 2),
  },
  {
    id: "m5", name: "Brittany Moore", age: 29, county: "Lamar", phone: "(601) 555-0101", phoneType: "smartphone",
    diagnosis: "Preeclampsia without severe features", delivery: "Vaginal birth, Nov 2", baby: { name: "Baby girl Moore", feeding: "breast" },
    meds: ["Labetalol 200 mg twice daily"], dayToday: 6, visit: "BP check Nov 9",
    calls: calls([[140, 90], [144, 92], [150, 96], [152, 98], [154, 100]], 2),
  },
  {
    id: "m6", name: "Jasmine Davis", age: 25, county: "Covington", phone: "(601) 555-0187", phoneType: "flip phone",
    diagnosis: "Gestational hypertension", delivery: "Vaginal birth, Nov 3", baby: { name: "Baby boy Davis", feeding: "breast" },
    meds: [], dayToday: 5, visit: "BP check Nov 12",
    calls: calls([[128, 80], [126, 78], [130, 82], [124, 78, [], { feedsPerDay: 9, wetDiapers: 6, tempF: 98.4, yellowSkin: "eyes" }]], 2),
  },
  {
    id: "m7", name: "Emily Carter", age: 33, county: "Forrest", phone: "(601) 555-0124", phoneType: "smartphone",
    diagnosis: "Gestational hypertension", delivery: "C-section, Nov 1", baby: { name: "Baby girl Carter", feeding: "bottle" },
    meds: [], dayToday: 7, visit: "BP check Nov 10",
    calls: calls([[134, 84], [132, 82], [130, 82], [128, 80], [126, 80], [124, 78]], 2),
  },
  {
    id: "m8", name: "Latoya Bennett", age: 30, county: "Marion", phone: "(601) 555-0156", phoneType: "flip phone",
    diagnosis: "Preeclampsia without severe features", delivery: "Vaginal birth, Nov 4", baby: { name: "Baby boy Bennett", feeding: "breast" },
    meds: ["Nifedipine ER 30 mg daily"], dayToday: 4, visit: "BP check Nov 7 (missed)",
    calls: calls([[138, 88], [136, 86], [134, 86]], 2),
  },
  {
    id: "m9", name: "Hannah Price", age: 24, county: "Wayne", phone: "(601) 555-0135", phoneType: "smartphone",
    diagnosis: "Gestational hypertension", delivery: "Vaginal birth, Nov 5", baby: { name: "Baby girl Price", feeding: "both" },
    meds: [], dayToday: 3, visit: "BP check Nov 13",
    calls: calls([[130, 82], [128, 80]], 2),
  },
  {
    id: "m10", name: "Shanice Greene", age: 28, county: "Jefferson Davis", phone: "(601) 555-0190", phoneType: "flip phone",
    diagnosis: "Chronic hypertension", delivery: "Vaginal birth, Nov 2", baby: { name: "Baby boy Greene", feeding: "bottle" },
    meds: ["Labetalol 300 mg twice daily"], dayToday: 6, visit: "BP check Nov 9",
    calls: calls([[144, 92], [140, 90], [138, 88], [136, 86], [134, 86]], 2),
  },
];

export function status(m: Mom): Status {
  const today = m.calls[m.calls.length - 1];
  if (!today) return { level: "green", findings: [], today };
  const r = evaluate(today, m.calls.slice(0, -1));
  return { ...r, today };
}

export const LEVEL_TEXT: Record<Level, string> = { red911: "Call 911", red: "Act now", yellow: "Review today", green: "On track" };
