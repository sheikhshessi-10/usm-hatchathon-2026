export const companionTopics = ["Where do I start?", "How do care loops work?", "Who can see this chat?"];

export type CompanionReply = { text: string; link?: { href: string; label: string } };

export function companionReply(message: string): CompanionReply {
  const text = message.toLowerCase();
  if (/\b(emergency|suicid\w*|self.harm|can.t breathe|severe bleeding|chest pain)\b/.test(text)) {
    return { text: "If someone is in immediate danger, contact local emergency services now. This demo chat cannot reach a care team or emergency services." };
  }
  if (/\b(symptoms?|medic\w*|dose|diagnos\w*|treatment|prescri\w*|pain|bleeding|fever|should i take)\b/.test(text)) {
    return { text: "I can help you find your way around CareBridge. For personal health questions, contact your healthcare professional." };
  }
  if (/\b(privacy|data|stored|storage|private|who can see|real)\b/.test(text)) {
    return { text: "This chat runs in your browser. It stays open while you explore and clears on reload. Please use fictional information only." };
  }
  if (/\b(care loops?|evidence|verif\w*|handoff)\b/.test(text)) {
    return { text: "In Care loops, a fictional patient report starts the workflow. The doctor demo role checks matching evidence before closing an episode.", link: { href: "#episodes", label: "Explore Care loops" } };
  }
  if (/\b(reports?|metrics?|results|export)\b/.test(text)) {
    return { text: "Reports shows the fictional cohort’s follow-up measures and explains what counts toward each one.", link: { href: "#reports", label: "Open Reports" } };
  }
  if (/\b(patient|visit|check.in|appointments?|start)\b/.test(text)) {
    return { text: "Start in the Patient portal. You can explore a fictional patient’s daily check-in and care plan.", link: { href: "#mom", label: "Open Patient portal" } };
  }
  return { text: "I’m Pip, your demo guide. Ask me about getting started, the Patient portal, Care loops, Reports, or chat privacy." };
}
