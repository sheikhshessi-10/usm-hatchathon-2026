import { assistant } from "./_script.mjs";

const VAPI = "https://api.vapi.ai";

// Starts a live check-in call. It only ever calls the demo phone set in DEMO_PHONE,
// so nobody can use this page to ring a stranger.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.VAPI_API_KEY;
  const to = process.env.DEMO_PHONE;
  if (!key || !to) return res.status(503).json({ error: "Live calling is not set up yet." });

  const momName = String(req.body?.momName || "Keisha Williams").slice(0, 60);
  const babyName = String(req.body?.babyName || "your baby").slice(0, 40);
  const day = Math.max(1, Math.min(10, Number(req.body?.day) || 5));
  const auth = { authorization: `Bearer ${key}`, "content-type": "application/json" };

  try {
    let phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    if (!phoneNumberId) {
      const list = await fetch(`${VAPI}/phone-number`, { headers: auth }).then((r) => r.json());
      phoneNumberId = Array.isArray(list) ? list[0]?.id : undefined;
      if (!phoneNumberId) return res.status(503).json({ error: "No calling number found in Vapi." });
    }
    const first = momName.split(" ")[0];
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    // Use the saved assistant, which carries the patient file loaded from the nurse screen.
    const body = assistantId
      ? { phoneNumberId, assistantId, customer: { number: to, name: momName }, assistantOverrides: { firstMessage: `Hi ${first}, this is Aven from your care team at Forrest General, calling for your daily check-in. Is now an okay time for a quick, gentle check-in on you and ${babyName}?` } }
      : { phoneNumberId, customer: { number: to, name: momName }, assistant: assistant({ momName, babyName, day }) };
    const r = await fetch(`${VAPI}/call`, { method: "POST", headers: auth, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Vapi refused the call.", detail: data?.message ?? data });
    return res.status(200).json({ id: data.id, status: data.status });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach Vapi.", detail: String(e) });
  }
}
