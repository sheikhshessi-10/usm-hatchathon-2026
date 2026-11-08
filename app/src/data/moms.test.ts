import { describe, expect, it } from "vitest";
import { MOMS, DEMO_AS_OF, status } from "./moms";
import { cohortMetrics, rate } from "./metrics";

describe("synthetic maternal cohort", () => {
  it("has 15 unique fictional dyads with coherent longitudinal dates", () => {
    expect(MOMS).toHaveLength(15);
    expect(new Set(MOMS.map(m => m.id)).size).toBe(15);
    expect(new Set(MOMS.map(m => m.useCase)).size).toBe(15);
    expect(MOMS.filter(m => m.diagnosis.toLowerCase().includes("hypertension") || m.diagnosis.includes("Preeclampsia"))).toHaveLength(2);
    for (const m of MOMS) {
      const h = m.history!;
      expect(h.synthetic).toBe(true);
      expect(m.phone).toMatch(/555-01\d{2}/);
      expect((Date.parse(DEMO_AS_OF) - Date.parse(h.deliveryDate)) / 86400000).toBe(m.dayToday);
      expect(h.prenatal.every(e => e.gestationalWeek <= h.gestationalWeeks)).toBe(true);
      expect(m.calls[0].day).toBeGreaterThanOrEqual(h.dischargeDay);
      expect(m.calls[m.calls.length - 1].day).toBe(m.dayToday);
      expect(new Set(m.calls.map(c => c.day)).size).toBe(m.calls.length);
      for (const c of m.calls) {
        expect(c.day).toBeLessThanOrEqual(m.dayToday);
        if (!c.answered) { expect(c.sys).toBeUndefined(); expect(c.baby).toBeUndefined(); }
        else { expect(c.sys).toBeGreaterThan(c.dia!); expect(c.sys).toBeGreaterThan(90); }
      }
    }
  });
  it("derives KPI denominators from scheduled patients and due visits", () => {
    const k = cohortMetrics(MOMS);
    expect(k.enrolled).toBe(15);
    expect(k.answered).toBe(13);
    expect(k.bpCaptured).toBe(13);
    expect(k.tasksDue).toBe(8);
    expect(k.tasksCompleted).toBe(1);
    expect(rate(k.answered, k.enrolled)).toBe("87%");
    expect(rate(0, 0)).toBe("N/A");
    expect(cohortMetrics([]).enrolled).toBe(0);
  });
  it("preserves non-BP warning signs and care gaps with normal BP", () => {
    for (const index of [3, 10, 13]) {
      expect(status(MOMS[index]).level).toBe("red");
      expect(status(MOMS[index]).today!.sys).toBeLessThan(140);
    }
    expect(status(MOMS[6]).level).toBe("yellow");
    expect(status({ ...MOMS[8], calls: [] }).level).toBe("yellow");
  });
  it("does not treat a handled alert as clinical recovery", () => {
    const severe = MOMS[0];
    expect(status(severe).level).toBe("red");
    expect(status({ ...severe, handled: true }).level).toBe("red");
    expect(cohortMetrics([{ ...severe, handled: true }]).openAlerts).toBe(0);
    expect(cohortMetrics([severe]).openAlerts).toBe(1);
  });
});
