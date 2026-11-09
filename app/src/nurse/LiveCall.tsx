import { useEffect, useRef, useState } from "react";
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

const STEP: Record<string, string> = { queued: "Dialing...", ringing: "Ringing...", "in-progress": "On the call now", forwarding: "Transferring", ended: "Call ended" };

export function LiveCall({ mom }: { mom: Mom }) {
  const [callId, setCallId] = useState<string | null>(null);
  const [st, setSt] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>();

  async function start() {
    setErr(null); setSt(null); setBusy(true);
    try {
      const r = await fetch("/api/call", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ momName: mom.name, babyName: mom.baby.name, day: mom.dayToday }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail ? `${j.error} ${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)}` : j.error);
      setCallId(j.id);
    } catch (e) { setErr(String((e as Error).message ?? e)); setBusy(false); }
  }

  useEffect(() => {
    if (!callId) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/call-status?id=${callId}`);
        const j = (await r.json()) as Status;
        if (!stop && r.ok) setSt(j);
        // Keep checking until the call ends and the AI has written down the answers.
        if (!stop && !(j.status === "ended" && (j.data || j.summary || j.endedReason))) timer.current = window.setTimeout(tick, 2500);
        else setBusy(false);
      } catch { if (!stop) timer.current = window.setTimeout(tick, 4000); }
    };
    tick();
    return () => { stop = true; window.clearTimeout(timer.current); };
  }, [callId]);

  const ended = st?.status === "ended";
  const data = ended ? (st?.data && (st.data.sys || st.data.symptoms?.length || st.data.reached !== undefined) ? st.data : parseTranscript(st!.messages.filter((m) => m.role === "mom").map((m) => m.text).join(" "))) : null;
  const result = data ? evaluate(toCheckIn(data, mom.dayToday)) : null;
  const first = mom.name.split(" ")[0];

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Live AI check-in call</h3>
          <p className="text-sm text-body">A real phone call to the demo phone. The AI asks the questions. Our fixed rules decide the result.</p>
        </div>
        <button onClick={start} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-navy disabled:opacity-60">
          <PhoneCall size={16} /> {busy ? "Call running..." : `Call ${first} now`}
        </button>
      </div>

      {err && <p className="mt-3 rounded-xl bg-red-soft px-4 py-3 text-sm text-red">{err}</p>}

      {callId && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            {ended ? <PhoneOff size={15} /> : <span className="h-2 w-2 animate-pulse rounded-full bg-green" />}
            {STEP[st?.status ?? "queued"] ?? st?.status}
            {ended && !result && " · writing up answers..."}
          </div>

          {st && st.messages.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-xl bg-ground p-3 text-sm">
              {st.messages.map((m, i) => (
                <p key={i} className="py-1"><b className={m.role === "ai" ? "text-navy" : "text-ink"}>{m.role === "ai" ? "CareBridge: " : `${first}: `}</b>{m.text}</p>
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
              {st?.recordingUrl && <audio className="mt-3 w-full" controls src={st.recordingUrl} />}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
