import { applyEvent, seedEpisodes, type Channel, type Command } from "../episodes/engine";

export type Scenario = "routine" | "urgent";

export const channels = [
  {
    id: "voice",
    title: "Phone call",
    subtitle: "Transcript",
    opening: "Hi, this is CareBridge, your automated follow-up assistant. Is now a good time for a quick check-in?",
    protocol: [
      "Confirm identity and permission to speak before discussing the care plan.",
      "Read back important details. If the call is missed or interrupted, record the attempt and route an authorized retry for staff review.",
    ],
  },
  {
    id: "sms",
    title: "Text message",
    subtitle: "SMS preview",
    opening: "Hi from CareBridge. Ready for a quick follow-up check-in? Reply STOP to stop outreach.",
    protocol: [
      "Use the consented number and keep reminders generic. Leave sensitive details for the authenticated portal.",
      "Honor STOP and record delivery or reply status separately. An unanswered text leaves follow-up open.",
    ],
  },
  {
    id: "app",
    title: "AI agent",
    subtitle: "Portal chat",
    opening: "Hi, I’m CareBridge, your automated follow-up assistant. How is your follow-up going?",
    protocol: [
      "Use only the patient’s own context after identity confirmation. Explain the agent’s role and keep questions within the care plan.",
      "Route clinical questions or repeated misunderstandings to staff. Do not interpret results or change medication.",
    ],
  },
] as const satisfies ReadonlyArray<{
  id: Channel;
  title: string;
  subtitle: string;
  opening: string;
  protocol: readonly string[];
}>;

const routineReplies: Record<Channel, string> = {
  voice: "Yes, now is fine. I finished the screening this morning.",
  sms: "I completed the test this morning.",
  app: "I finished my screening this morning. Can you log that for my team?",
};

const urgentReplies: Record<Channel, string> = {
  voice: "I know you’re calling about the visit, but I suddenly have chest pain and can't breathe.",
  sms: "I have chest pain and I can't breathe.",
  app: "Before we talk about the appointment, I need help. I have chest pain and can't breathe.",
};

export function replayExample(channel: Channel, scenario: Scenario, accepted = false) {
  const initial = seedEpisodes();
  const { id: episodeId, patientId, protocolVersion } = initial.episodes[0];
  const reply = (scenario === "routine" ? routineReplies : urgentReplies)[channel];
  const commands: Command[] = [
    { type: "confirm_identity" },
    { type: "start", channel },
    { type: "say", text: reply },
  ];
  if (scenario === "routine") commands.push({ type: "finish" });
  if (scenario === "urgent" && accepted) {
    commands.push({ type: "accept_handoff", taskId: "sample-2-task" });
  }
  const start = Date.UTC(2026, 10, 9, 15);
  const state = commands.reduce((current, command, index) => applyEvent(current, {
    id: `sample-${index}`,
    episodeId,
    protocolVersion,
    at: new Date(start + index * 15000).toISOString(),
    actor: command.type === "say" ? { role: "patient", patientId } : { role: "coordinator" },
    command,
  }), initial);
  const episode = state.episodes[0];
  return { patient: state.patients[0], episode, interaction: episode.interactions[0], audit: state.audit };
}
