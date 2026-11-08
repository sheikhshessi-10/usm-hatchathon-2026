import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import NurseDashboard from "../nurse/NurseDashboard";
import MomDashboard from "../mom/MomDashboard";
import { MOMS } from "./moms";

describe("cohort UI rendering", () => {
  it("renders all 15 patients and calculated KPIs in the nurse view", () => {
    const html = renderToStaticMarkup(<NurseDashboard />);
    for (const m of MOMS) expect(html).toContain(m.name);
    expect(html).toContain("Calls answered today");
    expect(html).toContain("87%");
    expect(html).toContain("Care tasks completed among due");
    expect(html).toContain("13%");
    expect(html).toContain("C-section wound");
    expect(html).toContain("Mood screening");
    expect(html).not.toContain("NaN");
  });
  it("makes every synthetic case selectable in the mother view", () => {
    const html = renderToStaticMarkup(<MomDashboard />);
    for (const m of MOMS) expect(html).toContain(`value="${m.id}"`);
    expect(html).toContain("Your care pathway");
    expect(html).not.toContain("Your nurse has been told");
  });
});
