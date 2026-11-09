// Maya Walker: a made-up patient with a full sample health record, from pregnancy to discharge.
// No real person. Used for the Expo demo and the live AI call.
import type { CallPatient, Check } from "./callPatient";

export type Report = { date: string; title: string; author: string; lines: string[] };

export const MAYA_REPORTS: Report[] = [
  {
    date: "May 12, 2026", title: "First prenatal visit (10 weeks)", author: "Dr. Angela Price, OB-GYN, Forrest General Women's Clinic",
    lines: [
      "Maya Walker, 29. Second pregnancy (one prior vaginal birth, 2022, no problems).",
      "Blood type O positive. Rubella immune. HIV, hepatitis B, syphilis negative.",
      "BP 118/74. BMI 31. No chronic conditions. Takes a prenatal vitamin.",
      "Social: works at a daycare, one child age 4, partner works night shifts. One car, shared.",
    ],
  },
  {
    date: "Jul 21, 2026", title: "Prenatal visit (20 weeks) and anatomy scan", author: "Dr. Angela Price",
    lines: ["Normal anatomy scan. Baby girl. BP 120/78.", "Advised daily walks and iron-rich foods."],
  },
  {
    date: "Aug 25, 2026", title: "Prenatal visit (28 weeks) and labs", author: "Dr. Angela Price",
    lines: [
      "Glucose test normal (no gestational diabetes).",
      "Hemoglobin 10.4 (mild anemia). Started ferrous sulfate 325 mg daily.",
      "BP 124/80. Tdap vaccine given.",
    ],
  },
  {
    date: "Oct 13, 2026", title: "Prenatal visit (35 weeks)", author: "Dr. Angela Price",
    lines: ["Group B strep test negative.", "BP 132/84. Mild ankle swelling. No headache. Told the warning signs of preeclampsia."],
  },
  {
    date: "Oct 27, 2026", title: "Prenatal visit (37 weeks)", author: "Dr. Angela Price",
    lines: [
      "BP 142/90 and 140/92, fifteen minutes apart. Urine protein negative. Labs normal.",
      "Diagnosis: gestational hypertension. Twice-weekly BP checks until delivery.",
    ],
  },
  {
    date: "Nov 3, 2026", title: "Labor and delivery summary", author: "Dr. Marcus Hill, Labor and Delivery",
    lines: [
      "Vaginal birth at 39 weeks 1 day. Baby girl Ava, 7 lb 2 oz. Apgar 8 and 9.",
      "Second-degree perineal tear, repaired with dissolving stitches.",
      "Blood loss 450 mL. Highest BP in labor 148/94.",
    ],
  },
  {
    date: "Nov 4, 2026", title: "Postpartum hospital note", author: "Dr. Angela Price",
    lines: [
      "BP 144/92 on day 1. Started labetalol 200 mg twice daily. BP 136/86 after.",
      "Hemoglobin 9.6. Continue iron. Breastfeeding, latch improving with lactation help.",
      "Mood good. Edinburgh depression screen score 6 (low).",
    ],
  },
  {
    date: "Nov 5, 2026", title: "Discharge summary and doctor's orders", author: "Dr. Angela Price",
    lines: [
      "Discharged home on postpartum day 2.",
      "Medicines: labetalol 200 mg twice daily; ferrous sulfate 325 mg daily; ibuprofen 600 mg every 6 hours as needed for pain; docusate 100 mg twice daily; prenatal vitamin daily.",
      "Daily check-in calls for 10 days. Check: medicines taken, home BP, belly pain, vaginal discharge and bleeding, stitches, fever, breastfeeding, mood, and baby feeding.",
      "Call the nurse right away if: BP 160/110 or higher; BP 140/90 or higher with headache, vision changes, or upper belly pain; fever 100.4 or higher; foul-smelling discharge; soaking a pad in an hour; thoughts of self-harm.",
      "Follow-up: BP check Nov 10 at the women's clinic. 6-week visit Dec 15. Maya said childcare and the shared car may make visits hard.",
    ],
  },
];

/** The discharge orders, turned into the exact things the AI must check on the call. */
export const MAYA_CHECKS: Check[] = [
  { id: "meds", label: "Medicines taken", question: "Have you been taking your labetalol twice a day and your iron pill every day? Any missed doses?", concernIf: "missed labetalol doses or stopped any medicine" },
  { id: "bp", label: "Home blood pressure", question: "Could you take your blood pressure now and tell me the numbers?", concernIf: "150/100 or higher, or any reading 140/90+ with headache, vision change, or upper belly pain" },
  { id: "headache_vision", label: "Headache or vision", question: "Any headache that won't go away, or blurry vision or spots?", concernIf: "yes to either" },
  { id: "abdominal_pain", label: "Belly pain", question: "Any pain in your belly, especially up high on the right side under your ribs? Is it getting worse?", concernIf: "upper right belly pain, or pain getting worse" },
  { id: "discharge", label: "Vaginal discharge and bleeding", question: "How's your bleeding and discharge? What color is it, any bad smell, big clots, or soaking a pad in an hour?", concernIf: "foul smell, soaking a pad in an hour, or clots bigger than a golf ball" },
  { id: "stitches", label: "Stitches", question: "How are your stitches feeling? Any swelling, redness, or pus?", concernIf: "redness, swelling, pus, or pain getting worse" },
  { id: "fever", label: "Fever", question: "Have you had a fever or chills? Did you check your temperature?", concernIf: "100.4 or higher, or chills" },
  { id: "breastfeeding", label: "Breastfeeding", question: "How's breastfeeding going? Any breast that's red, hard, or painful?", concernIf: "red, hard, painful breast, especially with fever" },
  { id: "mood", label: "Mood and sleep", question: "How are you feeling in yourself, mood-wise? Feeling down, really anxious, or not able to sleep even when the baby sleeps?", concernIf: "feeling down most days, anxious, or any thoughts of hurting herself or the baby" },
  { id: "baby", label: "Baby Ava", question: "How's Ava doing? How many feeds and wet diapers in the last day? Any yellow skin?", concernIf: "fewer than 8 feeds, fewer than 6 wet diapers, yellow skin spreading, or hard to wake" },
  { id: "followup", label: "BP check on Nov 10", question: "Your blood pressure check is on November 10. Are you able to make it? Do you have a ride and someone to watch the kids?", concernIf: "no ride or no childcare, so she may miss the visit" },
];

export const MAYA: CallPatient = {
  id: "maya",
  name: "Maya Walker",
  babyName: "Ava",
  day: 6,
  file: MAYA_REPORTS.map((r) => `${r.date} · ${r.title} (${r.author})\n${r.lines.map((l) => `- ${l}`).join("\n")}`).join("\n\n"),
  checks: MAYA_CHECKS,
};
