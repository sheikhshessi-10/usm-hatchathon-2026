import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { companionReply, companionTopics, type CompanionReply } from "./companionReplies";

function Aven() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="h-9 w-9 shrink-0">
      <path d="M19 12c-1-5 1-8 6-9 1 5-1 8-6 9" fill="#36816b" />
      <path d="M19 12c-1-4-4-6-8-5 1 4 4 6 8 5" fill="#69a88a" />
      <path d="M19 11c11-1 16 5 16 12S29 36 20 36 5 31 5 23s5-12 14-12" fill="#f7cfdf" />
      <circle cx="15" cy="23" r="1.6" fill="#52243f" />
      <circle cx="25" cy="23" r="1.6" fill="#52243f" />
      <path d="M18 27q2 2 4 0" stroke="#52243f" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Companion() {
  const dialog = useRef<HTMLDialogElement>(null);
  const launch = useRef<HTMLButtonElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const [accessCode, setAccessCode] = useState("");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Array<{ question: string; reply: CompanionReply }>>([]);
  useEffect(() => {
    if (thread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [turns]);

  async function send(message: string, topic?: "start" | "loops") {
    const question = message.trim();
    if (!question || pending) return;
    let reply = companionReply(question);
    setDraft("");

    if (topic && accessCode.trim()) {
      setPending(true);
      try {
        const response = await fetch("/api/guide", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessCode.trim()}`,
          },
          body: JSON.stringify({ topic }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("Guide unavailable");
        const result = await response.json();
        if (typeof result.reply !== "string" || !result.reply.trim()) throw new Error("Empty reply");
        reply = { ...reply, text: result.reply };
      } catch {
        reply = { ...reply, text: `Live guide unavailable. ${reply.text}` };
      } finally {
        setPending(false);
      }
    }

    setTurns(current => [...current.slice(-19), { question, reply }]);
  }

  return (
    <>
      <button ref={launch} type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#ebd0dd] bg-[#fff4f8] px-2 pr-3 text-sm font-bold text-[#632e4e]">
        <Aven /> Ask Aven
      </button>
      <dialog ref={dialog} aria-labelledby="aven-title" onClose={() => launch.current?.focus()} className="pip-dialog rounded-[1.5rem] border border-[#ebd0dd] bg-white text-ink shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#ebd0dd] bg-[#fff4f8] p-4">
          <Aven />
          <div className="flex-1">
            <h2 id="aven-title" className="font-extrabold text-[#632e4e]">Aven</h2>
            <p className="text-xs text-body">Your AVENLYTH demo guide</p>
          </div>
          <button type="button" aria-label="Close Aven chat" onClick={() => dialog.current?.close()} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white"><X size={20} /></button>
        </div>
        <div ref={thread} role="log" aria-label="Aven conversation" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <p className="rounded-2xl rounded-tl-sm bg-[#fff4f8] p-3">Hi, I’m Aven! I can help you explore AVENLYTH. What would you like to try?</p>
          {turns.map(({ question, reply }, i) => (
            <div key={i} className="space-y-2">
              <p className="ml-8 break-words rounded-2xl rounded-tr-sm bg-navy p-3 text-white"><span className="sr-only">You: </span>{question}</p>
              <div className="mr-8 rounded-2xl rounded-tl-sm bg-[#fff4f8] p-3">
                <p><span className="sr-only">Aven: </span>{reply.text}</p>
                {reply.link && <a href={reply.link.href} onClick={() => dialog.current?.close()} className="mt-2 inline-block font-bold text-[#632e4e] underline">{reply.link.label}</a>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {companionTopics.map((topic, index) => <button key={topic} type="button" disabled={pending} onClick={() => send(topic, index === 0 ? "start" : index === 1 ? "loops" : undefined)} className="rounded-full border border-[#ebd0dd] px-3 py-2 text-xs font-bold text-[#632e4e] hover:bg-[#fff4f8]">{topic}</button>)}
        </div>
        <form className="border-t border-line p-4" onSubmit={event => { event.preventDefault(); send(draft); }}>
          <div className="flex gap-2">
            <input aria-label="Message Aven" value={draft} onChange={event => setDraft(event.target.value)} maxLength={280} placeholder="Ask about the demo…" className="min-w-0 flex-1 rounded-xl border border-line px-3 text-base" />
            <button type="submit" aria-label="Send to Aven" disabled={pending || !draft.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#632e4e] text-white disabled:opacity-40"><Send size={17} /></button>
          </div>
          <p className="mt-2 text-xs text-body" role="status">{pending ? "Getting an answer…" : "Typed messages stay in this browser."}</p>
          <details className="mt-2 text-xs text-body">
            <summary>Live guide access</summary>
            <label className="mt-2 block">
              Demo access code
              <input type="password" value={accessCode} onChange={event => setAccessCode(event.target.value)} autoComplete="off" className="ml-2 rounded border border-line px-2 py-1" />
            </label>
            <p className="mt-1">With a code, the first two suggested topics can use the live model.</p>
          </details>
        </form>
      </dialog>
    </>
  );
}
