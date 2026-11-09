import { useState } from "react";
import {
  ArrowRight, Bot, CheckCircle2, ChevronDown, ClipboardList, HeartPulse,
  LockKeyhole, MessageCircle, Phone, Send, ShieldAlert,
} from "lucide-react";
import { PROTOCOLS, type Channel } from "../episodes/engine";
import { channels, replayExample, type Scenario } from "./examples";
import "./protocols.css";

const icons = { voice: Phone, sms: MessageCircle, app: Bot };
const time = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", second: "2-digit" });

export default function ProtocolsDashboard() {
  const [scenario, setScenario] = useState<Scenario>("routine");
  const [acknowledged, setAcknowledged] = useState<Channel[]>([]);
  const urgent = scenario === "urgent";

  function choose(next: Scenario) {
    if (next === scenario) return;
    setAcknowledged([]);
    setScenario(next);
  }

  return (
    <main className="protocol-page">
      <div className="protocol-shell">
        <header className="protocol-hero">
          <div>
            <p className="protocol-kicker"><HeartPulse size={17} aria-hidden="true" /> AVENLYTH · Outreach demo</p>
            <h1>Outreach &amp; escalation</h1>
            <p>Follow one fictional postpartum check-in across phone, text, and Aven. Switch scenarios to see what changes when a patient reports an urgent warning sign.</p>
          </div>
          <a href="#episodes">Open Care Loops <ArrowRight size={16} aria-hidden="true" /></a>
        </header>

        <section className="protocol-switcher" aria-labelledby="scenario-title">
          <div>
            <h2 id="scenario-title">Choose a scenario</h2>
            <p>Each channel replays the same care episode independently.</p>
          </div>
          <div role="group" aria-label="Example scenario" className="protocol-segment">
            <button aria-pressed={!urgent} onClick={() => choose("routine")}><CheckCircle2 size={17} aria-hidden="true" /> Routine tracking</button>
            <button aria-pressed={urgent} onClick={() => choose("urgent")}><ShieldAlert size={17} aria-hidden="true" /> Urgent escalation</button>
          </div>
        </section>

        <section className={`protocol-path${urgent ? " protocol-path--urgent" : ""}`} aria-labelledby="path-title">
          <div className="protocol-path-heading">
            {urgent ? <ShieldAlert size={23} aria-hidden="true" /> : <ClipboardList size={23} aria-hidden="true" />}
            <div>
              <h2 id="path-title">{urgent ? "Stop the routine check-in" : "Check in and find a time that works"}</h2>
              <p>{urgent ? "In this sample, the patient reports chest pain and trouble breathing. Aven stops the check-in and tells Maya to call 911 right away. The demo queues staff review in parallel." : "Maya talks through her prescribed medicine, how her pain has changed, and when she can come in. The sample appointment is booked while follow-up stays open."}</p>
            </div>
          </div>
          <ol>
            {(urgent ? ["Warning sign reported", "Tell patient to call 911", "Flag clinic in parallel", "Staff acknowledges"] : ["Consent and identity", "Medication and pain check", "Agree on a time", "Attendance pending"]).map((label, index) =>
              <li key={label}><span>{index + 1}</span>{label}</li>
            )}
          </ol>
          {urgent && <p className="protocol-safety">Demo only. The 911 preview shows what to say and places no call. The clinic alert is simulated. <a href="https://www.911.gov/calling-911/frequently-asked-questions/">911.gov guidance</a></p>}
          {urgent && <details className="protocol-escalation-details">
            <summary>What the receiving team needs</summary>
            <p>The clinic handoff should carry the patient’s exact words, the channel, the time, and the receiving role. If the patient can’t call and a staff member needs to reach dispatch, the staff workflow must confirm the patient’s current location and callback number and use the right dispatch center. The case stays open until the clinic documents what happened.</p>
          </details>}
        </section>

        <div className="protocol-channels">
          {channels.map(channel => {
            const result = replayExample(channel.id, scenario, acknowledged.includes(channel.id));
            const Icon = icons[channel.id];
            const task = result.episode.tasks[0];
            const accepted = task?.state === "accepted";
            const headingId = `protocol-${channel.id}`;
            return (
              <section key={channel.id} className="protocol-channel" aria-labelledby={headingId}>
                <header className="protocol-channel-header">
                  <span><Icon size={21} aria-hidden="true" /></span>
                  <div><h2 id={headingId}>{channel.title}</h2><p>{channel.subtitle}</p></div>
                </header>
                {urgent && channel.id === "app" && (
                  <details className="protocol-emergency-call">
                    <summary><Phone size={18} aria-hidden="true" /> Call 911 <span>Simulation</span></summary>
                    <div>
                      <p><strong>Demo preview. No call placed.</strong></p>
                      <p>Tell the dispatcher where you are, the number they can call back, and what’s happening. If you can’t call, text 911 where it’s supported.</p>
                    </div>
                  </details>
                )}
                <div className={`protocol-conversation protocol-conversation--${channel.id}`}>
                  <div className="protocol-conversation-bar">
                    <Icon size={17} aria-hidden="true" />
                    <div><strong>{channel.id === "voice" ? result.patient.name : "Aven"}</strong><small>{channel.id === "voice" ? "Simulated outbound call" : channel.id === "sms" ? "Simulated text thread" : "Simulated portal chat"}</small></div>
                  </div>
                  <p className="protocol-chat-meta"><LockKeyhole size={12} aria-hidden="true" /> Demo consent and identity confirmed</p>
                  <ol className="protocol-messages" tabIndex={0} aria-label={`${channel.title} sample conversation`}>
                    {result.messages.map((message, index) => (
                      <li key={index} data-speaker={message.who}>
                        <span className="protocol-speaker">{message.who === "patient" ? result.patient.name : "Aven"}{channel.id === "voice" && <> · <time dateTime={message.at}>{time.format(new Date(message.at))}</time></>}</span>
                        <p>{message.text}</p>
                      </li>
                    ))}
                  </ol>
                  {channel.id !== "voice" && <div className="protocol-compose" aria-hidden="true">
                    <span>{channel.id === "sms" ? "Text message" : "Message Aven"} · preview</span><Send size={15} />
                  </div>}
                </div>
                <div className="protocol-result" data-urgent={urgent}>
                  <p className="protocol-result-label">{urgent ? "Escalation protocol" : "Tracking protocol"}</p>
                  <p className="protocol-result-status" role="status">
                    {urgent ? accepted ? "Staff acknowledged · case open" : "Urgent review queued · awaiting staff" : "Appointment scheduled · attendance pending"}
                  </p>
                  {urgent && (
                    <>
                      <p className="protocol-owner">Patient told to call 911. Clinic review runs in parallel.</p>
                      <p className="protocol-owner">Receiving role: Demo care coordinator</p>
                      <button disabled={accepted} onClick={() => setAcknowledged(current => current.includes(channel.id) ? current : [...current, channel.id])}>
                        {accepted ? "Acknowledgement recorded" : "Simulate staff acknowledgement"}
                      </button>
                    </>
                  )}
                </div>
                <details className="protocol-rules">
                  <summary>Channel protocol <ChevronDown size={17} aria-hidden="true" /></summary>
                  <ul>{channel.protocol.map(rule => <li key={rule}>{rule}</li>)}</ul>
                </details>
              </section>
            );
          })}
        </div>

        <footer className="protocol-footer">
          <strong>Demo protocol {PROTOCOLS[0].version}</strong>
          <p>These scripts illustrate how a check-in could sound. The local Care Loops rules simulate appointment scheduling and urgent handoff. Calls, texts, agent replies, and staff notifications are simulated.</p>
        </footer>
      </div>
    </main>
  );
}
