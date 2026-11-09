import { useEffect, useState } from "react";
import { PhoneCall, PhoneOff } from "lucide-react";
import { evaluate, type CheckIn, type MomSymptom } from "../lib/rules";
import { DOCTOR_REVIEW, type CallPatient } from "../data/callPatient";
import { Card, Pill } from "../ui/parts";
import { LEVEL_TEXT } from "../data/moms";
import { PatientFile } from "./PatientFile";

type CallData = {
  reached?: boolean; emergency?: boolean; sys?: number; dia?: number; symptoms?: string[]; tookMeds?: boolean;
  babyFeeds?: number; babyWetDiapers?: number; babyTempF?: number; babyYellow?: "none" | "eyes" | "face" | "spreading";
  babyHardToWake?: boolean; babyCantWake?: boolean; babyFeedingPoorly?: boolean; questionsForNurse?: string;
  checklist?: { id: string; asked?: boolean; status?: "ok" | "concern" | "unclear" | "not_asked"; answer?: string }[]; checkupComplete?: boolean;
};
type Status = { status: string; endedReason: string | null; messages: { role: "mom" | "ai"; text: string }[]; transcript: string; data: CallData | null; summary: string | null; recordingUrl: string | null };

const SYMPTOMS: MomSymptom[] = ["headache", "vision", "upper_belly_pain", "swelling", "chest_pain", "trouble_breathing", "seizure", "self_harm", "heavy_bleeding", "leg_red_swollen", "fever", "wound"];

