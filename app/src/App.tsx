import { useEffect, useState } from "react";
import NurseDashboard from "./nurse/NurseDashboard";
import MomDashboard from "./mom/MomDashboard";

import ReportsDashboard from "./reports/ReportsDashboard";
import DoctorDashboard from "./doctor/DoctorDashboard";
import { CareProvider } from "./data/workflow";
type View = "nurse" | "mom" | "doctor" | "reports";
const read = (): View => location.hash === "#reports" ? "reports" : location.hash.startsWith("#doctor") ? "doctor" : location.hash === "#mom" ? "mom" : "nurse";

export default function App() {
  const [view, setView] = useState<View>(read);
  useEffect(() => {
    const on = () => setView(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);

  return (
    <CareProvider>
      <div className="fixed left-4 right-4 top-4 z-30 ml-auto flex w-fit max-w-[calc(100%-2rem)] overflow-x-auto rounded-full print:hidden border border-line bg-white/85 p-1 text-xs font-semibold shadow-sm backdrop-blur">
        {(["nurse", "doctor", "mom", "reports"] as const).map((v) => (
          <a key={v} href={`#${v}`} className={`whitespace-nowrap rounded-full px-3 py-1.5 ${view === v ? "bg-navy text-white" : "text-navy"}`}>
            {v === "nurse" ? "Nurse" : v === "doctor" ? "Doctor" : v === "reports" ? "Reports" : "Mother"}
          </a>
        ))}
      </div>
      {view === "nurse" ? <NurseDashboard /> : view === "doctor" ? <DoctorDashboard /> : view === "reports" ? <ReportsDashboard /> : <MomDashboard />}
    </CareProvider>
  );
}

