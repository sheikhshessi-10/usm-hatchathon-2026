import { assistant } from "./_script.mjs";

const VAPI = "https://api.vapi.ai";

// Loads a patient file into the AI on the demo phone line. The next call to the line uses it.
// GET shows which patient file is loaded now.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const key = process.env.VAPI_API_KEY;
  const id = process.env.VAPI_ASSISTANT_ID;
  if (!key || !id) return res.status(503).json({ error: "Live calling is not set up yet." });
  const auth = { authorization: `Bearer ${key}`, "content-type": "application/json" };

  if (req.method === "GET") {
    const r = await fetch(`${VAPI}/assistant/${id}`, { headers: auth });
    const a = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Vapi lookup failed" });
    return res.status(200).json({ momName: a.metadata?.momName ?? null, loadedAt: a.metadata?.loadedAt ?? null, chars: a.metadata?.chars ?? 0 });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const momName = String(req.body?.momName || "").trim().slice(0, 60);
  const babyName = String(req.body?.babyName || "your baby").trim().slice(0, 40);
  const day = Math.max(1, Math.min(10, Number(req.body?.day) || 5));
  const background = String(req.body?.document || "").slice(0, 12000);
  if (!momName) return res.status(400).json({ error: "Patient name is required." });

  const first = momName.split(" ")[0];
  const a = assistant({ momName, babyName, day, background });
  a.firstMessage = `Hey ${first}! It's Aven, from your care team over at Forrest General. Thanks so much for calling in. How're you and little ${babyName} doing today?`;
  a.metadata = { momName, babyName, day, loadedAt: new Date().toISOString(), chars: background.length };
  try {
    let r = await fetch(`${VAPI}/assistant/${id}`, { method: "PATCH", headers: auth, body: JSON.stringify(a) });
    if (r.status === 400) {
      // Keep the current voice if this account does not have the chosen one.
      delete a.voice;
      r = await fetch(`${VAPI}/assistant/${id}`, { method: "PATCH", headers: auth, body: JSON.stringify(a) });
    }
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Vapi refused the update.", detail: j?.message });
    return res.status(200).json({ ok: true, momName, chars: background.length, voice: j.voice?.voiceId ?? null });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Vapi.", detail: String(e) });
  }
}
