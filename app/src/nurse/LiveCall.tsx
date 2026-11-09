import { useEffect, useState } from "react";
import { PhoneCall, PhoneOff } from "lucide-react";
import { evaluate, type CheckIn, type MomSymptom } from "../lib/rules";
import type { Mom } from "../data/moms";
import { Card, Pill } from "../ui/parts";
import { LEVEL_TEXT } from "../data/moms";

type CallData = {
  reached?: boolean; emergency?: boolean; sys?: number; dia?: number; symptoms?: string[]; tookMeds?: boolean;
  babyFeeds?: number; babyWetDiapers?: number; babyTempF?: number; babyYellow?: "none" | "eyes" | "face" | "spreading";
  babyHardToWake?: boolean; babyCantWake?: boolean; babyFeedingPoorly?: boolean; questionsForNurse?: string;
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

export function LiveCall({ mom }: { mom: Mom }) {
  const [callId, setCallId] = useState<string | null>(null);
  const [st, setSt] = useState<Status | null>(null);
  const [feedWarning, setFeedWarning] = useState(false);
  const [pollWarning, setPollWarning] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer: number;
    async function findCall() {
      try {
        const response = await fetch("/api/calls");
        if (!response.ok) throw new Error("Call feed unavailable");
        const { calls } = await response.json() as { calls: { id: string; direction: string; startedAt: string }[] };
        const cutoff = Date.now() - 10 * 60 * 1000;
        const newest = calls.find(call => call.direction === "inboundPhoneCall" && Date.parse(call.startedAt) > cutoff);
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
  const result = data ? evaluate(toCheckIn(data, mom.dayToday)) : null;
  const waitingForAnswers = ended && !(st.data || st.summary || st.endedReason);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Live demo phone line</h3>
          <p className="mt-1 text-sm text-body">Call in to play the fictional patient. This panel follows the most recent incoming demo call.</p>
        </div>
        <a href="tel:+16012305710" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-navy">
          <PhoneCall size={16} aria-hidden="true" /> Call (601) 230-5710
        </a>
      </div>
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
