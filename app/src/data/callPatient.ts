// What the AI phone call needs to know about one patient.
import type { Mom } from "./moms";
import { buildPatientFile } from "../nurse/PatientFile";

/** One thing the doctor wants checked on every call. The AI asks it by name and records the answer. */
export type Check = { id: string; label: string; question: string; concernIf: string };

export type CallPatient = {
  id: string;
  name: string;
  babyName: string;
  day: number;
  /** Plain-text health record the AI reads before the call. */
  file: string;
  /** The doctor's orders, turned into questions for the call. */
  checks: Check[];
};

export const DEFAULT_CHECKS: Check[] = [
  { id: "meds", label: "Medicine taken", question: "Did you take your blood pressure medicine today? Any missed doses?", concernIf: "missed doses or stopped taking it" },
  { id: "bp", label: "Blood pressure", question: "What's your blood pressure reading today?", concernIf: "150/100 or higher" },
  { id: "headache_vision", label: "Headache or vision", question: "Any headache that won't go away, or blurry vision or spots?", concernIf: "yes to either" },
  { id: "bleeding", label: "Bleeding", question: "How's your bleeding? Soaking a pad in an hour or less?", concernIf: "soaking a pad in an hour or less, or big clots" },
  { id: "baby", label: "Baby feeding and diapers", question: "How many feeds and wet diapers did your baby have in the last day?", concernIf: "fewer than 8 feeds, or fewer than 6 wet diapers after day 5" },
];

export function fromMom(m: Mom): CallPatient {
  return { id: m.id, name: m.name, babyName: m.baby.name, day: m.dayToday, file: buildPatientFile(m), checks: DEFAULT_CHECKS };
}
