import { useEffect, useState } from "react";
import NurseDashboard from "./nurse/NurseDashboard";
import MomDashboard from "./mom/MomDashboard";

import DoctorDashboard from "./doctor/DoctorDashboard";
import { CareProvider } from "./data/workflow";
type View = "nurse" | "mom" | "doctor";
const read = (): View => location.hash.startsWith("#doctor") ? "doctor" : location.hash === "#mom" ? "mom" : "nurse";

export default function App() {
  const [view, setView] = useState<View>(read);
  useEffect(() => {
    const on = () => setView(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);

  return (
    <CareProvider>
      <div className="fixed right-4 top-4 z-30 flex rounded-full border border-line bg-white/85 p-1 text-xs font-semibold shadow-sm backdrop-blur">
        {(["nurse", "doctor", "mom"] as const).map((v) => (
          <a key={v} href={`#${v}`} className={`rounded-full px-3 py-1.5 ${view === v ? "bg-navy text-white" : "text-navy"}`}>
            {v === "nurse" ? "Nurse view" : v === "doctor" ? "Doctor view" : "Mom view"}
          </a>
        ))}
      </div>
      {view === "nurse" ? <NurseDashboard /> : view === "doctor" ? <DoctorDashboard /> : <MomDashboard />}
    </CareProvider>
  );
}

