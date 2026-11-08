import { describe, expect, it } from "vitest";
import { MOMS, status } from "./moms";
import { continuityMetrics, initialWorkflow, readWorkflow } from "./workflow";
describe("continuity measures",()=>{
  it("counts handoff acceptance and closure separately from review dispositions",()=>{
    const state=initialWorkflow();
    state.reviews.push({patientId:"m1", disposition:"follow-up", note:"Needs follow-up",contactOutcome:"not-recorded",at:"2026-11-08T12:00:00Z"});
    expect(continuityMetrics(MOMS,state).handoffRequests).toBe(0);
    const task = {id:"handoff-test",patientId:"m1",title:"Transport coordination",owner:"Nurse" as const,dueDay:5,completed:false,source:"doctor" as const};
    state.tasks.push(task);
    expect(continuityMetrics(MOMS,state).handoffsPending).toBe(1);
    state.tasks[state.tasks.length-1]={...task,acceptedAt:"2026-11-08T12:05:00Z",acceptedBy:"Nurse"};
    expect(continuityMetrics(MOMS,state).handoffsAccepted).toBe(1);
    expect(continuityMetrics(MOMS,state).handoffsClosed).toBe(0);
    state.tasks[state.tasks.length-1].completed=true;
    expect(continuityMetrics(MOMS,state).handoffsClosed).toBe(1);
    expect(status(MOMS[0]).level).toBe("red");
  });
  it("uses due actions, not calls, as the completion denominator",()=>{
    const state=initialWorkflow(), k=continuityMetrics(MOMS,state);
    expect(k.due).toBe(8); expect(k.completedDue).toBe(1); expect(k.urgent).toBe(4);
    const future=state.tasks.find(t=>t.patientId==="m5")!;
    future.completed=true;
    expect(continuityMetrics(MOMS,state).completedDue).toBe(1);
    expect(continuityMetrics([],state).due).toBe(0);
  });
  it("requires explicit restored contact and keeps clinical severity after acknowledgement",()=>{
    const state=initialWorkflow();
    state.reviews.push({patientId:"m3",disposition:"follow-up",note:"Left message",contactOutcome:"unreached",at:"2026-11-08T12:00:00Z"});
    expect(continuityMetrics(MOMS,state).contactRestored).toBe(0);
    state.reviews.push({patientId:"m3",disposition:"reviewed",note:"Patient reached",contactOutcome:"reached",at:"2026-11-08T12:30:00Z"});
    expect(continuityMetrics(MOMS,state).contactRestored).toBe(1);
    state.reviews.push({patientId:"m1",disposition:"escalated",note:"Escalation documented",contactOutcome:"not-recorded",at:"2026-11-08T12:30:00Z"});
    expect(continuityMetrics(MOMS,state).pendingUrgent).toBe(3);
    expect(status(MOMS[0]).level).toBe("red");
  });
  it("restores valid workflows and rejects corrupt or incomplete browser state",()=>{
    const state=initialWorkflow();
    expect(readWorkflow(JSON.stringify(state))).toEqual(state);
    expect(readWorkflow("bad json")).toEqual(state);
    expect(readWorkflow(JSON.stringify({...state,tasks:[]}))).toEqual(state);
    expect(readWorkflow(JSON.stringify({...state,reviews:[null]}))).toEqual(state);
  });
});
