// Danger check. Fixed rules only, no AI.
// Mom: SMFM postpartum hypertension discharge checklist, MSPQC hypertension toolkit, AWHONN POST-BIRTH.
// Baby: AAP (healthychildren.org) newborn symptom checker and fever guidance.
// Sources are listed on the team care map.

export type Level = "green" | "yellow" | "red" | "red911";

export type MomSymptom =
  | "headache"
  | "vision"
  | "upper_belly_pain"
  | "swelling"
  | "chest_pain"
  | "trouble_breathing"
  | "seizure"
  | "self_harm"
  | "heavy_bleeding"
  | "leg_red_swollen"
  | "fever"
  | "wound";

export type BabyCheck = {
  feedsPerDay?: number;
  wetDiapers?: number;
  tempF?: number;
  yellowSkin?: "none" | "eyes" | "face" | "spreading";
  feedingPoorly?: boolean;
  hardToWake?: boolean;
  cantWake?: boolean;
  noPee8h?: boolean;
};

export type CheckIn = {
  day: number; // days since birth
  answered: boolean;
  sys?: number;
  dia?: number;
  symptoms: MomSymptom[];
  baby?: BabyCheck;
};

export type Finding = { level: Level; who: "mom" | "baby"; reason: string };

export const LABEL: Record<MomSymptom, string> = {
  headache: "headache",
  vision: "vision changes",
  upper_belly_pain: "upper belly pain",
  swelling: "swelling",
  chest_pain: "chest pain",
  trouble_breathing: "trouble breathing",
  seizure: "seizure",
  self_harm: "thoughts of self-harm",
  heavy_bleeding: "heavy bleeding",
  leg_red_swollen: "red, swollen leg",
  fever: "fever",
  wound: "wound not healing",
};

const CALL_911: MomSymptom[] = ["chest_pain", "trouble_breathing", "seizure", "self_harm"];
const PREECLAMPSIA_SIGNS: MomSymptom[] = ["headache", "vision", "upper_belly_pain"];
const CALL_PROVIDER: MomSymptom[] = ["heavy_bleeding", "leg_red_swollen", "fever", "wound"];

export const RANK: Record<Level, number> = { green: 0, yellow: 1, red: 2, red911: 3 };
export const worst = (levels: Level[]): Level =>
  levels.reduce<Level>((a, b) => (RANK[b] > RANK[a] ? b : a), "green");

export function checkMom(c: CheckIn, history: CheckIn[] = []): Finding[] {
  const out: Finding[] = [];
  const s = c.symptoms;
  const hit911 = s.filter((x) => CALL_911.includes(x));
  if (hit911.length) out.push({ level: "red911", who: "mom", reason: `Call 911: ${hit911.map((x) => LABEL[x]).join(", ")}` });

  const { sys, dia } = c;
  if (sys !== undefined && dia !== undefined) {
    const bp = `${sys}/${dia}`;
    const signs = s.filter((x) => PREECLAMPSIA_SIGNS.includes(x));
    if (sys >= 160 || dia >= 110) {
      out.push({ level: "red", who: "mom", reason: `Severe range ${bp}` });
    } else if ((sys >= 140 || dia >= 90) && signs.length) {
      out.push({ level: "red", who: "mom", reason: `${bp} with ${signs.map((x) => LABEL[x]).join(", ")}` });
    } else if (sys >= 150 || dia >= 100) {
      out.push({ level: "yellow", who: "mom", reason: `Above home target ${bp}` });
    }
    const prev = history.filter((h) => h.answered && h.sys !== undefined && h.day < c.day).sort((a, b) => a.day - b.day);
    const last2 = prev.slice(-2);
    if (last2.length === 2 && last2[0].sys! < last2[1].sys! && last2[1].sys! < sys && sys >= 140) {
      out.push({ level: "yellow", who: "mom", reason: `Rising 3 days in a row (${last2[0].sys} → ${last2[1].sys} → ${sys})` });
    }
  }

  const prov = s.filter((x) => CALL_PROVIDER.includes(x));
  if (prov.length) out.push({ level: "red", who: "mom", reason: `Call provider: ${prov.map((x) => LABEL[x]).join(", ")}` });
  return out;
}

export function checkBaby(b: BabyCheck | undefined, dayOfLife: number): Finding[] {
  if (!b) return [];
  const out: Finding[] = [];
  if (b.cantWake) out.push({ level: "red911", who: "baby", reason: "Call 911: baby can't wake up" });
  if (b.hardToWake) out.push({ level: "red", who: "baby", reason: "Baby hard to wake" });
  if (b.feedingPoorly) out.push({ level: "red", who: "baby", reason: "Baby feeding poorly" });
  if (b.tempF !== undefined && b.tempF >= 100.4) out.push({ level: "red", who: "baby", reason: `Baby fever ${b.tempF}°F` });
  if (b.tempF !== undefined && b.tempF < 96.8) out.push({ level: "red", who: "baby", reason: `Baby temp low ${b.tempF}°F` });
  if (b.noPee8h) out.push({ level: "red", who: "baby", reason: "Baby no pee in 8+ hours" });
  if (b.yellowSkin === "spreading") out.push({ level: "red", who: "baby", reason: "Yellow skin spreading" });
  if (b.yellowSkin === "eyes") out.push({ level: "yellow", who: "baby", reason: "Yellow eyes" });
  if (dayOfLife >= 5 && b.wetDiapers !== undefined && b.wetDiapers < 6)
    out.push({ level: "yellow", who: "baby", reason: `Only ${b.wetDiapers} wet diapers` });
  if (b.feedsPerDay !== undefined && b.feedsPerDay < 8) out.push({ level: "yellow", who: "baby", reason: `Only ${b.feedsPerDay} feeds a day` });
  return out;
}

export function evaluate(c: CheckIn, history: CheckIn[] = []): { level: Level; findings: Finding[] } {
  if (!c.answered) return { level: "yellow", findings: [{ level: "yellow", who: "mom", reason: "Missed today's call" }] };
  const findings = [...checkMom(c, history), ...checkBaby(c.baby, c.day)];
  findings.sort((a, b) => RANK[b.level] - RANK[a.level]);
  return { level: worst(findings.map((f) => f.level)), findings };
}
