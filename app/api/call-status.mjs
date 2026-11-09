const VAPI = "https://api.vapi.ai";

// Returns the state of a live call: status, transcript, and the answers the AI wrote down.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const key = process.env.VAPI_API_KEY;
  const id = String(req.query?.id || "");
  if (!key) return res.status(503).json({ error: "Live calling is not set up yet." });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "Bad call id" });
  try {
    const r = await fetch(`${VAPI}/call/${id}`, { headers: { authorization: `Bearer ${key}` } });
    const c = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Vapi lookup failed", detail: c?.message });
    const msgs = (c.artifact?.messages ?? c.messages ?? [])
      .filter((m) => m.role === "user" || m.role === "bot" || m.role === "assistant")
      .map((m) => ({ role: m.role === "user" ? "mom" : "ai", text: m.message ?? m.content ?? "" }))
      .filter((m) => m.text);
    return res.status(200).json({
      status: c.status,
      endedReason: c.endedReason ?? null,
      transcript: c.artifact?.transcript ?? c.transcript ?? "",
      messages: msgs,
      data: c.analysis?.structuredData ?? null,
      summary: c.analysis?.summary ?? null,
      recordingUrl: c.artifact?.recordingUrl ?? c.recordingUrl ?? null,
    });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Vapi.", detail: String(e) });
  }
}
