import { useState } from "react";
import { AlertTriangle, Baby, CalendarDays, Droplets, HeartPulse, Home, LifeBuoy, Phone, PhoneCall, Siren, Thermometer, Utensils } from "lucide-react";
import { MOMS, status, type Mom } from "../data/moms";
import type { Level } from "../lib/rules";
import { BPChart, Card } from "../ui/parts";

const MOM_TEXT: Record<Level, { title: string; body: string }> = {
  red911: { title: "Call 911 now", body: "What you told us today can be an emergency. Call 911 and say: \"I gave birth on November 3.\"" },
  red: { title: "Go to the ER or call your doctor now", body: "Your blood pressure is in the danger range. Your nurse has been told and will call you. Don't wait." },
  yellow: { title: "Your nurse will check on you today", body: "Your numbers are a little high. Keep taking your medicine. Your nurse has been told." },
  green: { title: "You're on track today", body: "Your numbers look good. Keep checking every day. We'll call you tomorrow at 9 AM." },
};

export default function MomDashboard() {
  const [momId, setMomId] = useState("m1");
  const mom = MOMS.find((m) => m.id === momId)!;
  const s = status(mom);
  const t = s.today;
  const first = mom.name.split(" ")[0];
  const tone =
    s.level === "green" ? "bg-green-soft ring-green/25 text-green" : s.level === "yellow" ? "bg-amber-soft ring-amber/30 text-amber" : "bg-red text-white ring-red";

  return (
    <div className="min-h-screen bg-ground text-ink">
      <div className="mx-auto flex max-w-[440px] flex-col gap-4 px-4 pb-28 pt-16">
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
              <div className="font-bold">Nearest ER</div>
              <div className="text-white/90">Forrest General Hospital, 6051 US-49, Hattiesburg</div>
            </div>
          )}
        </section>

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
              <p className="mt-1 text-sm text-body">Your goal at home: under 150/100.</p>
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
            <div className="flex items-center justify-between"><span>Next call</span><span className="font-semibold">Tomorrow, 9:00 AM</span></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><CalendarDays size={15} /> Next visit</span><span className="font-semibold text-right">{mom.visit}</span></div>
            <div className="flex items-center justify-between"><span>Medicine</span><span className="font-semibold text-right">{mom.meds.join(", ") || "None"}</span></div>
          </div>
        </Card>
      </div>

      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-white/60 bg-white/75 p-1.5 shadow-[0_8px_28px_rgba(10,42,77,0.14)] backdrop-blur-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"><Home size={15} /> Today</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-navy"><Baby size={15} /> Baby</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-navy"><Phone size={15} /> Help</span>
      </nav>
    </div>
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
