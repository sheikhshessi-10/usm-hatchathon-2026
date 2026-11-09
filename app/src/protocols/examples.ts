import { applyEvent, seedEpisodes, type Channel, type Command, type Message } from "../episodes/engine";

export type Scenario = "routine" | "urgent";

export const channels = [
  {
    id: "voice",
    title: "Phone call",
    subtitle: "Transcript",
    opening: "Hey Maya, it’s the CareBridge assistant. Just checking up on you. You got a sec?",
    routine: [
      "Cool, Friday at 10 a.m. Central it is. I’ve got you down.",
      "Alright, I’ll let you get back to your day. Take care, Maya.",
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
    opening: "Hey! Just checking up on you. How’s today going? — CareBridge\n\nReply STOP to opt out.",
    routine: [
      "Yep, you’re down for Friday at 10 a.m. Central.",
      "Anytime. Hope you get a minute to put your feet up today.",
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
    opening: "Hey Maya! It’s the CareBridge assistant. How’re you doing today?",
    routine: [
      "Sounds good. I’ve got you down for Friday at 10 a.m. Central.",
      "You got it, Maya. Take care.",
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

type DialogueLine = Omit<Message, "at">;

const assistant = (text: string): DialogueLine => ({ who: "system", text });
const patientReply = (text: string): DialogueLine => ({ who: "patient", text });

const checkIn: Record<Channel, DialogueLine[]> = {
  voice: [
    patientReply("Yeah, I’ve got a minute. I’m just sitting down for the first time today."),
    assistant("I hear you. Hey, did you get a chance to take the meds your doctor prescribed today?"),
    patientReply("Yeah, I took it with breakfast."),
    assistant("Gotcha. What about that pain you mentioned last time? How’s it feeling today?"),
  ],
  sms: [
    patientReply("Hey! Hanging in there. It’s been a busy morning."),
    assistant("Sounds like a lot. Did you get a chance to take the meds your doctor prescribed?"),
    patientReply("Yep, took it this morning."),
    assistant("Got it. How’s the pain today? Any better or worse?"),
  ],
  app: [
    patientReply("I’m doing okay. A little tired, but I’ve got a minute."),
    assistant("Yeah, I hear you. Did you manage to take the meds your doctor prescribed this morning?"),
    patientReply("Yes, I took it with breakfast. Thanks for checking."),
    assistant("Okay, got it. And that pain from yesterday, how’s it feeling now?"),
  ],
};

const routineReplies: Record<Channel, string> = {
  voice: "It’s a bit better today. I still need an appointment for the screening, though. Mornings are easier if my sister can drive me.",
  sms: "A little better today. I still need an appointment. Mornings are easier for me.",
  app: "It’s a little better than yesterday. I haven’t made my screening appointment yet. Can you help me find a morning slot?",
};

const urgentReplies: Record<Channel, string> = {
  voice: "Actually, something’s really wrong right now. My chest hurts all of a sudden and I can't breathe.",
  sms: "It changed suddenly. I have chest pain and I can't breathe.",
  app: "Something feels really wrong. I have chest pain and I can't breathe.",
};

const urgentResponse: Record<Channel, string> = {
  voice: "Maya, I’m glad you told me. Call 911 now. Tell them where you are, that your chest hurts and you’re having trouble breathing, and that you recently gave birth.",
  sms: "Call 911 now. Tell them where you are, what’s happening, and that you recently gave birth. Don’t wait for a text back.",
  app: "Maya, I’m glad you told me. Call 911 now. Tell them where you are, what’s happening, and that you recently gave birth. Don’t wait here for a reply.",
};

const appointment = {
  first: "Thursday, November 12 at 2:30 p.m. Central",
  alternate: "Friday, November 13 at 10 a.m. Central",
  confirmedAt: "2026-11-13T16:00:00Z",
};

function sampleDialogue(channel: Channel, scenario: Scenario, reply: string): DialogueLine[] {
  const copy = channels.find(item => item.id === channel)!;
  const opening = [assistant(copy.opening), ...checkIn[channel], patientReply(reply)];
  if (scenario === "urgent") {
    return [
      ...opening,
      assistant(urgentResponse[channel]),
    ];
  }
  return [
    ...opening,
    assistant(`Glad it’s a little better. Let’s see what’s open. Could you do ${appointment.first} work?`),
    patientReply("I can’t make that one. Is there anything Friday morning?"),
    assistant(`Yep, there’s a spot ${appointment.alternate}. Think you can get a ride for that one?`),
    patientReply("That works. I can get a ride that morning."),
    assistant(copy.routine[0]),
    patientReply("Perfect, thank you."),
    assistant(copy.routine[1]),
  ];
}

export function replayExample(channel: Channel, scenario: Scenario, accepted = false) {
  const initial = seedEpisodes();
  const { id: episodeId, patientId, protocolVersion } = initial.episodes[0];
  const reply = (scenario === "routine" ? routineReplies : urgentReplies)[channel];
  const commands: Command[] = [
    { type: "confirm_identity" },
    { type: "start", channel },
    { type: "say", text: reply },
  ];
  if (scenario === "routine") {
    commands.push({ type: "schedule", at: appointment.confirmedAt }, { type: "finish" });
  }
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
  const messages = sampleDialogue(channel, scenario, reply).map((line, index) => ({
    ...line,
    at: new Date(start + (index + 1) * 15000).toISOString(),
  }));
  return { patient: state.patients[0], episode, interaction: episode.interactions[0], messages, audit: state.audit };
}
