import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, ChevronDown, HeartPulse, MessageCircle, RotateCcw, ShieldAlert, Stethoscope } from "lucide-react";
import { replayExample } from "../protocols/examples";
import "./expo.css";

const stages = [
  { label: "Check in", title: "Aven helps Maya book follow-up", icon: CalendarCheck },
  { label: "Escalate", title: "Aven stops the routine check-in", icon: ShieldAlert },
  { label: "Hand off", title: "The clinic picks up the case", icon: Stethoscope },
] as const;

const appointmentTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
});

export default function ExpoDashboard() {
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = stages[step];
  const Icon = stage.icon;
  const routine = step === 0;
  const handoff = step === 2;
  const { patient, messages, episode } = replayExample("app", routine ? "routine" : "urgent", acknowledged);
  const task = episode.tasks[0];
  const accepted = task?.state === "accepted";
  const excerpt = routine ? [messages[0], ...messages.slice(8, 11)] : messages.slice(-2);

  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }

  function restart() {
    setAcknowledged(false);
    goTo(0);
  }

  return (
    <main className="expo-page">
      <div className="expo-shell">
        <header className="expo-masthead">
          <div>
            <p className="expo-kicker"><HeartPulse size={16} aria-hidden="true" /> AVENLYTH · Hatchathon Expo</p>
            <h1>What happens after discharge?</h1>
            <p className="expo-intro">Follow Maya from a check-in with Aven to a clinic handoff.</p>
          </div>
          <span className="expo-badge">Fictional patient · Simulated care</span>
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
            <span className="expo-stage-icon" data-urgent={!routine}><Icon size={21} aria-hidden="true" /></span>
            <div>
              <p className="expo-eyebrow">Step {step + 1} of {stages.length} · {patient.name}</p>
              <h2 ref={heading} tabIndex={-1} id="expo-stage">{stage.title}</h2>
            </div>
            <button type="button" className="expo-restart" onClick={restart}><RotateCcw size={16} aria-hidden="true" /> <span>Restart demo</span></button>
          </header>

          <div className="expo-stage-grid">
            <div className="expo-outcome" data-urgent={!routine}>
              <p className="expo-eyebrow">{routine ? "What changed" : handoff ? "Staff worklist" : "Emergency guidance"}</p>
              <h3>{routine ? "Appointment scheduled" : handoff ? "Urgent clinic review" : "Call 911 now"}</h3>
              <div className="expo-actions">
                {handoff ? (
                  <button type="button" className="expo-primary" aria-disabled={accepted} onClick={() => { if (!accepted) setAcknowledged(true); }}>
                    {accepted ? "Acknowledgement recorded" : "Simulate staff acknowledgement"}
                    {accepted && <Check size={17} aria-hidden="true" />}
                  </button>
                ) : (
                  <button type="button" className="expo-primary" onClick={() => goTo(step + 1)}>
                    {routine ? "Show escalation" : "Show clinic handoff"} <ArrowRight size={17} aria-hidden="true" />
                  </button>
                )}
                {step > 0 && <button type="button" className="expo-back" onClick={() => goTo(step - 1)}><ArrowLeft size={16} aria-hidden="true" /> Back</button>}
              </div>

              {routine ? (
                <>
                  {episode.scheduledAt && <p className="expo-detail"><time dateTime={episode.scheduledAt}>{appointmentTime.format(new Date(episode.scheduledAt))}</time></p>}
                  <p>Maya picks a time she can get a ride. The appointment is on her care plan, and attendance is pending.</p>
                </>
              ) : handoff ? (
                <>
                  <p>Staff get Maya’s exact words and the context for the handoff. The case stays open after acknowledgement.</p>
                  <p role="status" className="expo-detail">{accepted && <Check size={17} aria-hidden="true" />}{accepted ? "Staff acknowledged · case open" : "Urgent review queued · awaiting staff"}</p>
                </>
              ) : (
                <p>Aven stops asking routine questions and tells Maya to call 911. A clinic review is queued in parallel.</p>
              )}
              {!routine && <p className="expo-simulation">Simulation only. No call or clinic alert is sent.</p>}

            </div>

            <div className="expo-transcript">
              <h3><MessageCircle size={16} aria-hidden="true" /> {handoff ? "Conversation attached to review" : "Conversation excerpt"}</h3>
              <ol>
                {excerpt.map(message => (
                  <li key={message.at} data-speaker={message.who}>
                    <strong>{message.who === "patient" ? "Maya" : "Aven"}</strong>
                    <p>{message.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <div className="expo-footer">
          <nav aria-label="Explore AVENLYTH">
            <a href="#protocols">Full call, text &amp; chat examples</a>
            <a href="#episodes">Interactive Care Loops</a>
            <a href="#reports">Demo reporting</a>
          </nav>
          <details>
            <summary>Booth talking points <ChevronDown size={16} aria-hidden="true" /></summary>
            <p>After discharge, the clinic needs to know who made it back to care and who still needs help. Aven checks in by phone, text, or the portal. Here, Maya picks a time she can get a ride. When she reports an emergency, Aven stops the check-in and the clinic receives her exact words in the demo handoff.</p>
          </details>
        </div>
      </div>
    </main>
  );
}
