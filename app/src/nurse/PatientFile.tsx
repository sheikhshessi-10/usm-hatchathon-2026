import { useEffect, useState } from "react";
import { FileUp, Send } from "lucide-react";
import { LABEL } from "../lib/rules";
import type { Mom } from "../data/moms";

/** Turns the patient record into a plain-text file the AI reads before the call. */
export function buildPatientFile(m: Mom): string {
  const lines = [
    `Patient: ${m.name}, age ${m.age}, ${m.county} County. Phone: ${m.phoneType}.`,
    `Diagnosis: ${m.diagnosis}. Delivery: ${m.delivery}. Day ${m.dayToday} at home.`,
    `Baby: ${m.baby.name}, feeding: ${m.baby.feeding}.`,
    `Medicines: ${m.meds.join(", ") || "none"}.`,
    `Next visit: ${m.visit}.`,
    "Daily check-ins so far:",
    ...m.calls.map((c) => c.answered
      ? `- Day ${c.day}: BP ${c.sys}/${c.dia}${c.symptoms.length ? `, reported ${c.symptoms.map((s) => LABEL[s]).join(", ")}` : ", no warning signs"}${c.baby ? `; baby ${c.baby.feedsPerDay ?? "?"} feeds, ${c.baby.wetDiapers ?? "?"} wet diapers` : ""}`
      : `- Day ${c.day}: missed call`),
  ];
  if (m.history?.barriers?.length) lines.push(`Barriers: ${m.history.barriers.join("; ")}.`);
  if (m.history?.prenatal?.length) lines.push(`Pregnancy BP: ${m.history.prenatal.map((p) => `week ${p.gestationalWeek} ${p.bp[0]}/${p.bp[1]} (${p.note})`).join("; ")}.`);
  if (m.nurseNote) lines.push(`Nurse note: ${m.nurseNote}`);
  return lines.join("\n");
}

export function PatientFile({ mom }: { mom: Mom }) {
  const [doc, setDoc] = useState(() => buildPatientFile(mom));
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brief").then((r) => r.ok ? r.json() : null).then((j) => j?.momName && setLoaded(j.momName)).catch(() => {});
  }, []);

  async function readFile(f: File) {
    const text = await f.text();
    setDoc((d) => `${d}\n\nAttached document (${f.name}):\n${text.slice(0, 8000)}`);
  }

  async function send() {
    setState("sending"); setMsg("");
    try {
      const r = await fetch("/api/brief", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ momName: mom.name, babyName: mom.baby.name, day: mom.dayToday, document: doc }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail ? `${j.error} ${j.detail}` : j.error);
      setState("done"); setLoaded(mom.name);
      setMsg(`Loaded. The next call to (601) 230-5710 will be about ${mom.name.split(" ")[0]} and use this file.`);
    } catch (e) { setState("error"); setMsg(String((e as Error).message ?? e)); }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl bg-ground p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-navy">Patient file for the AI</span>
        <span className="text-xs text-body">{loaded ? `On the line now: ${loaded}` : "No file loaded yet"}</span>
      </div>
      <p className="text-xs text-body">Edit the notes or attach a document (text file). The AI uses it to make the call personal. It never reads it aloud.</p>
      <textarea value={doc} onChange={(e) => setDoc(e.target.value)} rows={8} aria-label="Patient file" className="w-full rounded-lg border border-line bg-white p-3 font-mono text-xs leading-relaxed" />
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy">
          <FileUp size={15} aria-hidden="true" /> Attach document
          <input type="file" accept=".txt,.md,.csv,.json,text/*" className="sr-only" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        </label>
        <button type="button" onClick={send} disabled={state === "sending"} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          <Send size={15} aria-hidden="true" /> {state === "sending" ? "Loading..." : `Load into AI call`}
        </button>
      </div>
      {msg && <p role="status" className={`text-sm ${state === "error" ? "text-red" : "text-green"}`}>{msg}</p>}
    </div>
  );
}
