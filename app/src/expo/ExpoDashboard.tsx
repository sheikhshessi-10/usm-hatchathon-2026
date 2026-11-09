import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, HeartPulse, Lightbulb, PhoneCall, RotateCcw, Stethoscope, TriangleAlert, UserRound } from "lucide-react";
import { MOMS, status, LEVEL_TEXT } from "../data/moms";
import { BPChart, Card, Pill } from "../ui/parts";
import { LiveCall } from "../nurse/LiveCall";
import { CallKpis } from "../nurse/CallKpis";
import "./expo.css";

// One patient, start to finish. The whole 2:45 pitch runs on this page, in script order.
const keisha = MOMS.find((m) => m.id === "m1")!;
const first = keisha.name.split(" ")[0];

const stages = [
  { label: "Problem", time: "0:00", title: "Who checks on her after she goes home?", icon: TriangleAlert },
  { label: "Solution", time: "0:30", title: "Avenlyth, with Aven, our care companion", icon: UserRound },
  { label: "Live call", time: "0:55", title: `Aven calls ${first} right now`, icon: PhoneCall },
  { label: "Handoff", time: "1:20", title: "Her care team sees what she said and why", icon: Stethoscope },
  { label: "Innovation", time: "1:35", title: "We track what happens after the call", icon: Lightbulb },
  { label: "Business", time: "2:00", title: "Affordable follow-up at scale", icon: BarChart3 },
  { label: "Close", time: "2:25", title: "Care doesn't end at discharge.", icon: HeartPulse },
] as const;

const PROBLEM: [string, string][] = [
  ["85.7%", "of pregnancy-related deaths reviewed were preventable (CDC). Gaps in continuity of care were a contributing factor."],
  ["Days 3–6", "when blood pressure after birth peaks, after she is already home"],
  ["50–70%", "of moms miss the 7 to 10 day blood pressure check"],
];

const INNOVATION: [string, string][] = [
  ["Patient-specific memory", "Every call uses her history: medicines, readings, what she said yesterday."],
  ["Protocol safety checks", "Danger signs trigger the urgent pathway by fixed rules. The AI never diagnoses."],
  ["Clinician handoffs", "Urgent cases go to a named person with the full context."],
  ["Evidence-verified follow-up", "\"I did my test\" doesn't close her case. Closing needs evidence and a clinician."],
];

const BUSINESS: [string, string][] = [
  ["~$7,700", "average pregnancy-related readmission (AHRQ, 2020)"],
  ["$20", "per enrolled patient per month, hospital subscription"],
  ["$2–5", "estimated automated communication cost per patient per month"],
];

function Stat({ n, t }: { n: string; t: string }) {
  return <Card className="p-5"><div className="text-3xl font-extrabold text-navy">{n}</div><p className="mt-1 text-sm text-body">{t}</p></Card>;
}

