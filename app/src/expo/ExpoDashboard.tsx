import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, HeartPulse, RotateCcw, ShieldAlert, Stethoscope } from "lucide-react";
import { replayExample } from "../protocols/examples";

const stages = [
  { label: "Check in", title: "Aven follows up with Maya", icon: CalendarCheck },
  { label: "Escalate", title: "Aven stops the check-in", icon: ShieldAlert },
  { label: "Hand off", title: "The care team takes over", icon: Stethoscope },
];

export default function ExpoDashboard() {
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = stages[step];
  const Icon = stage.icon;
  const routine = step === 0;
  const handoff = step === 2;
  const { patient, messages, episode } = replayExample("app", routine ? "routine" : "urgent", acknowledged);
  const shown = routine ? [messages[0], ...messages.slice(8, 11)] : messages.slice(-2);
  const task = episode.tasks[0];

  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  return (
    <main className="min-h-screen bg-[#f3f7f8] px-3 pb-12 pt-5 text-[#152a3a] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="rounded-[1.4rem] bg-gradient-to-br from-[#11283a] to-[#174a50] p-5 text-white sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-[#a9ede0]"><HeartPulse size={18} aria-hidden="true" /> AVENLYTH · Hatchathon booth demo</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">What happens after discharge?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#dbe9eb] sm:text-base">Aven checks in with a new mother, helps her get back to care, and gives the clinic a clear next step when she needs a person.</p>
          <p className="mt-4 text-xs font-semibold text-[#a9ede0]">Fictional patient · Simulated scheduling, outreach, and escalation</p>
        </header>

        <div role="group" aria-label="Booth walkthrough" className="grid grid-cols-3 gap-1 rounded-xl border border-[#dae4e8] bg-white p-1.5">
          {stages.map(({ label }, index) => (
            <button key={label} type="button" aria-pressed={step === index} onClick={() => goTo(index)}
              className={`min-h-11 rounded-lg px-1 text-center text-xs font-bold sm:text-sm ${step === index ? "bg-[#174a50] text-white" : "hover:bg-[#edf3f5]"}`}>
              {index + 1}. {label}
            </button>
          ))}
        </div>

        <section aria-labelledby="expo-stage" className="overflow-hidden rounded-[1.2rem] border border-[#dae4e8] bg-white">
          <header className="flex items-center gap-3 border-b border-[#dae4e8] p-4 sm:px-6">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${routine ? "bg-[#e4f4ef] text-[#174a50]" : "bg-[#ffeded] text-[#8b2c38]"}`}><Icon size={21} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-semibold text-[#526674]">Step {step + 1} of 3 · {patient.name}</p>
              <h2 ref={heading} tabIndex={-1} id="expo-stage" className="text-xl font-extrabold">{stage.title}</h2>
            </div>
          </header>

          <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="min-w-0 rounded-xl bg-[#f3f7f8] p-3 sm:p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#526674]">From the conversation</h3>
              <ol className="mt-3 grid gap-2 text-sm">
                {shown.map(message => (
                  <li key={message.at} className={`max-w-[95%] rounded-xl px-3 py-2.5 ${message.who === "patient" ? "justify-self-end bg-[#dcefe9]" : "justify-self-start border border-[#dae4e8] bg-white"}`}>
                    <span className="block text-xs font-bold text-[#174a50]">{message.who === "patient" ? "Maya" : "Aven"}</span>
                    <span>{message.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className={`self-start rounded-xl p-4 ${routine ? "bg-[#e7f5ef]" : "bg-[#fff0f0]"}`}>
              <h3 className="text-lg font-extrabold">{routine ? "Appointment scheduled" : handoff ? "Clinic review" : "Emergency guidance"}</h3>
              <p className="mt-2 text-sm leading-relaxed">{routine
                ? "Maya picks a time she can get a ride. Her care plan now shows an appointment. Attendance is still pending."
                : handoff
                  ? "Staff see the patient’s own words. Acknowledge the review to show who has picked it up. The case stays open."
                  : "Routine questions stop. Aven tells Maya to call 911 and the demo queues clinic review in parallel."}</p>
              {!routine && <p className="mt-2 text-xs font-semibold text-[#792935]">Simulated handoff. No call or alert is sent.</p>}
              {handoff && (
                <>
                  <p role="status" className="mt-4 flex items-center gap-1.5 text-sm font-bold">
                    {task?.state === "accepted" && <Check size={17} aria-hidden="true" />}
                    {task?.state === "accepted" ? "Staff acknowledged · case open" : "Urgent review queued · awaiting staff"}
                  </p>
                  <button type="button" disabled={acknowledged} onClick={() => setAcknowledged(true)}
                    className="mt-3 min-h-11 rounded-lg bg-[#174a50] px-3 py-2 text-sm font-bold text-white disabled:opacity-55">
                    {acknowledged ? "Acknowledged" : "Simulate staff acknowledgement"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#dae4e8] p-3 sm:px-6">
            <button type="button" onClick={() => { setAcknowledged(false); goTo(0); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold hover:bg-[#edf3f5]">
              <RotateCcw size={16} aria-hidden="true" /> Restart
            </button>
            {step > 0 && <button type="button" onClick={() => goTo(step - 1)} className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold hover:bg-[#edf3f5]"><ArrowLeft size={16} aria-hidden="true" /> Back</button>}
            {!handoff && <button type="button" onClick={() => goTo(step + 1)} className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#174a50] px-3 text-sm font-bold text-white ${step === 0 ? "ml-auto" : ""}`}>
              {routine ? "Show escalation" : "Show clinic handoff"} <ArrowRight size={16} aria-hidden="true" />
            </button>}
          </div>
        </section>

        <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#174a50]">
          <a className="rounded-lg border border-[#dae4e8] bg-white px-3 py-2.5 hover:underline" href="#protocols">Full call, text &amp; chat examples</a>
          <a className="rounded-lg border border-[#dae4e8] bg-white px-3 py-2.5 hover:underline" href="#episodes">Try the interactive Care Loops</a>
          <a className="rounded-lg border border-[#dae4e8] bg-white px-3 py-2.5 hover:underline" href="#reports">See demo reporting</a>
        </div>
        <details className="rounded-xl border border-[#dae4e8] bg-white p-4 text-sm">
          <summary className="cursor-pointer font-bold">Booth talking points</summary>
          <p className="mt-3 leading-relaxed">“We’re building AVENLYTH for the gap between leaving the hospital and getting back to care. Aven checks in by phone, text, or the portal. Here, it helps Maya find a time she can actually make. If she reports an emergency, it stops the check-in, tells her to get immediate help, and gives the clinic her exact words. The clinic can see what’s scheduled, what needs review, and what still needs verification.”</p>
          <p className="mt-3 text-[#526674]">This booth demo uses fictional patients and scripted replies. A pilot would measure follow-up attendance, time to staff acknowledgement, and staff workload.</p>
        </details>
      </div>
    </main>
  );
}
