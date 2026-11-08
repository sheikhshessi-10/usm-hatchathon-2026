import { describe, expect, it } from "vitest";
import { evaluate, type CheckIn } from "./rules";

const ci = (p: Partial<CheckIn>): CheckIn => ({ day: 5, answered: true, symptoms: [], ...p });

describe("mom blood pressure", () => {
  it("green under 150/100 with no symptoms", () => {
    expect(evaluate(ci({ sys: 138, dia: 86 })).level).toBe("green");
  });
  it("yellow at 150-159 or 100-109 without symptoms", () => {
    expect(evaluate(ci({ sys: 152, dia: 96 })).level).toBe("yellow");
    expect(evaluate(ci({ sys: 140, dia: 104 })).level).toBe("yellow");
  });
  it("red at 160 top or 110 bottom", () => {
    expect(evaluate(ci({ sys: 160, dia: 90 })).level).toBe("red");
    expect(evaluate(ci({ sys: 130, dia: 110 })).level).toBe("red");
  });
  it("red at 140+/90+ with headache, vision change or upper belly pain", () => {
    expect(evaluate(ci({ sys: 144, dia: 88, symptoms: ["headache"] })).level).toBe("red");
    expect(evaluate(ci({ sys: 132, dia: 92, symptoms: ["vision"] })).level).toBe("red");
  });
  it("headache alone with normal pressure stays green", () => {
    expect(evaluate(ci({ sys: 128, dia: 80, symptoms: ["headache"] })).level).toBe("green");
  });
  it("demo reading 166/112 + headache is red", () => {
    const r = evaluate(ci({ sys: 166, dia: 112, symptoms: ["headache"] }));
    expect(r.level).toBe("red");
    expect(r.findings[0].reason).toContain("166/112");
  });
});

describe("mom warning signs", () => {
  it("chest pain means 911 even with normal pressure", () => {
    expect(evaluate(ci({ sys: 120, dia: 80, symptoms: ["chest_pain"] })).level).toBe("red911");
  });
  it("heavy bleeding means call provider (red)", () => {
    expect(evaluate(ci({ sys: 120, dia: 80, symptoms: ["heavy_bleeding"] })).level).toBe("red");
  });
});

describe("trend", () => {
  it("flags 3 rising days ending at 140+", () => {
    const h = [ci({ day: 3, sys: 132, dia: 84 }), ci({ day: 4, sys: 137, dia: 86 })];
    const r = evaluate(ci({ day: 5, sys: 143, dia: 88 }), h);
    expect(r.level).toBe("yellow");
    expect(r.findings.some((f) => f.reason.startsWith("Rising"))).toBe(true);
  });
  it("ignores rises that stay under 140", () => {
    const h = [ci({ day: 3, sys: 118, dia: 76 }), ci({ day: 4, sys: 122, dia: 78 })];
    expect(evaluate(ci({ day: 5, sys: 128, dia: 80 }), h).level).toBe("green");
  });
});

describe("baby", () => {
  it("fever 100.4 is red", () => {
    expect(evaluate(ci({ sys: 120, dia: 80, baby: { tempF: 100.4 } })).level).toBe("red");
  });
  it("can't wake is 911", () => {
    expect(evaluate(ci({ sys: 120, dia: 80, baby: { cantWake: true } })).level).toBe("red911");
  });
  it("few wet diapers after day 5 is yellow, but fine on day 3", () => {
    expect(evaluate(ci({ day: 6, sys: 120, dia: 80, baby: { wetDiapers: 4 } })).level).toBe("yellow");
    expect(evaluate(ci({ day: 3, sys: 120, dia: 80, baby: { wetDiapers: 3 } })).level).toBe("green");
  });
});

describe("missed call", () => {
  it("unanswered call is yellow", () => {
    expect(evaluate({ day: 4, answered: false, symptoms: [] }).level).toBe("yellow");
  });
});
