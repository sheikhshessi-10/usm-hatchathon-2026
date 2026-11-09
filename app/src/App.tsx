import { useEffect, useState } from "react";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { StorageNotice, BuildStatus } from "./ui/ReleaseStatus";
import NurseDashboard from "./nurse/NurseDashboard";
import MomDashboard from "./mom/MomDashboard";

import EpisodesDashboard from "./episodes/EpisodesDashboard";
import { EpisodeProvider } from "./episodes/context";
import ReportsDashboard from "./reports/ReportsDashboard";
import DoctorDashboard from "./doctor/DoctorDashboard";
import { CareProvider } from "./data/workflow";
type View = "nurse" | "mom" | "doctor" | "reports" | "episodes";
const read = (): View => location.hash === "#episodes" ? "episodes" : location.hash === "#reports" ? "reports" : location.hash.startsWith("#doctor") ? "doctor" : location.hash === "#mom" ? "mom" : "nurse";

export default function App() {
  const [view, setView] = useState<View>(read);
  useEffect(() => {
    const on = () => setView(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);

  return (
    <ErrorBoundary><EpisodeProvider><CareProvider>
      <StorageNotice/>
      <nav aria-label="CareBridge navigation" className="fixed left-4 right-4 top-4 z-30 ml-auto flex w-fit max-w-[calc(100%-2rem)] overflow-x-auto rounded-full print:hidden border border-line bg-white/85 p-1 text-xs font-semibold shadow-sm backdrop-blur">
        {(["nurse", "doctor", "mom", "reports", "episodes"] as const).map((v) => (
          <a aria-current={view === v ? "page" : undefined} key={v} href={`#${v}`} className={`whitespace-nowrap rounded-full px-2 py-1.5 sm:px-3 ${view === v ? "bg-navy text-white" : "text-navy"}`}>
            {v === "nurse" ? "Nurse" : v === "doctor" ? "Doctor" : v === "reports" ? "Reports" : v === "episodes" ? "Care loops" : "Patient"}
          </a>
        ))}
      </nav>
      {view === "nurse" ? <NurseDashboard /> : view === "doctor" ? <DoctorDashboard /> : view === "reports" ? <ReportsDashboard /> : view === "episodes" ? <EpisodesDashboard /> : <MomDashboard />}
      <BuildStatus/>
    </CareProvider></EpisodeProvider></ErrorBoundary>
  );
}