/** Backup if the AI's written answers are missing: pull the numbers and warning words straight from what mom said. */
export function parseTranscript(momLines: string): CallData {
  const t = momLines.toLowerCase();
  const bp = t.match(/(\d{2,3})\s*(?:over|\/|by)\s*(\d{2,3})/);
  const has = (re: RegExp) => re.test(t);
  const symptoms: string[] = [];
  if (has(/headache/)) symptoms.push("headache");
  if (has(/blurr|spots|flash/)) symptoms.push("vision");
  if (has(/chest pain/)) symptoms.push("chest_pain");
  if (has(/can'?t breathe|trouble breathing|short of breath/)) symptoms.push("trouble_breathing");
  return { reached: true, sys: bp ? +bp[1] : undefined, dia: bp ? +bp[2] : undefined, symptoms };
}

export function readCallAnswers(recorded: CallData | null, patientText: string): CallData | null {
  if (recorded?.reached === false) return null;
  if (recorded && (
    (recorded.sys != null && recorded.dia != null) || Array.isArray(recorded.symptoms) ||
    recorded.babyTempF != null || recorded.babyFeeds != null || recorded.babyWetDiapers != null ||
    recorded.babyYellow != null || recorded.babyHardToWake != null || recorded.babyCantWake != null ||
    recorded.babyFeedingPoorly != null
  )) return recorded;
  const parsed = parseTranscript(patientText);
  return (parsed.sys != null && parsed.dia != null) || parsed.symptoms?.length ? parsed : null;
}

export function toCheckIn(d: CallData, day: number): CheckIn {
  return {
    day, answered: d.reached !== false,
    sys: d.sys, dia: d.dia,
    symptoms: (d.symptoms ?? []).filter((s): s is MomSymptom => (SYMPTOMS as string[]).includes(s)),
    baby: {
      feedsPerDay: d.babyFeeds, wetDiapers: d.babyWetDiapers, tempF: d.babyTempF, yellowSkin: d.babyYellow,
      hardToWake: d.babyHardToWake, cantWake: d.babyCantWake, feedingPoorly: d.babyFeedingPoorly,
    },
  };
}

export const NO_ANSWER = /no-answer|busy|voicemail|failed|did-not-answer/i;

const STEP: Record<string, string> = { queued: "Dialing...", ringing: "Ringing...", "in-progress": "On the call now", forwarding: "Transferring", ended: "Call ended" };

export function LiveCall({ patient }: { patient: CallPatient }) {
  const [callId, setCallId] = useState<string | null>(null);
  const [st, setSt] = useState<Status | null>(null);
  const [feedWarning, setFeedWarning] = useState(false);
  const [pollWarning, setPollWarning] = useState(false);
  const [dialing, setDialing] = useState(false);
  const [callErr, setCallErr] = useState<string | null>(null);
  async function startCall() {
    setDialing(true); setCallErr(null);
    try {
      const r = await fetch("/api/call", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ momName: patient.name, babyName: patient.babyName, day: patient.day }) });
      const j = await r.json();
      if (!r.ok) throw new Error(typeof j.detail === "string" ? `${j.error} ${j.detail}` : j.error);
      setCallId(j.id);
    } catch (e) { setCallErr(String((e as Error).message ?? e)); }
    setDialing(false);
  }

  useEffect(() => {
    let stop = false;
    let timer: number;
    async function findCall() {
      try {
        const response = await fetch("/api/calls");
        if (!response.ok) throw new Error("Call feed unavailable");
        const { calls } = await response.json() as { calls: { id: string; direction: string; startedAt: string }[] };
        const cutoff = Date.now() - 10 * 60 * 1000;
        const newest = calls.find(call => Date.parse(call.startedAt) > cutoff);
        if (!stop) {
          setFeedWarning(false);
          if (newest) setCallId(newest.id);
        }
      } catch {
        if (!stop) setFeedWarning(true);
      }
      if (!stop) timer = window.setTimeout(findCall, 4000);
    }
    findCall();
    return () => { stop = true; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!callId) return;
    let stop = false;
    let timer: number;
    setSt(null);
    setPollWarning(false);
    const tick = async () => {
      try {
        const r = await fetch(`/api/call-status?id=${callId}`);
        if (!r.ok) throw new Error("Call status unavailable");
        const j = (await r.json()) as Status;
        if (stop) return;
        setSt(j);
        setPollWarning(false);
        if (j.status !== "ended" || !(j.data || j.summary || j.endedReason)) {
          timer = window.setTimeout(tick, 2500);
        }
      } catch {
        if (stop) return;
        setPollWarning(true);
        timer = window.setTimeout(tick, 4000);
      }
    };
    tick();
    return () => { stop = true; window.clearTimeout(timer); };
  }, [callId]);

  const ended = st?.status === "ended";
  const unreached = ended && (st.data?.reached === false || NO_ANSWER.test(st.endedReason ?? ""));
  const spoken = ended ? st.messages.filter(message => message.role === "mom").map(message => message.text).join(" ").trim() : "";
  const data = ended && !unreached ? readCallAnswers(st.data, spoken) : null;
  const result = data ? evaluate(toCheckIn(data, patient.day)) : null;
  const waitingForAnswers = ended && !(st.data || st.summary || st.endedReason);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Live demo phone line</h3>
          <p className="mt-1 text-sm text-body">Load the patient file, then press the button. The AI calls the demo phone; answer as the patient. The conversation shows up here live.</p>
        </div>
