import { applyEvent, seedEpisodes, type Channel, type Command, type Message } from "../episodes/engine";

export type Scenario = "routine" | "urgent";

export const channels = [
  {
    id: "voice",
    title: "Phone call",
    subtitle: "Transcript",
    opening: "Hey Maya, it’s CareBridge, your automated check-in. Just wanted to see how you’re doing. Got a minute?",
    routine: [
      "Friday it is. I’ve put you down for 10 in the morning, Central time.",
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
      "Got it. You’re down for Friday at 10 a.m. Central.",
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
      "I’ve put Friday at 10 a.m. Central on your demo care plan.",
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

type DialogueLine = Omit<Message, "at">;

const assistant = (text: string): DialogueLine => ({ who: "system", text });
const patientReply = (text: string): DialogueLine => ({ who: "patient", text });

const checkIn: Record<Channel, DialogueLine[]> = {
  voice: [
    patientReply("Yeah, I’ve got a minute. I’m just sitting down for the first time today."),
    assistant("I hear you. Before you get back to things, were you able to take the medicine your doctor prescribed today?"),
    patientReply("Yeah, I took it with breakfast."),
    assistant("Thanks, I’ll make a note of that. And the pain you mentioned last time, how’s that been today?"),
  ],
  sms: [
    patientReply("Hey! Hanging in there. It’s been a busy morning."),
    assistant("I hear you. Did you get a chance to take the medicine your doctor prescribed today?"),
    patientReply("Yep, took it this morning."),
    assistant("Thanks for letting me know. Any change in the pain since we last checked in?"),
  ],
  app: [
    patientReply("I’m doing okay. A little tired, but I’ve got a minute."),
    assistant("Of course. Were you able to take the medicine your doctor prescribed this morning?"),
    patientReply("Yes, I took it with breakfast. Thanks for checking."),
    assistant("Got it. How’s the pain today compared with yesterday?"),
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
  voice: "I’m glad you told me, Maya. Please get medical care immediately. Let’s stop the check-in so you can get help.",
  sms: "I’m glad you reached out. Please get medical care immediately. Don’t wait for another text.",
  app: "I’m glad you told me. Please get medical care immediately. Don’t wait for a reply in this chat.",
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
    assistant(`I’ll note that it’s feeling a little better. Let me see what’s open. Would ${appointment.first} work?`),
    patientReply("I can’t make that one. Is there anything Friday morning?"),
    assistant(`Yes, there’s a spot ${appointment.alternate}. Would that give you enough time to get there?`),
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
