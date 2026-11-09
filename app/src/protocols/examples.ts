import { applyEvent, seedEpisodes, type Channel, type Command } from "../episodes/engine";

export type Scenario = "routine" | "urgent";

export const channels = [
  {
    id: "voice",
    title: "Phone call",
    subtitle: "Transcript",
    opening: "Hey Maya, it’s CareBridge, your automated check-in. Just wanted to see how you’re doing. Got a minute?",
    routine: [
      "Oh, good! I’ll make a note that you got it done. Your care team can check it once the record comes through.",
      "Thanks for picking up, Maya. Hope you get a little time for yourself today.",
    ],
    protocol: [
      "Confirm identity and permission to speak before discussing the care plan.",
      "Read back important details. If the call is missed or interrupted, record the attempt and route an authorized retry for staff review.",
    ],
  },
  {
    id: "sms",
    title: "Text message",
    subtitle: "SMS preview",
    opening: "Hey, just checking in. How are you holding up today? — CareBridge\n\nReply STOP to opt out.",
    routine: [
      "Thanks for the update! I’ve made a note of it. Your care team can confirm it once they have the record.",
      "Hope the rest of your day goes smoothly.",
    ],
    protocol: [
      "Use the consented number and keep reminders generic. Leave sensitive details for the authenticated portal.",
      "Honor STOP and record delivery or reply status separately. An unanswered text leaves follow-up open.",
    ],
  },
  {
    id: "app",
    title: "AI agent",
    subtitle: "Portal chat",
    opening: "Hey Maya, I’m the CareBridge assistant. Just checking in. How’s your day going?",
    routine: [
      "Of course. I’ve made a note that you went in this morning. Your care team can confirm it once the record comes through.",
      "Glad you stopped by, Maya. Take care today.",
    ],
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
  routine: readonly [string, string];
  protocol: readonly string[];
}>;

const routineReplies: Record<Channel, string> = {
  voice: "Yeah, I’ve got a minute. I got the test done this morning, actually.",
  sms: "Hey! I got the test done this morning. Glad that’s off my list.",
  app: "Pretty good, actually. I finished my screening this morning. Can you make a note of that?",
};

const urgentReplies: Record<Channel, string> = {
  voice: "Yeah, I’m glad you called. My chest hurts all of a sudden and I can't breathe.",
  sms: "I have chest pain and I can't breathe.",
  app: "Hey, something feels really wrong. I have chest pain and I can't breathe.",
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