<div className="flex flex-wrap gap-2">
          <button type="button" onClick={startCall} disabled={dialing} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-navy disabled:opacity-60">
            <PhoneCall size={16} aria-hidden="true" /> {dialing ? "Calling..." : `AI calls ${patient.name.split(" ")[0]} now`}
          </button>
          <a href="tel:+16012305710" className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy">Or call in: (601) 230-5710</a>
        </div>
      </div>
      <PatientFile patient={patient} />

      {callErr && <p role="alert" className="mt-3 rounded-xl bg-red-soft px-4 py-3 text-sm text-red">{callErr}</p>}
      {feedWarning && <p role="status" className="mt-3 text-sm text-body">The incoming call feed is temporarily unavailable. Checking again…</p>}
      {!callId && !feedWarning && <p role="status" className="mt-3 text-sm text-body">Waiting for an incoming demo call.</p>}

      {callId && (
        <div className="mt-4 flex flex-col gap-3">
          <div role="status" className="flex items-center gap-2 text-sm font-semibold text-navy">
            {ended ? <PhoneOff size={15} /> : <span className="h-2 w-2 animate-pulse rounded-full bg-green" />}
            {st ? STEP[st.status] ?? st.status : "Connecting to call transcript"}
            {waitingForAnswers && " · waiting for answers"}
          </div>

          {pollWarning && <p role="status" className="text-sm text-body">Call status is temporarily unavailable. Checking again…</p>}
          {ended && !waitingForAnswers && !result && <p className="text-sm text-body">{unreached ? "No patient was reached on this call." : "The call ended without enough patient responses to show a result."}</p>}

          {st && st.messages.length > 0 && (
            <div role="region" aria-label="Live call transcript" tabIndex={0} className="max-h-64 overflow-y-auto rounded-xl bg-ground p-3 text-sm [overflow-wrap:anywhere]">
              {st.messages.map((m, i) => (
                <p key={i} className="py-1"><b className={m.role === "ai" ? "text-navy" : "text-ink"}>{m.role === "ai" ? "Aven: " : "Caller: "}</b>{m.text}</p>
              ))}
            </div>
          )}

          {result && data && (
            <div className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold">Rules result</span>
                <Pill level={result.level}>{LEVEL_TEXT[result.level]}</Pill>
                {data.sys && data.dia && <span className="text-sm font-bold tabular-nums">{data.sys}/{data.dia}</span>}
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {result.findings.length ? result.findings.map((f, i) => <li key={i}>{f.who === "baby" ? "Baby: " : ""}{f.reason}</li>) : <li>No warning signs reported.</li>}
              </ul>
              {patient.checks.length > 0 && <Checklist patient={patient} data={data} />}
              {data.questionsForNurse && <p className="mt-2 text-sm"><b>Question for nurse:</b> {data.questionsForNurse}</p>}
              {st?.summary && <p className="mt-2 text-sm text-body">{st.summary}</p>}
              {st?.recordingUrl && <audio className="mt-3 w-full" aria-label="Demo call recording" controls src={st.recordingUrl} />}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

const CHECK_STYLE: Record<string, string> = { ok: "bg-green-soft text-green", concern: "bg-red-soft text-red", unclear: "bg-amber-soft text-amber", not_asked: "bg-ground text-body" };
const CHECK_TEXT: Record<string, string> = { ok: "OK", concern: "Concern", unclear: "Unclear", not_asked: "Not asked" };

/** Each doctor's order, what she said, and whether it is a concern. */
function Checklist({ patient, data }: { patient: CallPatient; data: CallData }) {
  const got = new Map((data.checklist ?? []).map((c) => [c.id, c]));
  const rows = patient.checks.map((c) => ({ c, r: got.get(c.id) }));
  const asked = rows.filter(({ r }) => r && r.status && r.status !== "not_asked").length;
  const concerns = rows.filter(({ r }) => r?.status === "concern").length;
  const complete = data.checkupComplete ?? asked === rows.length;
  return (
    <div className="mt-3 rounded-xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <span className="text-sm font-bold">Doctor's orders checked</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${complete ? "bg-green-soft text-green" : "bg-amber-soft text-amber"}`}>
          {complete ? "Check-up complete" : "Check-up incomplete"} · {asked}/{rows.length} asked{concerns ? ` · ${concerns} concern${concerns > 1 ? "s" : ""}` : ""}
        </span>
      </div>
      {concerns > 0 && (
        <div role="alert" className="border-b border-line bg-red-soft px-3 py-3 text-sm">
          <p className="font-bold text-red">Alert sent to nurse and doctor</p>
          <p className="mt-1 font-semibold">Doctor, please check:</p>
          <ul className="mt-1 list-disc pl-5">
            {rows.filter(({ r }) => r?.status === "concern").map(({ c, r }) => <li key={c.id}><b>{c.label}</b> ({r?.answer || "concern reported"}): {DOCTOR_REVIEW[c.id] ?? "Review this finding."}</li>)}
          </ul>
        </div>
      )}
      {complete && concerns === 0 && <p className="border-b border-line bg-green-soft px-3 py-2 text-sm font-semibold text-green">Successful check-up logged. Nothing abnormal. Shared with nurse and doctor.</p>}
      <ul className="divide-y divide-line text-sm">
        {rows.map(({ c, r }) => {
          const st = r?.status ?? "not_asked";
          return (
            <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2">
              <div className="min-w-0 flex-1"><b>{c.label}</b>{r?.answer && <p className="text-body">{r.answer}</p>}</div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${CHECK_STYLE[st]}`}>{CHECK_TEXT[st]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
