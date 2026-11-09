import { useState } from "react";
import { AlertTriangle, Baby, CalendarDays, Droplets, HeartPulse, LifeBuoy, PhoneCall, Siren, Thermometer, Utensils } from "lucide-react";
import { status, type Mom } from "../data/moms";
import { useCare } from "../data/workflow";
import type { Level } from "../lib/rules";
import { BPChart, Card } from "../ui/parts";

const MOM_TEXT: Record<Level, { title: string; body: string }> = {
  red911: { title: "Urgent scenario concern", body: "This synthetic scenario requires an urgent human review pathway. No emergency response has been dispatched by this demo." },
  red: { title: "Urgent clinician review needed", body: "A reported concern needs urgent clinical assessment. This demo does not notify a nurse or place a call." },
  yellow: { title: "Your care plan needs review", body: "A reported concern or care gap needs review. In this demo, no nurse notification is sent." },
  green: { title: "You're on track today", body: "No flagged concern is recorded in this demo today. Follow the individual care plan; this is not a medical clearance." },
};

export default function MomDashboard() {
  const { moms: MOMS, state } = useCare();
  const [momId, setMomId] = useState("m1");
  const mom = MOMS.find((m) => m.id === momId)!;
  const s = status(mom);
  const t = s.today;
  const first = mom.name.split(" ")[0];
  const tone =
    s.level === "green" ? "bg-green-soft ring-green/25 text-green" : s.level === "yellow" ? "bg-amber-soft ring-amber/30 text-amber" : "bg-red text-white ring-red";

  return (
    <main className="min-h-screen bg-ground text-ink">
      <div className="mx-auto flex max-w-[440px] flex-col gap-4 px-4 pb-12 pt-16">
        <label className="flex items-center justify-between gap-2 text-xs text-body">
          <span>Demo: viewing as</span>
          <select id="mom-pick" value={momId} onChange={(e) => setMomId(e.target.value)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy">
            {MOMS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-navy to-navy-900 p-6 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-2xl" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">Day {mom.dayToday} of 10 at home</span>
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight">Hi {first}, here's how you and your baby are doing.</h1>
          <div className="mt-5 flex gap-1.5" aria-label={`Day ${mom.dayToday} of 10`}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < mom.dayToday ? "bg-gold" : "bg-white/15"}`} />
            ))}
          </div>
        </section>

        {/* Today */}
        <section className={`rounded-card p-5 ring-1 ${tone}`}>
          <div className="flex items-start gap-3">
            {s.level === "green" ? <HeartPulse className="mt-0.5 shrink-0" /> : <AlertTriangle className="mt-0.5 shrink-0" />}
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-extrabold leading-snug">{MOM_TEXT[s.level].title}</h2>
              <p className={`text-[15px] ${s.level.startsWith("red") ? "text-white/90" : "text-ink"}`}>{MOM_TEXT[s.level].body}</p>
            </div>
          </div>
          {s.level.startsWith("red") && (
            <div className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-sm">
              <div className="font-bold">Demo care routing</div>
              <div className="text-white/90">No real emergency routing or location service is connected.</div>
            </div>
          )}
        </section>

        <Card className="p-5"><h2 className="font-bold">Your care pathway: {mom.useCase}</h2>
          <p className="mt-2 text-sm">{mom.diagnosis}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">{state.tasks.filter(t=>t.patientId===mom.id).map(t=><li key={t.id}>{t.title} · {t.completed ? "completed" : t.source === "doctor" && !t.acceptedAt ? `awaiting care-team acceptance · due day ${t.dueDay}` : t.acceptedAt ? `accepted by care team · due day ${t.dueDay}` : `due postpartum day ${t.dueDay}`}</li>)}</ul>
        </Card>
        {/* Reading */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-navy">Today's blood pressure</span>
            <span className="text-xs text-body">{t?.answered ? `Call at ${t.time}` : "Missed call"}</span>
          </div>
          {t?.answered ? (
            <>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tabular-nums tracking-tight">{t.sys}<span className="text-body">/</span>{t.dia}</span>
              </div>
              <p className="mt-1 text-sm text-body">Synthetic reading for demonstration; individual targets require a clinician.</p>
            </>
          ) : (
            <p className="mt-2 text-[15px]">We couldn't reach you today. Please check your blood pressure and call us back at <b>(601) 555-0100</b>.</p>
          )}
          <div className="mt-4 -mx-1"><BPChart calls={mom.calls} height={200} /></div>
        </Card>

        {/* Baby */}
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-navy"><Baby size={16} /> {mom.baby.name}</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <BabyStat icon={<Utensils size={16} />} label="Feeds today" value={t?.baby?.feedsPerDay ?? "–"} goal="Goal 8–12" />
            <BabyStat icon={<Droplets size={16} />} label="Wet diapers" value={t?.baby?.wetDiapers ?? "–"} goal={mom.dayToday >= 5 ? "Goal 6+" : "Goal 3+"} />
            <BabyStat icon={<Thermometer size={16} />} label="Temperature" value={t?.baby?.tempF ? `${t.baby.tempF}°` : "–"} goal="Fever 100.4°" />
          </div>
          <p className="mt-3 text-[13px] text-body">Always put your baby to sleep on their back, alone, in a crib or bassinet.</p>
        </Card>

        {/* Warning signs */}
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-red"><Siren size={16} /> Call 911 if you have</div>
          <p className="mt-2 text-[15px]">Chest pain · trouble breathing · a seizure · thoughts of hurting yourself or your baby.</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-navy"><PhoneCall size={16} /> Call your doctor if you have</div>
          <p className="mt-2 text-[15px]">A headache that won't go away · blurry vision · bleeding through 1 pad an hour · a red, swollen leg · fever 100.4°F or more.</p>
          <p className="mt-3 text-xs text-body">From the POST-BIRTH warning signs.</p>
        </Card>

        {/* Care team */}
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-navy"><LifeBuoy size={16} /> Your care team</div>
          <div className="mt-3 flex flex-col gap-3 text-[15px]">
            <div className="flex items-center justify-between"><span>Nurse Taylor, Forrest General</span><span className="font-semibold tabular-nums">(601) 555-0100</span></div>
            <div className="flex items-center justify-between"><span>Next call</span><span className="font-semibold">{mom.dayToday >= 10 ? "Ten-day demo plan ended" : "Demo cadence: next day, 9 AM"}</span></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><CalendarDays size={15} /> Next visit</span><span className="font-semibold text-right">{mom.visit}</span></div>
            <div className="flex items-center justify-between"><span>Medicine</span><span className="font-semibold text-right">{mom.meds.join(", ") || "None"}</span></div>
          </div>
        </Card>
      </div>

    </main>
  );
}

function BabyStat({ icon, label, value, goal }: { icon: React.ReactNode; label: string; value: string | number; goal: string }) {
  return (
    <div className="rounded-xl bg-ground px-2 py-3">
      <div className="flex justify-center text-navy/70">{icon}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-[11px] font-semibold text-ink">{label}</div>
      <div className="text-[11px] text-body">{goal}</div>
    </div>
  );
}

export type { Mom };

