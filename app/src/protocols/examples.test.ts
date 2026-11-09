import { describe, expect, it } from "vitest";
import { channels, replayExample } from "./examples";

describe.each(channels)("$title sample protocol", ({ id }) => {
  it("records a routine report without verifying completion", () => {
    const { interaction, episode, audit } = replayExample(id, "routine");
    expect(interaction.channel).toBe(id);
    expect(interaction.endpoint).toBe("information_collected");
    expect(episode.state).toBe("completion_reported");
    expect(episode.verifiedAt).toBeUndefined();
    expect(episode.tasks).toHaveLength(0);
    expect(audit.every(entry => entry.allowed)).toBe(true);
  });

  it("stops routine prompts and keeps the case open after staff acknowledgement", () => {
    const queued = replayExample(id, "urgent");
    expect(queued.interaction.endpoint).toBe("urgent_escalation_initiated");
    expect(queued.interaction.messages).toHaveLength(3);
    expect(queued.episode.tasks).toMatchObject([{ kind: "safety_review", state: "requested" }]);
    const accepted = replayExample(id, "urgent", true);
    expect(accepted.episode.tasks).toMatchObject([{ kind: "safety_review", state: "accepted" }]);
    expect(accepted.episode.state).toBe("handoff_requested");
    expect(accepted.episode.verifiedAt).toBeUndefined();
  });
});
