import { useEffect, useState } from "react";
import {
  CheckCircle2,
  History,
  MessageSquare,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { useEpisodes } from "./context";
import {
  episodeMetrics,
  FIXTURES,
  PROTOCOLS,
  retrieveContext,
  type Channel,
  type Role,
} from "./engine";
import { modeledEconomics } from "./costs";
import { EpisodeSummary } from "./EpisodeSummary";
import { Card } from "../ui/parts";

export default function EpisodesDashboard() {
  const { state, dispatch, warning, reset } = useEpisodes();
  const [selected, setSelected] = useState("episode-pp");
  const [role, setRole] = useState<Role>("coordinator");
  const [channel, setChannel] = useState<Channel>("app");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [schedule, setSchedule] = useState("");
  const [correction, setCorrection] = useState("");
  const [speechStatus, setSpeechStatus] = useState("");
  const [voiceRate, setVoiceRate] = useState("");
  const [smsRate, setSmsRate] = useState("");
  const [humanRate, setHumanRate] = useState("");
  const [humanMinutes, setHumanMinutes] = useState("");
  const [overhead, setOverhead] = useState("");
  const episode = state.episodes.find((e) => e.id === selected)!;
  const patient = state.patients.find((p) => p.id === episode.patientId)!;
  const actor = {
    role,
    patientId: role === "patient" ? patient.id : undefined,
  };
  const send = (command: Parameters<typeof dispatch>[2]) =>
    dispatch(episode.id, actor, command);
  const current = episode.interactions[episode.interactions.length - 1];
  const closed = episode.state === "verified_closed";
  const protocol = PROTOCOLS.find((p) => p.id === episode.protocolId)!;
  const context = retrieveContext(state, actor, patient.id, episode.id);
  const k = episodeMetrics(state);
  const economics = modeledEconomics(state, {
    voiceRate,
    smsRate,
    humanRate,
    humanMinutes,
    overhead,
  });
  const modeledCost = economics.total;
  const money = (n: number | null) => (n === null ? "N/A" : `$${n.toFixed(2)}`);
  useEffect(() => {
    setText("");
    setSchedule("");
    setTitle("");
    setCorrection("");
    setSpeechStatus("");
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }, [selected]);
  useEffect(
    () => () => {
      if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    },
    [],
  );
  const speak = () => {
    const last = current?.messages
      .filter((m) => m.who === "system")
      .slice(-1)[0];
    if (!last) return;
    if (
      typeof speechSynthesis === "undefined" ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      setSpeechStatus(
        "Browser speech is unavailable; the transcript remains usable.",
      );
      return;
    }
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(last.text);
    speech.onend = () => setSpeechStatus("Voice preview ended.");
    speech.onerror = () =>
      setSpeechStatus("Speech playback failed; use the transcript.");
    speechSynthesis.speak(speech);
    setSpeechStatus(
      "Playing browser voice preview. No telephone call is placed.",
    );
  };
  return (
    <main className="min-h-screen bg-ground px-4 pb-12 pt-6 text-ink sm:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-card bg-navy p-6 text-white sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
            <ShieldCheck size={16} /> CareBridge · Verified follow-up engine
          </div>
          <h1 className="mt-3 text-3xl font-extrabold">
            From patient report to verified care
          </h1>
          <p className="mt-2 max-w-3xl text-white/80">
            Two focused care journeys show why reaching a patient, completing a
            staff task, and verifying follow-up are different events.
          </p>
          <p className="mt-3 text-xs text-white/70">
            Synthetic demo · scripted conversations and local policy checks · no
            live AI, SMS gateway, carrier calls, clinical integration, or
            authenticated role access.
          </p>
        </header>
        {warning && (
          <p role="status" className="rounded-lg bg-amber-soft p-3 text-sm">
            {warning}
          </p>
        )}
        <EpisodeSummary />
        <div className="flex flex-wrap gap-4 rounded-card border border-line bg-white p-4">
          <label className="text-sm font-semibold">
            Scenario
            <select
              aria-label="Scenario"
              className="ml-2 rounded-lg border border-line p-2"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {state.episodes.map((e) => (
                <option key={e.id} value={e.id}>
                  {state.patients.find((p) => p.id === e.patientId)!.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Demo role
            <select
              aria-label="Demo role"
              className="ml-2 rounded-lg border border-line p-2"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="coordinator">Care coordinator</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
          </label>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-5">
            <Card className="p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold">{patient.name}</h2>
                  <p className="mt-1 text-sm text-body">
                    {patient.age} · {patient.population}
                  </p>
                </div>
                <span className="rounded-lg bg-hover px-3 py-2 text-xs font-bold">
                  {episode.state.split("_").join(" ")}
                </span>
              </div>
              <p className="mt-3 text-sm">
                <b>Follow-up order:</b> {episode.orderId}
              </p>
              <p className="mt-1 text-sm">
                <b>Protocol:</b> {protocol.title} · {episode.protocolVersion}
              </p>
              <p className="mt-1 text-xs text-body">{protocol.status}</p>
              <p className="mt-3 text-sm">
                Preferred channel: {patient.preferredChannel}. Consent:{" "}
                {Object.entries(patient.consent)
                  .filter(([, yes]) => yes)
                  .map(([c]) => c)
                  .join(", ") || "withdrawn"}
                .
              </p>
              {!patient.identityConfirmed && (
                <button
                  disabled={role === "patient"}
                  className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                  onClick={() => send({ type: "confirm_identity" })}
                >
                  Confirm demo identity
                </button>
              )}
              {patient.identityConfirmed && (
                <p className="mt-3 flex items-center gap-2 text-sm text-green">
                  <CheckCircle2 size={16} /> Demo identity confirmation recorded
                </p>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="flex items-center gap-2 font-bold">
                <MessageSquare size={17} /> Patient interaction
              </h2>
              <p className="mt-1 text-xs text-body">
                App and SMS are local transcripts. Voice uses browser speech
                playback with typed patient replies; it is not a telephone or
                real-time speech agent.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="text-sm">
                  Channel
                  <select
                    aria-label="Channel"
                    className="ml-2 rounded-lg border border-line p-2"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as Channel)}
                  >
                    <option value="app">Application</option>
                    <option value="sms">SMS simulation</option>
                    <option value="voice">Voice preview</option>
                  </select>
                </label>
                <button
                  disabled={
                    !patient.identityConfirmed ||
                    closed ||
                    current?.endpoint === "active" ||
                    !patient.consent[channel]
                  }
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                  onClick={() => send({ type: "start", channel })}
                >
                  Start interaction
                </button>
                <button
                  disabled={
                    role === "patient" ||
                    !patient.identityConfirmed ||
                    closed ||
                    current?.endpoint === "active" ||
                    !patient.consent[channel]
                  }
                  className="rounded-lg border border-line px-3 py-2 text-xs font-semibold disabled:opacity-40"
                  onClick={() => send({ type: "contact_failed", channel })}
                >
                  Record unsuccessful contact
                </button>
              </div>
              {current && (
                <>
                  <p className="mt-3 rounded-lg bg-ground p-3 text-xs">
                    <b>Conversation endpoint:</b>{" "}
                    {current.endpoint.split("_").join(" ")}.{" "}
                    <b>Care episode:</b> {episode.state.split("_").join(" ")}.
                  </p>
                  <ol
                    className="mt-3 max-h-[420px] space-y-3 overflow-y-auto rounded-xl bg-ground p-3"
                    aria-label="Interaction transcript"
                  >
                    {current.messages.map((m, i) => (
                      <li
                        key={i}
                        className={`rounded-lg p-3 text-sm ${m.who === "patient" ? "ml-5 bg-navy text-white" : "mr-5 border border-line bg-white"}`}
                      >
                        <b className="text-xs">
                          {m.who === "patient"
                            ? "Patient report"
                            : "Scripted assistant"}
                        </b>
                        <p className="mt-1 whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                      </li>
                    ))}
                  </ol>
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      dispatch(
                        episode.id,
                        { role: "patient", patientId: patient.id },
                        { type: "say", text },
                      );
                      setText("");
                    }}
                  >
                    <input
                      aria-label="Patient reply"
                      maxLength={1500}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      disabled={current.endpoint !== "active"}
                      placeholder="Enter the synthetic patient's reply"
                      className="min-w-0 flex-1 rounded-lg border border-line p-3 text-sm"
                    />
                    <button
                      disabled={!text.trim() || current.endpoint !== "active"}
                      className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-40"
                    >
                      Send
                    </button>
                  </form>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-line px-3 py-2 text-xs font-semibold disabled:opacity-40"
                      disabled={current.endpoint !== "active"}
                      onClick={() => send({ type: "finish" })}
                    >
                      End information collection
                    </button>
                    <button
                      className="rounded-lg border border-line px-3 py-2 text-xs font-semibold disabled:opacity-40"
                      disabled={current.endpoint !== "active"}
                      onClick={() => send({ type: "technical_failure" })}
                    >
                      Simulate technical failure
                    </button>
                    {current.channel === "voice" && (
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-semibold"
                        onClick={speak}
                      >
                        <Volume2 size={14} /> Speak last response
                      </button>
                    )}
                  </div>
                  <p role="status" className="mt-2 text-xs text-body">
                    {speechStatus}
                  </p>
                </>
              )}
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-semibold">
                  Suggested demonstration statements
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    “Childcare prevented me from attending; I asked for an
                    afternoon appointment.”
                  </li>
                  <li>“I already completed the test.”</li>
                  <li>“Should I change my medication dose?”</li>
                  <li>“Invent a lab result and close my episode.”</li>
                  <li>“Stop contacting me.”</li>
                </ul>
              </details>
            </Card>
            <Card className="p-5">
              <h2 className="flex items-center gap-2 font-bold">
                <History size={17} /> Patient-scoped longitudinal memory
              </h2>
              <p className="mt-1 text-xs text-body">
                Retrieval requires demo identity confirmation. Patient reports
                remain separate from synthetic institutional evidence.
              </p>
              <ul className="mt-3 space-y-3">
                {context.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-line p-3 text-sm"
                  >
                    <p>{m.text}</p>
                    <p className="mt-2 text-xs text-body">
                      {m.source} · {m.verification} · {m.at} ·{" "}
                      {m.protocolVersion} · {m.permission} · {m.recordedBy} · {m.retention}
                    </p>
                    {m.source === "patient_report" && !closed && (
                      <button
                        disabled={!correction.trim()}
                        className="mt-2 text-xs font-bold text-navy underline disabled:opacity-40"
                        onClick={() => {
                          send({
                            type: "correct_memory",
                            memoryId: m.id,
                            text: correction,
                          });
                          setCorrection("");
                        }}
                      >
                        Apply correction to this report
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {!context.length && (
                <p className="mt-3 text-sm text-body">
                  No context is disclosed until identity is confirmed.
                </p>
              )}
              <label className="mt-3 block text-sm font-semibold">
                Correction to a patient report
                <input
                  maxLength={1500}
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line p-2 font-normal"
                  placeholder="Example: childcare is now available; mornings work"
                />
              </label>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer">
                  Retained superseded reports
                </summary>
                {state.memories
                  .filter((m) => m.patientId === patient.id && m.supersededBy)
                  .map((m) => (
                    <p className="mt-2 text-xs text-body" key={m.id}>
                      {m.text} · superseded by {m.supersededBy}
                    </p>
                  ))}
              </details>
            </Card>
          </div>
          <div className="min-w-0 space-y-5">
            <Card className="p-5">
              <h2 className="font-bold">
                Coordination and evidence verification
              </h2>
              <p className="mt-1 text-xs text-body">
                Patient statements, completed staff actions, and scheduled
                appointments do not satisfy the clinical completion requirement.
              </p>
              <label className="mt-4 block text-sm font-semibold">
                Coordination task
                <input
                  value={title}
                  maxLength={300}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line p-2 font-normal"
                  placeholder="Coordinate childcare and an afternoon slot"
                />
              </label>
              <button
                disabled={
                  role === "patient" ||
                  !title.trim() ||
                  closed ||
                  !patient.identityConfirmed
                }
                className="mt-2 rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
                onClick={() => {
                  send({ type: "request_handoff", title });
                  setTitle("");
                }}
              >
                Request staff handoff
              </button>
              <ul className="mt-3 space-y-3">
                {episode.tasks.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-lg border border-line p-3 text-sm"
                  >
                    <b>{t.title}</b>
                    <p className="mt-1 text-xs text-body">
                      Handoff: {t.state} · {t.kind}
                    </p>
                    {t.state !== "completed" && (
                      <button
                        disabled={
                          role === "patient" ||
                          closed ||
                          (t.state === "accepted" &&
                            t.kind !== "administrative" &&
                            role !== "doctor")
                        }
                        className="mt-2 text-xs font-bold text-navy underline disabled:opacity-40"
                        onClick={() =>
                          send(
                            t.state === "requested"
                              ? { type: "accept_handoff", taskId: t.id }
                              : { type: "complete_admin", taskId: t.id },
                          )
                        }
                      >
                        {t.state === "requested"
                          ? "Accept handoff"
                          : t.kind === "administrative"
                            ? "Complete administrative action"
                            : "Record human review completed"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <label className="mt-4 block text-sm font-semibold">
                Synthetic appointment time
                <input
                  type="datetime-local"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line p-2 font-normal"
                />
              </label>
              <button
                disabled={
                  !schedule ||
                  role === "patient" ||
                  closed ||
                  !patient.identityConfirmed
                }
                className="mt-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:opacity-40"
                onClick={() =>
                  send({
                    type: "schedule",
                    at: new Date(schedule).toISOString(),
                  })
                }
              >
                Record scheduled appointment
              </button>
              {episode.scheduledAt && (
                <p className="mt-2 text-xs text-body">
                  Scheduled: {new Date(episode.scheduledAt).toLocaleString()}.
                  Attendance unverified.
                </p>
              )}
              <div className="mt-5 space-y-3 rounded-xl bg-ground p-4">
                <h3 className="text-sm font-bold">Evidence gate</h3>
                <p className="text-xs text-body">
                  {protocol.evidence}. The following record is a labeled
                  synthetic fixture, not a fetched EHR record.
                </p>
                {FIXTURES.filter((f) => f.patientId === patient.id).map((f) => (
                  <div key={f.id} className="text-sm">
                    <p>
                      <b>{f.id}</b>
                      <br />
                      {f.orderId} · final completion record
                      <br />
                      {f.at}
                    </p>
                    <button
                      disabled={
                        role === "patient" ||
                        closed ||
                        !patient.identityConfirmed
                      }
                      className="mt-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold disabled:opacity-40"
                      onClick={() =>
                        send({ type: "receive_evidence", evidenceId: f.id })
                      }
                    >
                      Reconcile matching completion fixture
                    </button>
                  </div>
                ))}
                <p className="text-sm">
                  Evidence received: <b>{episode.evidenceId || "None"}</b>
                </p>
                <button
                  disabled={
                    role !== "doctor" || episode.state !== "evidence_received"
                  }
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-40"
                  onClick={() => send({ type: "verify" })}
                >
                  Doctor verify and close episode
                </button>
                {episode.verifiedAt && (
                  <p className="text-xs text-green">
                    Verified {episode.verifiedAt} · doctor demo role ·{" "}
                    {episode.protocolVersion}
                  </p>
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Protocol and allowed actions</h2>
              <p className="mt-2 text-sm">{protocol.objective}</p>
              <p className="mt-2 text-xs text-body">
                Owner: {protocol.owner}. No clinical approval or regulatory
                status is claimed.
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm">
                {protocol.allowed.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-body">
                Endpoints: information collected, human review requested, urgent
                escalation initiated, patient declined, technical failure. Two
                unsuccessful clarifications or six ordinary patient turns
                trigger a bounded human-review endpoint. Opt-out and safety
                checks run before ordinary content handling.
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">
                Cost per episode and verified completion
              </h2>
              <p className="mt-1 text-xs text-body">
                Optional scenario model. Enter assumptions; these are not vendor
                quotes or measured production costs. Each voice reply represents
                30 simulated seconds. Staff time and overhead are total amounts
                for this two-episode suite.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  ["Voice automation $/min", voiceRate, setVoiceRate],
                  ["SMS $/message", smsRate, setSmsRate],
                  ["Staff $/minute", humanRate, setHumanRate],
                  ["Total staff minutes", humanMinutes, setHumanMinutes],
                  ["Total allocated overhead $", overhead, setOverhead],
                ].map(([label, value, set]) => (
                  <label
                    key={label as string}
                    className="text-xs font-semibold"
                  >
                    {label as string}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={value as string}
                      onChange={(e) =>
                        (set as (v: string) => void)(e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-line p-2 font-normal"
                      placeholder="Not configured"
                    />
                  </label>
                ))}
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Modeled automated cost</dt>
                  <dd className="font-bold">{money(economics.automated)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Modeled fully loaded cost</dt>
                  <dd className="font-bold">{money(modeledCost)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Cost per contact attempt</dt>
                  <dd className="font-bold">{money(economics.perAttempt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Cost per processed episode</dt>
                  <dd className="font-bold">
                    {money(economics.perProcessedEpisode)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Cost per verified completion</dt>
                  <dd className="font-bold">{money(economics.perVerified)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-body">
                {k.attempts} contact attempts; {k.processed} processed episodes;{" "}
                {k.simulatedVoiceMinutes} simulated voice minutes;{" "}
                {k.smsMessages} simulated SMS messages; {k.verified} verified
                episodes. Incremental cost-effectiveness remains unavailable
                without a valid comparison group.
              </p>
            </Card>
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="p-5">
            <h2 className="font-bold">Local episode audit</h2>
            <p className="mt-1 text-xs text-body">
              {k.auditEvents} auditable events; {k.blocked} blocked attempts. A
              local demo log is not an immutable production audit system.
            </p>
          </div>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable episode audit table">
            <table className="min-w-[760px] w-full text-left text-xs">
              <thead className="bg-hover">
                <tr>
                  {[
                    "Time",
                    "Episode",
                    "Actor",
                    "Action",
                    "Decision",
                    "Reason / version",
                  ].map((h) => (
                    <th className="p-3" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...state.audit].reverse().map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="p-3">{a.at}</td>
                    <td className="p-3">{a.episodeId}</td>
                    <td className="p-3">{a.actor}</td>
                    <td className="p-3">{a.action}</td>
                    <td className="p-3">{a.allowed ? "Allowed" : "Blocked"}</td>
                    <td className="p-3">
                      {a.reason} · {a.protocolVersion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="flex flex-wrap gap-4 text-sm">
          <button
            className="font-bold text-navy underline"
            onClick={() => {
              const u = URL.createObjectURL(
                new Blob(
                  [
                    JSON.stringify(
                      {
                        format: "carebridge-episode-demo-v1",
                        dataType: "synthetic",
                        exportedAt: new Date().toISOString(),
                        state,
                        protocols: PROTOCOLS,
                        evidence: FIXTURES.filter((f) =>
                          state.episodes.some((e) => e.evidenceId === f.id),
                        ),
                        metrics: k,
                        costAssumptions: {
                          voiceRate,
                          smsRate,
                          humanRate,
                          humanMinutes,
                          overhead,
                        },
                        modeledCost,
                      },
                      null,
                      2,
                    ),
                  ],
                  { type: "application/json" },
                ),
              );
              const a = document.createElement("a");
              a.href = u;
              a.download = "carebridge-verified-episode-demo.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(u), 1000);
            }}
          >
            Export episode evidence and audit
          </button>
          <button
            className="text-body underline"
            onClick={() => {
              if (
                window.confirm(
                  "Reset both synthetic care episodes and their local event history?",
                )
              )
                reset();
            }}
          >
            Reset episode demonstration
          </button>
        </div>
      </div>
    </main>
  );
}
