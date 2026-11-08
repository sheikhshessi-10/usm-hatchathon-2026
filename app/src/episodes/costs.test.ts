import { expect, it } from "vitest";
import { modeledEconomics } from "./costs";
import { seedEpisodes, applyEvent, type Command } from "./engine";
it("does not replace missing cost inputs or zero outcome denominators with zero costs", () => {
  const s = seedEpisodes();
  expect(
    modeledEconomics(s, {
      voiceRate: "",
      smsRate: "",
      humanRate: "",
      humanMinutes: "",
      overhead: "",
    }).total,
  ).toBeNull();
  const zero = modeledEconomics(s, {
    voiceRate: "0",
    smsRate: "0",
    humanRate: "0",
    humanMinutes: "0",
    overhead: "0",
  });
  expect(zero.total).toBe(0);
  expect(zero.perAttempt).toBeNull();
  expect(zero.perVerified).toBeNull();
});
it("separates modeled communication cost from fully loaded cost and verified resolution", () => {
  let s = seedEpisodes(),
    id = 0;
  const send = (episodeId: string, command: Command) => {
    s = applyEvent(s, {
      id: `cost-${++id}`,
      at: `2026-11-09T12:00:${String(id).padStart(2, "0")}Z`,
      episodeId,
      actor: { role: "doctor" },
      command,
    });
  };
  for (const [eid, channel] of [
    ["episode-pp", "sms"],
    ["episode-chronic", "voice"],
  ] as const) {
    send(eid, { type: "confirm_identity" });
    send(eid, { type: "start", channel });
    send(eid, { type: "say", text: "Scheduling is unresolved" });
  }
  const inputs = {
    voiceRate: "1",
    smsRate: "0.01",
    humanRate: "1",
    humanMinutes: "10",
    overhead: "5",
  };
  const model = modeledEconomics(s, inputs);
  expect(model.automated).toBeCloseTo(0.53);
  expect(model.total).toBeCloseTo(15.53);
  expect(model.perProcessedEpisode).toBeCloseTo(7.765);
  expect(model.perVerified).toBeNull();
  send("episode-pp", {
    type: "receive_evidence",
    evidenceId: "lab-postpartum-final",
  });
  send("episode-pp", { type: "verify" });
  expect(modeledEconomics(s, inputs).perVerified).toBeCloseTo(15.54);
});
