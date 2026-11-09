import { expect, it } from "vitest";
import { companionReply, companionTopics } from "./companionReplies";

it("provides a relevant answer for each starter prompt", () => {
  expect(companionReply(companionTopics[0]).link?.href).toBe("#mom");
  expect(companionReply(companionTopics[1]).link?.href).toBe("#episodes");
  expect(companionReply(companionTopics[2]).text).toContain("clears on reload");
});

it("prioritizes health and emergency boundaries over workspace keywords", () => {
  expect(companionReply("Do the reports tell me what dose to take?").link).toBeUndefined();
  expect(companionReply("Chest pain during a check-in").text).toContain("emergency services");
});
