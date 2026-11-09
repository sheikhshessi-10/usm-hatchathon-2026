import { describe, expect, it } from "vitest";
import { MOMS } from "./moms";
import { initialWorkflow } from "./workflow";
import { reportSnapshot, cohortCsv, csvCell } from "./reporting";
import { OPEN_DATA } from "./openData";
describe("source-backed reporting",()=>{
  it("retains source rows and adapts only declared baseline fields",()=>{
    expect(OPEN_DATA.uci.observedRows).toBe(1014);
    expect(OPEN_DATA.uci.anchors).toHaveLength(15);
    expect(new Set(OPEN_DATA.uci.anchors.map(r=>r.row)).size).toBe(15);
    MOMS.forEach((m,i)=>{
      const a=OPEN_DATA.uci.anchors[i];expect(m.age).toBe(a.age);
      expect(m.history!.prenatal[0].bp).toEqual([a.systolic,a.diastolic]);
      expect(m.openData!.row).toBe(a.row);
      expect(m.history!.synthetic).toBe(true);
    });
  });
  it("uses published survey weights rather than unweighted response ratios",()=>{
    const b=OPEN_DATA.prams.benchmarks.find(b=>b.indicator==="Had maternal postpartum checkup")!;
    expect(b.weightedPercent).toBe(90.6);expect(b.unweightedDenominator).toBe(30844);
    expect(b.lower95).toBe(90.1);expect(b.upper95).toBe(91.1);
    expect(Math.round(b.unweightedNumerator/b.unweightedDenominator*1000)/10).not.toBe(b.weightedPercent);
  });
  it("reconciles dates, patient scopes, and independent milestone denominators",()=>{
    const state=initialWorkflow(), r=reportSnapshot(MOMS,state);
    expect(r.patients).toHaveLength(15);
    expect(r.outreach.reduce((n,d)=>n+d.answered+d.missed,0)).toBe(MOMS.reduce((n,m)=>n+m.calls.length,0));
    expect(r.outreach[r.outreach.length-1].date).toBe(r.asOf);
    expect(r.milestones.find(m=>m.label==="Due care actions completed")!.denominator).toBe(8);
    expect(reportSnapshot([MOMS[0]],state).patients).toHaveLength(1);
    expect(reportSnapshot([],state).milestones.every(m=>m.denominator===0)).toBe(true);
  });
  it("exports auditable cohort rows and neutralizes spreadsheet formula prefixes",()=>{
    expect(cohortCsv(reportSnapshot(MOMS,initialWorkflow())).split("\r\n")).toHaveLength(16);
    expect(csvCell('=1+1')).toBe('"\'=1+1"');
    for (const prefix of ["\t", "\r", "\n", "  +", "-", "@"]) {
      expect(csvCell(prefix + "payload")).toBe(`"'${prefix}payload"`);
    }
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
  });
});
