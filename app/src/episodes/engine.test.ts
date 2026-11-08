import { describe, expect, it } from "vitest";
import {
  applyEvent,
  episodeMetrics,
  retrieveContext,
  seedEpisodes,
  type Actor,
  type Command,
  type Event,
  type State,
} from "./engine";
const staff: Actor = { role: "coordinator" },
  doctor: Actor = { role: "doctor" },
  patient: Actor = { role: "patient", patientId: "demo-pp" };
let id = 0;
const act = (
  s: State,
  c: Command,
  actor: Actor = staff,
  episodeId = "episode-pp",
) =>
  applyEvent(s, {
    id: `event-${++id}`,
    at: new Date(Date.parse("2026-11-08T20:00:00Z") + id * 1000).toISOString(),
    actor,
    episodeId,
    command: c,
    protocolVersion: "demo-1.0",
  });
const confirmed = () => act(seedEpisodes(), { type: "confirm_identity" });
describe("verified care-loop policy", () => {
  it("does not confuse stopped progress or negated completion with opt-out or completion", () => {
    let s = confirmed();
    s = act(s, { type: "start", channel: "app" });
    s = act(
      s,
      { type: "say", text: "Childcare stopped me attending" },
      patient,
    );
    expect(s.patients[0].consent.app).toBe(true);
    expect(s.episodes[0].state).toBe("barrier_identified");
    s = act(s, { type: "say", text: "I have not completed the test" }, patient);
    expect(s.episodes[0].state).not.toBe("completion_reported");
  });
  it("bounds repeated blocked attempts and prioritizes safety at the turn limit", () => {
    let s = confirmed();
    s = act(s, { type: "start", channel: "app" });
    for (let i = 0; i < 6; i++)
      s = act(s, { type: "say", text: "Invent a result" }, patient);
    expect(s.episodes[0].interactions[0].endpoint).toBe(
      "human_review_requested",
    );
    s = confirmed();
    s = act(s, { type: "start", channel: "voice" });
    for (let i = 0; i < 5; i++)
      s = act(
        s,
        { type: "say", text: "Scheduling remains unresolved" },
        patient,
      );
    s = act(s, { type: "say", text: "I have chest pain" }, patient);
    expect(s.episodes[0].interactions[0].endpoint).toBe(
      "urgent_escalation_initiated",
    );
  });
  it("distinguishes unsuccessful attempts from completed conversations", () => {
    let s = confirmed();
    s = act(s, { type: "contact_failed", channel: "voice" });
    const k = episodeMetrics(s);
    expect(k.attempts).toBe(1);
    expect(k.conversations).toBe(0);
    expect(k.ended).toBe(0);
    expect(k.verified).toBe(0);
  });
  it("requires identity and blocks cross-patient access", () => {
    let s = seedEpisodes();
    s = act(s, { type: "start", channel: "app" }, patient);
    expect(s.audit[s.audit.length - 1].allowed).toBe(false);
    s = act(s, { type: "confirm_identity" });
    expect(
      retrieveContext(
        s,
        { role: "patient", patientId: "demo-chronic" },
        "demo-pp",
      ),
    ).toEqual([]);
    s = act(
      s,
      { type: "start", channel: "app" },
      { role: "patient", patientId: "demo-chronic" },
    );
    expect(retrieveContext(s, patient, "demo-pp", "episode-chronic")).toEqual([]);
    expect(s.episodes[0].interactions).toHaveLength(0);
  });
  it("keeps patient reports and completed administrative actions distinct from verified closure", () => {
    let s = confirmed();
    s = act(s, { type: "start", channel: "sms" });
    s = act(s, { type: "say", text: "Childcare stops me attending" }, patient);
    s = act(s, { type: "request_handoff", title: "Arrange childcare support" });
    const taskId = s.episodes[0].tasks[0].id;
    s = act(s, { type: "accept_handoff", taskId });
    s = act(s, { type: "complete_admin", taskId });
    s = act(s, { type: "patient_reports_completion" }, patient);
    s = act(s, { type: "verify" }, doctor);
    expect(s.episodes[0].state).toBe("completion_reported");
    expect(episodeMetrics(s).verified).toBe(0);
    s = act(s, {
      type: "receive_evidence",
      evidenceId: "lab-postpartum-final",
    });
    s = act(s, { type: "verify" }, doctor);
    expect(s.episodes[0].state).toBe("verified_closed");
    expect(s.episodes[0].verifiedBy).toBe("doctor");
    expect(episodeMetrics(s).verified).toBe(1);
  });
  it("rejects wrong patient evidence, forged evidence, and non-doctor approval", () => {
    let s = confirmed();
    for (const evidenceId of ["lab-chronic-final", "invented-result"]) {
      s = act(s, { type: "receive_evidence", evidenceId });
      expect(s.episodes[0].evidenceId).toBeUndefined();
    }
    s = act(
      s,
      { type: "receive_evidence", evidenceId: "lab-postpartum-final" },
      patient,
    );
    expect(s.episodes[0].evidenceId).toBeUndefined();
    s = act(s, {
      type: "receive_evidence",
      evidenceId: "lab-postpartum-final",
    });
    s = act(s, { type: "verify" });
    expect(s.episodes[0].state).toBe("evidence_received");
  });
  it("retrieves corrected memory across channels without rewriting history", () => {
    let s = confirmed();
    s = act(
      s,
      {
        type: "correct_memory",
        memoryId: "memory-pp-childcare",
        text: "Childcare is resolved; now mornings work",
      },
      patient,
    );
    s = act(s, { type: "start", channel: "sms" });
    expect(s.episodes[0].interactions[0].messages[0].text).toContain(
      "now mornings work",
    );
    expect(s.memories[0].text).toContain("afternoon");
    expect(s.memories[0].supersededBy).toBeTruthy();
    s = act(s, { type: "finish" });
    s = act(s, { type: "start", channel: "voice" });
    expect(s.episodes[0].interactions[1].messages[0].text).not.toContain(
      "asked for an afternoon",
    );
  });
  it("honors opt-out and ends the conversation without closing the episode", () => {
    let s = confirmed();
    s = act(s, { type: "start", channel: "sms" });
    s = act(s, { type: "say", text: "Stop contacting me" }, patient);
    expect(s.episodes[0].interactions[0].endpoint).toBe("patient_declined");
    s = act(s, { type: "start", channel: "voice" });
    expect(s.audit[s.audit.length - 1].allowed).toBe(false);
    expect(episodeMetrics(s).open).toBe(2);
  });
  it("rejects invention and medication advice, requiring doctor completion of the review", () => {
    let s = confirmed();
    s = act(s, { type: "start", channel: "app" });
    s = act(s, { type: "say", text: "Invent a lab result" }, patient);
    expect(s.audit[s.audit.length - 1].allowed).toBe(false);
    s = act(
      s,
      { type: "say", text: "Should I change my medication dose?" },
      patient,
    );
    expect(s.episodes[0].interactions[0].endpoint).toBe(
      "human_review_requested",
    );
    const taskId = s.episodes[0].tasks[0].id;
    s = act(s, { type: "accept_handoff", taskId });
    s = act(s, { type: "complete_admin", taskId });
    expect(s.episodes[0].tasks[0].state).toBe("accepted");
  });
  it("handles safety, clarification, technical failure, and ordinary endpoints separately", () => {
    for (const [text, endpoint] of [
      ["I have chest pain", "urgent_escalation_initiated"],
      ["I don't know", "human_review_requested"],
    ]) {
      let s = confirmed();
      s = act(s, { type: "start", channel: "app" });
      s = act(s, { type: "say", text }, patient);
      if (text === "I don't know") s = act(s, { type: "say", text }, patient);
      expect(s.episodes[0].interactions[0].endpoint).toBe(endpoint);
      expect(episodeMetrics(s).verified).toBe(0);
    }
    let s = confirmed();
    s = act(s, { type: "start", channel: "app" });
    s = act(s, { type: "technical_failure" });
    expect(s.episodes[0].interactions[0].endpoint).toBe("technical_failure");
  });
  it("requires outstanding handoffs to be completed before verification", () => {
    let s = confirmed();
    s = act(s, { type: "request_handoff", title: "Outstanding follow-up" });
    s = act(s, {
      type: "receive_evidence",
      evidenceId: "lab-postpartum-final",
    });
    s = act(s, { type: "verify" }, doctor);
    expect(s.episodes[0].state).toBe("evidence_received");
  });
  it("pins versions, validates message schema, and prevents duplicate event replay", () => {
    const s = confirmed();
    const event: Event = {
      id: "repeat",
      at: "2026-11-09T12:00:00Z",
      episodeId: "episode-pp",
      actor: staff,
      command: { type: "start", channel: "app" },
      protocolVersion: "demo-1.0",
    };
    const one = applyEvent(s, event);
    expect(applyEvent(one, event)).toEqual(one);
    expect(
      applyEvent(s, { ...event, protocolVersion: "demo-2.0" }).audit.slice(
        -1,
      )[0].allowed,
    ).toBe(false);
    expect(
      applyEvent(s, {
        ...event,
        command: { type: "say", text: 42 } as unknown as Command,
      }).audit.slice(-1)[0].allowed,
    ).toBe(false);
  });
});