export default function ExpoDashboard() {
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = stages[step];
  const Icon = stage.icon;
  const s = status(keisha);
  const last = stages.length - 1;

  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }

  return (
    <main className="expo-page">
      <div className="expo-shell">
        <header className="expo-masthead">
          <div>
            <p className="expo-kicker"><HeartPulse size={16} aria-hidden="true" /> AVENLYTH · Hatchathon Expo</p>
            <h1>What happens after discharge?</h1>
            <p className="expo-intro">Follow {keisha.name} from discharge to a live AI check-in call to her care team.</p>
          </div>
          <span className="expo-badge">Fictional patient · Real AI phone call</span>
        </header>

        <nav aria-label="Demo steps" className="expo-steps">
          {stages.map(({ label }, index) => (
            <button key={label} type="button" aria-current={step === index ? "step" : undefined} onClick={() => goTo(index)}>
              <span aria-hidden="true">{index + 1}</span>{label}
            </button>
          ))}
        </nav>

        <section aria-labelledby="expo-stage" className="expo-stage">
          <header className="expo-stage-header">
            <span className="expo-stage-icon" data-urgent={step === 2 || step === 3}><Icon size={21} aria-hidden="true" /></span>
            <div>
              <p className="expo-eyebrow">Step {step + 1} of {stages.length} · {stage.time} · {keisha.name}</p>
              <h2 ref={heading} tabIndex={-1} id="expo-stage">{stage.title}</h2>
            </div>
            <button type="button" className="expo-restart" onClick={() => goTo(0)}><RotateCcw size={16} aria-hidden="true" /> <span>Restart demo</span></button>
          </header>

          <div className="flex flex-col gap-4">
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {PROBLEM.map(([n, t]) => <Stat key={n} n={n} t={t} />)}
                <p className="text-sm text-body sm:col-span-3">She goes home with medicine to take, symptoms to watch, and a follow-up to attend. Between discharge and that visit, nobody is reliably checking on her.</p>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                  <p className="expo-eyebrow">Aven reaches out, by phone or text</p>
                  <p className="mt-2 text-lg font-semibold">"Hey {first}, just checking in! Did you take your blood pressure medicine today? And how is that headache?"</p>
                  <p className="mt-3 text-sm text-body">No app, no portal login. Works on a flip phone. Aven uses her record to make every call personal.</p>
                </Card>
                <Card className="p-5">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{keisha.name}, {keisha.age}</h3><Pill level={s.level}>{LEVEL_TEXT[s.level]}</Pill></div>
                  <p className="text-sm text-body">{keisha.diagnosis} · {keisha.delivery} · day {keisha.dayToday} at home · {keisha.county} County · {keisha.phoneType}</p>
                  <BPChart calls={keisha.calls} height={180} />
                </Card>
              </div>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-body">Load {first}'s file, press the gold button, and the AI calls the demo phone. Answer as {first}: "166 over 112, and I have a bad headache." The conversation and the rules result appear here live.</p>
                <LiveCall mom={keisha} />
              </>
            )}

            {step === 3 && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                  <p className="expo-eyebrow">Nurse worklist</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{keisha.name}</h3><Pill level={s.level}>{LEVEL_TEXT[s.level]}</Pill></div>
                  <ul className="mt-2 list-disc pl-5 text-sm">{s.findings.map((f, i) => <li key={i}>{f.who === "baby" ? "Baby: " : ""}{f.reason}</li>)}</ul>
                  <p className="mt-3 text-sm text-body">Aven stops the routine check-in and escalates to the nurse. Fixed medical rules (SMFM, Mississippi toolkit, POST-BIRTH, AAP) decide urgency, not the AI.</p>
                  <a href="#nurse/m1" className="mt-3 inline-block text-sm font-bold text-navy underline">Open {first} in the nurse screen</a>
                </Card>
                <Card className="p-5">
                  <p className="expo-eyebrow">Doctor</p>
                  <h3 className="text-lg font-extrabold">One record for the whole team</h3>
                  <p className="mt-2 text-sm text-body">The doctor sees her exact words, the trend, the reason for escalation, and what still needs human review.</p>
                  <a href="#doctor/m1" className="mt-3 inline-block text-sm font-bold text-navy underline">Open {first} in the doctor screen</a>
                  <a href="#mom" className="mt-2 block text-sm font-bold text-navy underline">See {first}'s own page</a>
                </Card>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {INNOVATION.map(([h, t]) => <Card key={h} className="p-5"><h3 className="font-bold">{h}</h3><p className="mt-1 text-sm text-body">{t}</p></Card>)}
                <p className="text-sm text-body sm:col-span-2">Built and tested: 15 synthetic maternal journeys, care-loop scenarios, and live AI phone calls. Next: hospital record integration. <a href="#episodes" className="font-bold text-navy underline">Try the care loops</a> · <a href="#protocols" className="font-bold text-navy underline">Call, text and chat examples</a></p>
              </div>
            )}

            {step === 5 && (
              <>
                <div className="grid gap-3 sm:grid-cols-3">{BUSINESS.map(([n, t]) => <Stat key={n} n={n} t={t} />)}</div>
                <CallKpis />
                <a href="#reports" className="text-sm font-bold text-navy underline">Open full reports</a>
              </>
            )}

            {step === 6 && (
              <Card className="p-6">
                <p className="text-lg">Next: a clinician-supervised pilot, starting with postpartum care. Then chronic disease, surgical recovery, and anyone who needs support between visits.</p>
                <p className="mt-4 text-2xl font-extrabold text-navy">We're not replacing doctors. We're making sure patients don't disappear between appointments.</p>
                <p className="mt-4 text-3xl font-extrabold">Avenlyth. Care doesn't end at discharge.</p>
              </Card>
            )}

            <div className="expo-actions">
              {step < last && <button type="button" className="expo-primary" onClick={() => goTo(step + 1)}>Next: {stages[step + 1].label} <ArrowRight size={17} aria-hidden="true" /></button>}
              {step > 0 && <button type="button" className="expo-back" onClick={() => goTo(step - 1)}><ArrowLeft size={16} aria-hidden="true" /> Back</button>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
