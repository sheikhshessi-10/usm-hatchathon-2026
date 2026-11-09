import { describe, expect, it } from "vitest";
import { channels, replayExample } from "./examples";

describe.each(channels)("$title sample protocol", ({ id }) => {
  it("schedules the agreed appointment without verifying attendance", () => {
    const { interaction, episode, messages, audit } = replayExample(id, "routine");
    expect(interaction.channel).toBe(id);
    expect(interaction.endpoint).toBe("information_collected");
    expect(episode.state).toBe("scheduled");
    expect(episode.scheduledAt).toBe("2026-11-13T16:00:00Z");
    expect(messages.some(message => message.text.includes("Friday, November 13 at 10 a.m. Central"))).toBe(true);
    expect(episode.verifiedAt).toBeUndefined();
    expect(episode.tasks).toHaveLength(0);
    expect(audit.every(entry => entry.allowed)).toBe(true);
  });

  it("stops routine prompts and keeps the case open after staff acknowledgement", () => {
    const queued = replayExample(id, "urgent");
    expect(queued.interaction.endpoint).toBe("urgent_escalation_initiated");
    expect(queued.interaction.messages).toHaveLength(3);
    expect(queued.messages[queued.messages.length - 1]?.text).toContain("Call 911 now");
    expect(queued.messages.some(message => message.text.includes("November 13"))).toBe(false);
    expect(queued.episode.scheduledAt).toBeUndefined();
    expect(queued.episode.tasks).toMatchObject([{ kind: "safety_review", state: "requested" }]);
    const accepted = replayExample(id, "urgent", true);
    expect(accepted.episode.tasks).toMatchObject([{ kind: "safety_review", state: "accepted" }]);
    expect(accepted.episode.state).toBe("handoff_requested");
    expect(accepted.episode.verifiedAt).toBeUndefined();
  });
});
