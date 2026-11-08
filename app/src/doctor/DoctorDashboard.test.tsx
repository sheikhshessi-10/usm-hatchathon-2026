// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../App";
let root: Root, host: HTMLDivElement;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const change = async (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async()=>{ Object.getOwnPropertyDescriptor(proto,"value")!.set!.call(input,value); input.dispatchEvent(new Event("input",{bubbles:true})); });
};
const click = async (label: string) => {
  const button = [...host.querySelectorAll("button")].find(b=>b.textContent?.trim()===label);
  expect(button, label).toBeTruthy(); await act(async()=>button!.click());
};
const navigate = async (hash: string) => { await act(async()=>{location.hash=hash;window.dispatchEvent(new HashChangeEvent("hashchange"));}); };
beforeEach(async()=>{localStorage.clear();location.hash="#doctor";host=document.createElement("div");document.body.append(host);root=createRoot(host);await act(async()=>root.render(<App/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
describe("doctor to care-team workflow",()=>{
  it("records a review and a care action shared with nurse and mother views",async()=>{
    expect(host.textContent).toContain("Doctor portal");
    const note=host.querySelector("textarea")!;
    expect([...host.querySelectorAll("button")].find(b=>b.textContent==="Save doctor review")!.disabled).toBe(true);
    await change(note,"Review documented; nurse to coordinate follow-up.");
    await click("Save doctor review");
    expect(host.textContent).toContain("Doctor review saved");
    const title=host.querySelector('input[placeholder="Specific next action and handoff"]') as HTMLInputElement;
    await change(title,"Confirm transport for follow-up");
    await click("Assign care action");
    expect(host.textContent).toContain("Awaiting nurse acceptance and action");

    expect(JSON.parse(localStorage.getItem("carebridge-workflow-v1")!).reviews).toHaveLength(1);
    await navigate("#nurse");
    const patient=[...host.querySelectorAll("button")].find(b=>b.textContent?.includes("Keisha Williams"))!;
    await act(async()=>patient.click());
    expect(host.textContent).toContain("Review documented; nurse to coordinate follow-up.");
    expect(host.textContent).toContain("Confirm transport for follow-up");
    const taskRow = () => [...host.querySelectorAll("li")].find(li=>li.textContent?.startsWith("Confirm transport for follow-up"))!;
    expect(taskRow().textContent).not.toContain("Record action completed");
    const accept = [...taskRow().querySelectorAll("button")].find(b=>b.textContent==="Accept assigned care action")!;
    await act(async()=>accept.click());
    expect(taskRow().textContent).toContain("Accepted by Nurse");
    await navigate("#mom");
    expect(host.textContent).toContain("accepted by care team");
    await navigate("#nurse");
    await act(async()=>[...host.querySelectorAll("button")].find(b=>b.textContent?.includes("Keisha Williams"))!.click());
    const complete = [...taskRow().querySelectorAll("button")].find(b=>b.textContent==="Record action completed")!;
    await act(async()=>complete.click());
    const saved = JSON.parse(localStorage.getItem("carebridge-workflow-v1")!).tasks.find((t: {title:string})=>t.title==="Confirm transport for follow-up");
    expect(saved.completed).toBe(true);
    expect(saved.acceptedBy).toBe("Nurse");
    expect(saved.acceptedAt).toBeTruthy();
    expect(saved.completedAt).toBeTruthy();
    await navigate("#mom");
    expect(host.textContent).toContain("Confirm transport for follow-up");
  });
  it("supports patient search and resets the assessment form when selection changes",async()=>{
    const search=host.querySelector('input[aria-label="Search doctor patients"]') as HTMLInputElement;
    await change(search,"Leah");
    const patient=[...host.querySelectorAll("button")].find(b=>b.textContent?.includes("Leah Foster"))!;
    await act(async()=>patient.click());
    expect(host.textContent).toContain("Breast redness and fever");
    expect(host.querySelector("textarea")!.value).toBe("");
  });
});
