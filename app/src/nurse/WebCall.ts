// Talk to the AI through this laptop's mic and speaker. No phone or Twilio needed.
// The public key is meant to be used in the browser; it can only start calls with our assistant.
import Vapi from "@vapi-ai/web";

const PUBLIC_KEY = "d897b27b-733c-45a0-b664-15e8da7469a6";
const ASSISTANT_ID = "59a53945-7c40-4aa1-bdb8-3d53d4a965d3";

let vapi: Vapi | null = null;

export async function startWebCall(momName: string, babyName: string): Promise<string | null> {
  vapi ??= new Vapi(PUBLIC_KEY);
  const first = momName.split(" ")[0];
  const baby = !babyName || /^baby (boy|girl)/i.test(babyName) ? "your little one" : babyName;
  const call = await vapi.start(ASSISTANT_ID, {
    firstMessage: `Hey ${first}! It's Aven, from your care team over at Forrest General. How're you and ${baby} doing today? You got a few minutes for a quick check-in?`,
    metadata: { momName },
  });
  return call?.id ?? null;
}

export function stopWebCall() {
  vapi?.stop();
}

export function onWebCallEnd(fn: () => void) {
  vapi?.on("call-end", fn);
}
