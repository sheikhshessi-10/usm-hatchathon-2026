// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../App";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let host: HTMLDivElement, root: Root;
const button = (label: string) =>
  [...host.querySelectorAll("button")].find((b) => b.textContent === label)!;
const click = async (label: string) => {
  expect(button(label), label).toBeTruthy();
  await act(async () => button(label).click());
};
const input = async (label: string, value: string) => {
  const el = [...host.querySelectorAll("input")].find(
    (el) =>
      el.getAttribute("aria-label") === label ||
      el.closest("label")?.textContent?.includes(label),
  )!;
  expect(el, label).toBeTruthy();
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const select = async (label: string, value: string) => {
  const el = [...host.querySelectorAll("select")].find((el) =>
    el.closest("label")?.textContent?.startsWith(label),
  )!;
  expect(el, label).toBeTruthy();
  await act(async () => {
    el.value = value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
};
beforeEach(async () => {
  localStorage.clear();
  location.hash = "#episodes";
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<App />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
it("demonstrates a patient report, staff action, evidence reconciliation, and doctor-only closure", async () => {
  expect(button("Start interaction").disabled).toBe(true);
  await click("Confirm demo identity");
  await select("Channel", "sms");
  await click("Start interaction");
  expect(host.textContent).toContain("Previously reported:");
  await input("Patient reply", "Childcare prevented attendance");
  await click("Send");
  await input("Coordination task", "Coordinate childcare and afternoon slot");
  await click("Request staff handoff");
  await click("Accept handoff");
  await click("Complete administrative action");
  await input("Patient reply", "I completed the test");
  await click("Send");
  expect(host.textContent).toContain("completion reported");
  expect(button("Doctor verify and close episode").disabled).toBe(true);
  await click("End information collection");
  await select("Demo role", "doctor");
  expect(button("Doctor verify and close episode").disabled).toBe(true);
  await click("Reconcile matching completion fixture");
  await click("Doctor verify and close episode");
  expect(host.textContent).toContain("verified closed");
  expect(host.textContent).toContain("1/2 · 50%");
  expect(localStorage.getItem("carebridge-care-episodes-v1")).toContain(
    "receive_evidence",
  );
});
it("uses the same chronic-care history across SMS and voice and routes medical questions", async () => {
  await select("Scenario", "episode-chronic");
  expect(host.textContent).toContain("Daniel Brooks");
  await click("Confirm demo identity");
  await select("Channel", "sms");
  await click("Start interaction");
  await input(
    "Patient reply",
    "I am frustrated because the scheduling request is unresolved",
  );
  await click("Send");
  await click("End information collection");
  await select("Channel", "voice");
  await click("Start interaction");
  expect(
    host.querySelector('[aria-label="Interaction transcript"]')!.textContent,
  ).toContain("frustrated");
  await input("Patient reply", "Should I change my medication dose?");
  await click("Send");
  expect(host.textContent).toContain("human review requested");
  expect(host.textContent).toContain("has not been accepted yet");
  expect(host.textContent).toContain("0/2 · 0%");
});
it("discards an appointment draft when switching patients", async () => {
  const appointment = "Synthetic appointment time";
  const record = "Record scheduled appointment";
  await click("Confirm demo identity");
  await input(appointment, "2027-01-12T15:30");
  expect(button(record).disabled).toBe(false);

  await select("Scenario", "episode-chronic");
  await click("Confirm demo identity");
  expect(host.querySelector<HTMLInputElement>('input[type="datetime-local"]')!.value).toBe("");
  expect(button(record).disabled).toBe(true);
});
it("opens the guided care loop from the public overview", async () => {
  await act(async () => {
    location.hash = "";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(host.querySelector("h1")?.textContent).toContain(
    "Follow-up that reaches a verified outcome",
  );
  const start = host.querySelector<HTMLAnchorElement>('main a[href="#episodes"]')!;
  expect(start.textContent).toContain("Start the care-loop demo");

  await act(async () => {
    location.hash = start.hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(host.querySelector('nav a[aria-current="page"]')?.textContent).toBe(
    "Care loops",
  );
  expect(host.textContent).toContain("Walk through this scenario");
  expect(host.textContent).toContain("I completed the test");

  await select("Scenario", "episode-chronic");
  expect(host.textContent).toContain("Should I change my medication dose?");
});
