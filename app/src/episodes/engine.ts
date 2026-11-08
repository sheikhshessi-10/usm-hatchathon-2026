/** Deterministic demo policy/workflow engine. No model or external clinical integration. */
export type Role = "patient" | "coordinator" | "doctor";
export type Channel = "app" | "sms" | "voice";
export type Actor = { role: Role; patientId?: string };
export type EpisodeState =
  | "pending"
  | "contacted"
  | "barrier_identified"
  | "handoff_requested"
  | "scheduled"
  | "completion_reported"
  | "evidence_received"
  | "verified_closed";
export type Endpoint =
  | "active"
  | "information_collected"
  | "human_review_requested"
  | "urgent_escalation_initiated"
  | "patient_declined"
  | "technical_failure"
  | "retry_required"
  | "contact_unsuccessful";
export type Memory = {
  episodeId: string;
  recordedBy: Role;
  retention: "until_demo_reset";
  id: string;
  patientId: string;
  text: string;
  source: "patient_report" | "institution_record";
  at: string;
  verification: "reported" | "verified_fixture";
  permission: "care_coordination";
  supersededBy?: string;
  protocolVersion: string;
};
export type Message = { who: "patient" | "system"; text: string; at: string };
export type Interaction = {
  id: string;
  channel: Channel;
  startedAt: string;
  endedAt?: string;
  endpoint: Endpoint;
  messages: Message[];
  simulatedSeconds: number;
  clarifications: number;
};
export type Episode = {
  id: string;
  patientId: string;
  orderId: string;
  protocolId: string;
  protocolVersion: string;
  state: EpisodeState;
  scheduledAt?: string;
  evidenceId?: string;
  verifiedAt?: string;
  verifiedBy?: "doctor";
  interactions: Interaction[];
  tasks: {
    id: string;
    title: string;
    kind: "administrative" | "clinical_review" | "safety_review";
    state: "requested" | "accepted" | "completed";
  }[];
};
export type Patient = {
  id: string;
  name: string;
  age: number;
  population: string;
  identityConfirmed: boolean;
  consent: Record<Channel, boolean>;
  preferredChannel: Channel;
};
export type Audit = {
  id: string;
  at: string;
  actor: Role;
  patientId: string;
  episodeId: string;
  action: string;
  allowed: boolean;
  reason: string;
  protocolVersion: string;
};
export type State = {
  patients: Patient[];
  episodes: Episode[];
  memories: Memory[];
  audit: Audit[];
};
export const PROTOCOLS = [
  {
    id: "postpartum-screening",
    version: "demo-1.0",
    title: "Postpartum screening coordination",
    owner: "Demo obstetric coordination team",
    status: "Demonstration only — not clinically approved",
    maxTurns: 6,
    maxClarifications: 2,
    objective: "Coordinate an existing synthetic postpartum screening order",
    questions: [
      "What is preventing you from attending?",
      "Would scheduling or access support help?",
    ],
    allowed: [
      "record patient report",
      "create administrative task",
      "schedule synthetic appointment",
      "request human review",
    ],
    evidence:
      "Matching synthetic order, patient, final lab completion record, completed handoffs, and doctor verification",
  },
  {
    id: "chronic-lab",
    version: "demo-1.0",
    title: "Routine chronic-care laboratory follow-up",
    owner: "Demo primary care coordination team",
    status: "Demonstration only — not clinically approved",
    maxTurns: 6,
    maxClarifications: 2,
    objective: "Coordinate an existing synthetic routine lab order",
    questions: [
      "Was the earlier scheduling request resolved?",
      "Would you prefer app, SMS, or a voice interaction?",
    ],
    allowed: [
      "record patient report",
      "create administrative task",
      "schedule synthetic appointment",
      "request human review",
    ],
    evidence:
      "Matching synthetic order, patient, final lab completion record, completed handoffs, and doctor verification",
  },
] as const;
export const FIXTURES = [
  {
    id: "lab-postpartum-final",
    patientId: "demo-pp",
    orderId: "ORDER-PP-001",
    kind: "lab_completion",
    status: "final",
    at: "2026-11-08T13:00:00Z",
    provenance: "Synthetic clinical record fixture — not an EHR connection",
  },
  {
    id: "lab-chronic-final",
    patientId: "demo-chronic",
    orderId: "ORDER-CH-001",
    kind: "lab_completion",
    status: "final",
    at: "2026-11-08T13:30:00Z",
    provenance: "Synthetic clinical record fixture — not an EHR connection",
  },
] as const;
export function seedEpisodes(): State {
  return {
    patients: [
      {
        id: "demo-pp",
        name: "Maya Walker",
        age: 29,
        population: "Postpartum screening follow-up",
        identityConfirmed: false,
        consent: { app: true, sms: true, voice: true },
        preferredChannel: "app",
      },
      {
        id: "demo-chronic",
        name: "Daniel Brooks",
        age: 62,
        population: "Routine chronic-care follow-up",
        identityConfirmed: false,
        consent: { app: true, sms: true, voice: true },
        preferredChannel: "sms",
      },
    ],
    episodes: [
      {
        id: "episode-pp",
        patientId: "demo-pp",
        orderId: "ORDER-PP-001",
        protocolId: "postpartum-screening",
        protocolVersion: "demo-1.0",
        state: "pending",
        interactions: [],
        tasks: [],
      },
      {
        id: "episode-chronic",
        patientId: "demo-chronic",
        orderId: "ORDER-CH-001",
        protocolId: "chronic-lab",
        protocolVersion: "demo-1.0",
        state: "pending",
        interactions: [],
        tasks: [],
      },
    ],
    memories: [
      {
        id: "memory-pp-childcare",
        episodeId: "episode-pp", recordedBy: "coordinator", retention: "until_demo_reset",
        patientId: "demo-pp",
        text: "Childcare prevented attendance; asked for an afternoon appointment.",
        source: "patient_report",
        at: "2026-11-06T14:00:00Z",
        verification: "reported",
        permission: "care_coordination",
        protocolVersion: "demo-1.0",
      },
      {
        id: "memory-chronic-scheduling",
        episodeId: "episode-chronic", recordedBy: "coordinator", retention: "until_demo_reset",
        patientId: "demo-chronic",
        text: "Earlier scheduling request remains unresolved; patient prefers SMS before a call.",
        source: "patient_report",
        at: "2026-11-06T15:00:00Z",
        verification: "reported",
        permission: "care_coordination",
        protocolVersion: "demo-1.0",
      },
    ],
    audit: [],
  };
}
export type Command =
  | { type: "confirm_identity" }
  | { type: "start"; channel: Channel }
  | { type: "contact_failed"; channel: Channel }
  | { type: "say"; text: string }
  | { type: "finish" }
  | { type: "technical_failure" }
  | { type: "request_handoff"; title: string }
  | { type: "accept_handoff"; taskId: string }
  | { type: "complete_admin"; taskId: string }
  | { type: "schedule"; at: string }
  | { type: "patient_reports_completion" }
  | { type: "receive_evidence"; evidenceId: string }
  | { type: "verify" }
  | { type: "correct_memory"; memoryId: string; text: string };
