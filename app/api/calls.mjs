const VAPI = "https://api.vapi.ai";

// Lists the CareBridge check-in calls Vapi has on record, for the live numbers on the nurse screen.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const key = process.env.VAPI_API_KEY;
  if (!key) return res.status(503).json({ error: "Live calling is not set up yet." });
  try {
    const r = await fetch(`${VAPI}/call?limit=100`, { headers: { authorization: `Bearer ${key}` } });
    const list = await r.json();
    if (!r.ok || !Array.isArray(list)) return res.status(502).json({ error: "Vapi lookup failed" });
    const calls = list
      .filter((c) => c.assistant?.name === "CareBridge check-in")
      .map((c) => ({
        id: c.id,
        momName: c.customer?.name ?? "Unknown",
        status: c.status,
        endedReason: c.endedReason ?? null,
        startedAt: c.startedAt ?? c.createdAt,
        endedAt: c.endedAt ?? null,
        cost: typeof c.cost === "number" ? c.cost : null,
        data: c.analysis?.structuredData ?? null,
        momText: (c.artifact?.messages ?? []).filter((m) => m.role === "user").map((m) => m.message).join(" "),
      }));
    return res.status(200).json({ calls });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Vapi.", detail: String(e) });
  }
}
