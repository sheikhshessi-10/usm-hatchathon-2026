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
            <p className="protocol-kicker"><HeartPulse size={17} aria-hidden="true" /> CareBridge · Outreach demo</p>
            <h1>Outreach &amp; escalation</h1>
            <p>Follow one fictional postpartum check-in across phone, text, and the AI agent. Switch scenarios to see what changes when a patient reports an urgent warning sign.</p>
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
              <h2 id="path-title">{urgent ? "Stop the routine check-in" : "Track the report and keep follow-up open"}</h2>
              <p>{urgent ? "In this sample, the patient reports chest pain and trouble breathing. The assistant interrupts the check-in and the demo queues an urgent staff review." : "Maya says she completed her screening. CareBridge records her statement and waits for matching evidence and doctor verification."}</p>
            </div>
          </div>
          <ol>
            {(urgent ? ["Warning sign reported", "Routine questions stop", "Urgent review queued", "Staff acknowledges"] : ["Consent and identity", "Patient report captured", "Evidence pending", "Doctor verifies when available"]).map((label, index) =>
              <li key={label}><span>{index + 1}</span>{label}</li>
            )}
          </ol>
          {urgent && <p className="protocol-safety">Chest pain or trouble breathing after pregnancy calls for immediate medical care. This simulation does not send an alert or dispatch help. <a href="https://www.cdc.gov/hearher/maternal-warning-signs/">CDC warning signs</a></p>}
          {urgent && <details className="protocol-escalation-details">
            <summary>What the receiving team needs</summary>
            <p>The handoff should carry the patient’s exact words, the channel, the time, and the receiving role. If nobody acknowledges, the case stays open. A live clinic would need a defined on-call backup and acknowledgement deadline.</p>
          </details>}
        </section>

        <div className="protocol-channels">
          {channels.map(channel => {
            const result = replayExample(channel.id, scenario, acknowledged.includes(channel.id));
            const Icon = icons[channel.id];
            const task = result.episode.tasks[0];
            const accepted = task?.state === "accepted";
            const headingId = `protocol-${channel.id}`;
            const systemLines = urgent
              ? [channel.opening, "I’m glad you told me. Please get medical care immediately. Don’t wait for a reply here. This demo records an urgent review request. No help has been dispatched."]
              : [channel.opening, ...channel.routine];
            let systemLine = 0;
            const messages = result.interaction.messages.map(message => message.who === "system"
              ? { ...message, text: systemLines[systemLine++] ?? message.text }
              : message);
            return (
              <section key={channel.id} className="protocol-channel" aria-labelledby={headingId}>
                <header className="protocol-channel-header">
                  <span><Icon size={21} aria-hidden="true" /></span>
                  <div><h2 id={headingId}>{channel.title}</h2><p>{channel.subtitle}</p></div>
                </header>
                <div className={`protocol-conversation protocol-conversation--${channel.id}`}>
                  <div className="protocol-conversation-bar">
                    <Icon size={17} aria-hidden="true" />
                    <div><strong>{channel.id === "voice" ? result.patient.name : "CareBridge"}</strong><small>{channel.id === "voice" ? "Simulated outbound call" : channel.id === "sms" ? "Simulated text thread" : "Simulated portal assistant"}</small></div>
                  </div>
                  <p className="protocol-chat-meta"><LockKeyhole size={12} aria-hidden="true" /> Demo consent and identity confirmed</p>
                  <ol className="protocol-messages" aria-label={`${channel.title} sample conversation`}>
                    {messages.map((message, index) => (
                      <li key={index} data-speaker={message.who}>
                        <span className="protocol-speaker">{message.who === "patient" ? result.patient.name : "CareBridge"}{channel.id === "voice" && <> · <time dateTime={message.at}>{time.format(new Date(message.at))}</time></>}</span>
                        <p>{message.text}</p>
                      </li>
                    ))}
                  </ol>
                  {channel.id !== "voice" && <div className="protocol-compose" aria-hidden="true">
                    <span>{channel.id === "sms" ? "Text message" : "Message CareBridge"} · preview</span><Send size={15} />
                  </div>}
                </div>
                <div className="protocol-result" data-urgent={urgent}>
                  <p className="protocol-result-label">{urgent ? "Escalation protocol" : "Tracking protocol"}</p>
                  <p className="protocol-result-status" role="status">
                    {urgent ? accepted ? "Staff acknowledged · case open" : "Urgent review queued · awaiting staff" : "Patient-reported · evidence pending"}
                  </p>
                  {urgent && (
                    <>
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
          <p>Fictional conversations run through the local Care Loops rules. Call placement, SMS delivery, agent replies, and staff notifications are simulated.</p>
        </footer>
      </div>
    </main>
  );
}
