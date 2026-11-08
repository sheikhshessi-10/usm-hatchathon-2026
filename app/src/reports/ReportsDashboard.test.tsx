// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { EpisodeProvider } from "../episodes/context";
import ReportsDashboard from "./ReportsDashboard";
import { CareProvider } from "../data/workflow";
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it("filters the patient report and exports the same selected cohort",async()=>{
  localStorage.clear(); const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
  const makeUrl=vi.fn(()=>"blob:report");Object.defineProperty(URL,"createObjectURL",{value:makeUrl,configurable:true});Object.defineProperty(URL,"revokeObjectURL",{value:vi.fn(),configurable:true});
  const click=vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});
  try{
    await act(async()=>root.render(<EpisodeProvider><CareProvider><ReportsDashboard/></CareProvider></EpisodeProvider>));
    expect(host.querySelectorAll("tbody tr")).toHaveLength(15);
    expect(host.textContent).toContain("90.6%");expect(host.textContent).toContain("12.7%");
    await act(async()=>{const select=host.querySelector("select")!;select.value="Metabolic follow-up";select.dispatchEvent(new Event("change",{bubbles:true}));});
    expect(host.querySelectorAll("tbody tr")).toHaveLength(2);
    await act(async()=>[...host.querySelectorAll("button")].find(b=>b.textContent?.includes("Cohort CSV"))!.click());
    expect(makeUrl).toHaveBeenCalledOnce();expect(click).toHaveBeenCalledOnce();
  }finally{await act(async()=>root.unmount());host.remove();click.mockRestore();}
});
