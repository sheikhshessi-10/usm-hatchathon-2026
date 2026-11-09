const topics = {
  start: "The Patient portal shows a fictional patient's check-in, care plan, and history.",
  loops: "Care loops demonstrates a staff handoff and doctor verification against matching synthetic completion evidence.",
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const model = process.env.CAREBRIDGE_GUIDE_MODEL;
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  const accessCode = process.env.CAREBRIDGE_GUIDE_ACCESS_CODE;
  if (!model || !token || !accessCode) {
    return res.status(503).json({ error: "Live guide unavailable" });
  }
  if (req.headers.authorization !== `Bearer ${accessCode}`) {
    return res.status(401).json({ error: "Guide access required" });
  }
  const topic = req.body?.topic;
  if (typeof topic !== "string" || !Object.hasOwn(topics, topic)) {
    return res.status(400).json({ error: "Unknown guide topic" });
  }

  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model,
        messages: [{
          role: "system",
          content: "You explain a fictional AVENLYTH software demo. Restate the provided fact in one short sentence. Give no medical guidance and invent no capabilities.",
        }, { role: "user", content: topics[topic] }],
        max_tokens: 100,
      }),
    });
    if (!response.ok) return res.status(502).json({ error: "Live guide unavailable" });
    const reply = (await response.json()).choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim() || reply.length > 500) {
      return res.status(502).json({ error: "Live guide unavailable" });
    }
    return res.status(200).json({ reply: reply.trim() });
  } catch {
    return res.status(502).json({ error: "Live guide unavailable" });
  }
}