export type Event = {
  id: string;
  at: string;
  episodeId: string;
  actor: Actor;
  command: Command;
  protocolVersion?: string;
};
export function retrieveContext(
  state: State,
  actor: Actor,
  patientId: string,
  episodeId?: string,
): Memory[] {
  if (!["patient", "coordinator", "doctor"].includes(actor.role)) return [];
  const p = state.patients.find((p) => p.id === patientId);
  if (
    !p?.identityConfirmed ||
    (actor.role === "patient" && actor.patientId !== patientId)
  )
    return [];
  return state.memories.filter(
    (m) =>
      m.patientId === patientId &&
      m.permission === "care_coordination" &&
      (!episodeId || m.episodeId === episodeId) &&
      !m.supersededBy,
  );
}
export function applyEvent(previous: State, event: Event): State {
  const state: State = structuredClone(previous);
  const episode = state.episodes.find((e) => e.id === event.episodeId);
  const patient = state.patients.find((p) => p.id === episode?.patientId);
  if (!episode || !patient) return previous;
  const command = event.command;
  const log = (allowed: boolean, reason: string) => {
    state.audit.push({
      id: event.id,
      at: event.at,
      actor: event.actor.role,
      patientId: patient.id,
      episodeId: episode.id,
      action: command.type,
      allowed,
      reason,
      protocolVersion: episode.protocolVersion,
    });
    return state;
  };
  if (
    !event.id ||
    !Number.isFinite(Date.parse(event.at)) ||
    !["patient", "coordinator", "doctor"].includes(event.actor.role)
  )
    return log(false, "Invalid event metadata");
  if (state.audit.some((a) => a.id === event.id)) return previous;
  if (
    event.protocolVersion !== undefined &&
    event.protocolVersion !== episode.protocolVersion
  )
    return log(
      false,
      "Protocol version mismatch; history must not be reinterpreted",
    );
  if (
    state.audit.length &&
    Date.parse(event.at) < Date.parse(state.audit[state.audit.length - 1].at)
  )
    return log(false, "Out-of-order event timestamp");
  const requiredText: Record<string, string> = {
    say: "text",
    request_handoff: "title",
    accept_handoff: "taskId",
    complete_admin: "taskId",
    schedule: "at",
    receive_evidence: "evidenceId",
    correct_memory: "text",
  };
  const field = requiredText[command.type];
  if (
    field &&
    (typeof (command as unknown as Record<string, unknown>)[field] !==
      "string" ||
      String((command as unknown as Record<string, unknown>)[field]).length >
        1500)
  )
    return log(false, "Command schema validation failed");
  if (event.actor.role === "patient" && event.actor.patientId !== patient.id)
    return log(false, "Patient scope mismatch");
  if (command.type === "confirm_identity") {
    if (event.actor.role === "patient")
      return log(false, "Staff demo identity confirmation required");
    patient.identityConfirmed = true;
    return log(true, "Demo identity check recorded; not real authentication");
  }
  if (!patient.identityConfirmed) return log(false, "Identity not confirmed");
  const clinicalStaff =
    event.actor.role === "doctor" || event.actor.role === "coordinator";
  const closed = episode.state === "verified_closed";
  if (closed) return log(false, "Episode already verified and closed");
  const active = episode.interactions[episode.interactions.length - 1];
  const end = (endpoint: Endpoint, text: string) => {
    if (active?.endpoint === "active") {
      active.endpoint = endpoint;
      active.endedAt = event.at;
      active.messages.push({ who: "system", text, at: event.at });
    }
  };
  const memory = (
    text: string,
    source: Memory["source"] = "patient_report",
  ) => {
    state.memories.push({
      id: `${event.id}-memory`,
      episodeId: episode.id, recordedBy: event.actor.role, retention: "until_demo_reset",
      patientId: patient.id,
      text,
      source,
      at: event.at,
      verification:
        source === "institution_record" ? "verified_fixture" : "reported",
      permission: "care_coordination",
      protocolVersion: episode.protocolVersion,
    });
  };
  const handoff = (
    title: string,
    kind:
      | "administrative"
      | "clinical_review"
      | "safety_review" = "administrative",
  ) => {
    episode.tasks.push({
      id: `${event.id}-task`,
      title,
      kind,
      state: "requested",
    });
    if (!["completion_reported", "evidence_received"].includes(episode.state))
      episode.state = "handoff_requested";
  };
  switch (command.type) {
    case "contact_failed": {
      if (
        !clinicalStaff ||
        !["app", "sms", "voice"].includes(command.channel) ||
        !patient.consent[command.channel] ||
        active?.endpoint === "active"
      )
        return log(
          false,
          "A staff role, consented channel, and no active interaction are required",
        );
      episode.interactions.push({
        id: event.id,
        channel: command.channel,
        startedAt: event.at,
        endedAt: event.at,
        endpoint: "contact_unsuccessful",
        simulatedSeconds: 0,
        clarifications: 0,
        messages: [
          {
            who: "system",
            text: "Synthetic unsuccessful contact attempt; no conversation or completion is assumed. Staff can arrange an authorized retry.",
            at: event.at,
          },
        ],
      });
      return log(true, "Unsuccessful contact recorded; episode remains open");
    }
    case "start": {
      if (
        !["app", "sms", "voice"].includes(command.channel) ||
        !patient.consent[command.channel]
      )
        return log(false, "Channel not consented");
      if (active?.endpoint === "active")
        return log(
          false,
          "Finish the active interaction before switching channels",
        );
      const context = retrieveContext(state, event.actor, patient.id, episode.id)
        .map((m) => m.text)
        .join(" ");
      episode.interactions.push({
        id: event.id,
        channel: command.channel,
        startedAt: event.at,
        endpoint: "active",
        simulatedSeconds: 0,
        clarifications: 0,
        messages: [
          {
            who: "system",
            at: event.at,
            text: `This is a scripted CareBridge demonstration. ${context ? `Previously reported: ${context} ` : ""}What follow-up support do you need today?`,
          },
        ],
      });
      if (episode.state === "pending") episode.state = "contacted";
      return log(
        true,
        "Consented interaction started with patient-scoped context",
      );
    }
    case "say": {
      if (!active || active.endpoint !== "active")
        return log(false, "No active interaction");
      if (!command.text.trim() || command.text.length > 1500)
        return log(false, "Invalid message length");
      active.messages.push({
        who: "patient",
        text: command.text.trim(),
        at: event.at,
      });
      if (active.channel === "voice") active.simulatedSeconds += 30;
      const t = command.text.toLowerCase();
      const respond = (text: string) =>
        active.messages.push({ who: "system", text, at: event.at });
      const configuredProtocol = PROTOCOLS.find(
        (p) => p.id === episode.protocolId,
      )!;
      const enforceLimit = () => {
        if (
          active.endpoint === "active" &&
          active.messages.filter((m) => m.who === "patient").length >=
            configuredProtocol.maxTurns
        ) {
          handoff("Follow-up after demo interaction turn limit");
          end(
            "human_review_requested",
            "The demo interaction has reached its turn limit. Your care episode remains open and a human review request is queued.",
          );
        }
      };
      if (
        /^(stop|unsubscribe|opt.?out)[.!\s]*$|\bstop (contacting|calling|messaging)|\b(do not|don.t) contact|withdraw.*consent|\bopt.?out\b/.test(
          t,
        )
      ) {
        patient.consent = { app: false, sms: false, voice: false };
        end(
          "patient_declined",
          "Your request to stop is recorded. The underlying care episode stays open for authorized staff review.",
        );
        return log(true, "Opt-out respected; outreach disabled");
      }
      if (
        /chest pain|cannot breathe|can't breathe|suicid|harm myself|kill myself/.test(
          t,
        )
      ) {
        handoff(
          "Urgent human review of an explicitly reported safety concern",
          "safety_review",
        );
        end(
          "urgent_escalation_initiated",
          "The ordinary demo workflow has stopped. A local review request is recorded; no emergency help has been dispatched. This prototype is not an emergency service.",
        );
        return log(
          true,
          "Safety endpoint; no autonomous clinical advice or dispatch",
        );
      }
      if (
        /invent|fake (a |the )?(lab|result)|ignore (all|previous)|other patient|reveal.*record/.test(
          t,
        )
      ) {
        respond(
          "I cannot invent results, disclose another patient's records, or bypass the workflow. An authorized record is required.",
        );
        enforceLimit();
        return log(false, "Unsupported assertion or scope request blocked");
      }
      if (
        /change.*(medicat|dose)|\bdose\b|diagnos|interpret.*result|is.*result.*normal|should i (take|stop)|\b(lab|test) results?\b/.test(
          t,
        )
      ) {
        handoff(
          "Clinical question requires an authorized professional",
          "clinical_review",
        );
        end(
          "human_review_requested",
          "I cannot diagnose, interpret your test, or change medicines. A human review request is queued; it has not been accepted yet.",
        );
        return log(
          true,
          "Out-of-scope clinical question handed to human review",
        );
      }
      if (/completed|finished|did (the |my )?(test|lab)|test.*done/.test(t)) {
        if (/\b(not|never|haven.t|didn.t|unsure)\b/.test(t)) {
          memory(command.text.trim());
          respond(
            "I recorded your statement without assuming the test is complete. Staff can clarify the outstanding follow-up.",
          );
          enforceLimit();
          return log(
            true,
            "Uncertain or negated completion recorded without a completion claim",
          );
        }
        if (episode.state !== "evidence_received")
          episode.state = "completion_reported";
        memory(command.text.trim());
        respond(
          "I have recorded that as patient-reported completion. The episode remains open until matching completion evidence is reviewed.",
        );
        enforceLimit();
        return log(
          true,
          "Patient statement recorded without verifying clinical completion",
        );
      }
      if (/childcare|transport|ride|schedul|appointment|frustrat/.test(t)) {
        memory(command.text.trim());
        if (
          !["completion_reported", "evidence_received"].includes(episode.state)
        )
          episode.state = "barrier_identified";
        respond(
          "I have recorded that reported barrier. Staff can create a coordination action; this does not establish that the barrier has been resolved.",
        );
      } else {
        active.clarifications++;
        if (active.clarifications >= configuredProtocol.maxClarifications) {
          handoff("Human follow-up requested after repeated clarification");
          end(
            "human_review_requested",
            "I may not be understanding the support you need. I have queued a human review request and will end this demo interaction respectfully.",
          );
        } else
          respond(
            "I can record a follow-up access or scheduling concern. Would you like to describe one or request a human review?",
          );
      }
      enforceLimit();
      return log(
        true,
        "Patient report collected within the configured demo scope",
      );
    }
    case "finish":
      if (!active || active.endpoint !== "active")
        return log(false, "No active interaction");
      end(
        "information_collected",
        "Your information is recorded. The conversation has ended; the care episode remains open until its evidence requirements are met.",
      );
      return log(true, "Conversation ended separately from care episode");
    case "technical_failure":
      end(
        "technical_failure",
        "A technical problem stopped this demo interaction. Staff review or a retry is required; no action completion is assumed.",
      );
      return log(true, "Technical fallback recorded");
    case "patient_reports_completion":
      if (episode.state !== "evidence_received")
        episode.state = "completion_reported";
      memory("Patient reported completing the outstanding test.");
      return log(true, "Patient report is not completion evidence");
    case "request_handoff":
      if (!clinicalStaff || !command.title.trim())
        return log(
          false,
          "Staff action and nonblank coordination objective required",
        );
      handoff(command.title.trim());
      return log(true, "Administrative handoff requested, not accepted");
    case "accept_handoff": {
      if (!clinicalStaff) return log(false, "Staff acceptance required");
      const task = episode.tasks.find((t) => t.id === command.taskId);
      if (!task || task.state !== "requested")
        return log(false, "No pending handoff");
      task.state = "accepted";
      return log(true, "Staff accepted handoff; clinical episode remains open");
    }
    case "complete_admin": {
      if (!clinicalStaff) return log(false, "Staff action required");
      const task = episode.tasks.find((t) => t.id === command.taskId);
      if (!task || task.state !== "accepted")
        return log(false, "Accepted handoff required");
      if (task.kind !== "administrative" && event.actor.role !== "doctor")
        return log(
          false,
          "Doctor role required to document completion of clinical or safety review",
        );
      task.state = "completed";
      return log(true, "Handoff action completed; care episode remains open");
    }
    case "schedule":
      if (
        !clinicalStaff ||
        !Number.isFinite(Date.parse(command.at)) ||
        Date.parse(command.at) < Date.parse(event.at)
      )
        return log(
          false,
          "Staff action and a valid non-past appointment required",
        );
      if (episode.state === "evidence_received")
        return log(
          false,
          "Completion evidence is already awaiting verification",
        );
      episode.scheduledAt = command.at;
      episode.state = "scheduled";
      return log(true, "Synthetic appointment recorded, not attended");
    case "receive_evidence": {
      if (!clinicalStaff)
        return log(false, "Authorized staff evidence reconciliation required");
      const evidence = FIXTURES.find((f) => f.id === command.evidenceId);
      if (
        !evidence ||
        evidence.patientId !== patient.id ||
        evidence.orderId !== episode.orderId ||
        evidence.status !== "final" ||
        Date.parse(evidence.at) > Date.parse(event.at)
      )
        return log(
          false,
          "Evidence must match patient, order, final status, and chronology",
        );
      episode.evidenceId = evidence.id;
      episode.state = "evidence_received";
      memory(
        `Matching final lab-completion fixture ${evidence.id}; no test result is interpreted.`,
        "institution_record",
      );
      return log(true, "Synthetic clinical completion evidence received");
    }
    case "verify": {
      const evidence = FIXTURES.find((f) => f.id === episode.evidenceId);
      if (episode.tasks.some((t) => t.state !== "completed"))
        return log(
          false,
          "Outstanding handoffs require documented completion before episode closure",
        );
      if (
        event.actor.role !== "doctor" ||
        episode.state !== "evidence_received" ||
        !evidence ||
        evidence.patientId !== patient.id ||
        evidence.orderId !== episode.orderId ||
        !PROTOCOLS.some(
          (p) =>
            p.id === episode.protocolId &&
            p.version === episode.protocolVersion,
        )
      )
        return log(
          false,
          "Doctor approval and matching protocol-versioned evidence required",
        );
      end(
        "information_collected",
        "Matching synthetic completion evidence has been verified by the demo doctor role.",
      );
      episode.state = "verified_closed";
      episode.verifiedAt = event.at;
      episode.verifiedBy = "doctor";
      return log(true, "Evidence-backed synthetic care-loop closure verified");
    }
    case "correct_memory": {
      const old = state.memories.find(
        (m) =>
          m.id === command.memoryId &&
          m.patientId === patient.id &&
          !m.supersededBy,
      );
      if (!old || !command.text.trim() || old.source !== "patient_report")
        return log(
          false,
          "An active patient-reported memory and correction text are required",
        );
      old.supersededBy = `${event.id}-memory`;
      memory(command.text.trim());
      return log(
        true,
        "Correction superseded the old report without rewriting history",
      );
    }
  }
  return log(false, "Unknown action blocked");
}
export function episodeMetrics(state: State) {
  const interactions = state.episodes.flatMap((e) => e.interactions),
    closed = state.episodes.filter(
      (e) => e.state === "verified_closed" && e.evidenceId && e.verifiedAt,
    );
  const elapsed = closed
    .map(
      (e) =>
        (Date.parse(e.verifiedAt!) -
          Date.parse(e.interactions[0]?.startedAt ?? e.verifiedAt!)) /
        3600000,
    )
    .filter((n) => n >= 0);
  return {
    episodes: state.episodes.length,
    processed: state.episodes.filter(
      (e) => e.state !== "pending" || e.interactions.length > 0,
    ).length,
    verified: closed.length,
    open: state.episodes.length - closed.length,
    evidencePending: state.episodes.filter(
      (e) => e.state === "evidence_received",
    ).length,
    patientReported: state.episodes.filter(
      (e) => e.state === "completion_reported",
    ).length,
    attempts: interactions.length,
    conversations: interactions.filter(
      (i) => i.endpoint !== "contact_unsuccessful",
    ).length,
    ended: interactions.filter(
      (i) => i.endpoint !== "active" && i.endpoint !== "contact_unsuccessful",
    ).length,
    handoffs: state.episodes.flatMap((e) => e.tasks).length,
    accepted: state.episodes
      .flatMap((e) => e.tasks)
      .filter((t) => t.state !== "requested").length,
    blocked: state.audit.filter((a) => !a.allowed).length,
    auditEvents: state.audit.length,
    elapsedHours: elapsed.length
      ? elapsed.reduce((a, b) => a + b, 0) / elapsed.length
      : null,
    simulatedVoiceMinutes: interactions
      .filter((i) => i.channel === "voice")
      .reduce((n, i) => n + i.simulatedSeconds / 60, 0),
    smsMessages: interactions
      .filter((i) => i.channel === "sms")
      .reduce((n, i) => n + i.messages.length, 0),
  };
}
