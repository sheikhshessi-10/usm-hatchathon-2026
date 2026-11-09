import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { StorageNotice, BuildStatus } from "./ui/ReleaseStatus";
import { Companion } from "./ui/Companion";
import NurseDashboard from "./nurse/NurseDashboard";
import MomDashboard from "./mom/MomDashboard";
import EpisodesDashboard from "./episodes/EpisodesDashboard";
import { EpisodeProvider } from "./episodes/context";
import ExpoDashboard from "./expo/ExpoDashboard";
import ProtocolsDashboard from "./protocols/ProtocolsDashboard";
import ReportsDashboard from "./reports/ReportsDashboard";
import DoctorDashboard from "./doctor/DoctorDashboard";
import { CareProvider } from "./data/workflow";

const views = [
  ["mom", "Patient", MomDashboard],
  ["episodes", "Care loops", EpisodesDashboard],
  ["nurse", "Nurse", NurseDashboard],
  ["doctor", "Doctor", DoctorDashboard],
  ["reports", "Reports", ReportsDashboard],
  ["protocols", "Protocols", ProtocolsDashboard],
  ["expo", "Expo demo", ExpoDashboard],
] as const;

function read() {
  const route = location.hash.slice(1).split("/")[0];
  return views.find(([id]) => id === route) ?? views[0];
}

export default function App() {
  const [[view, , Page], setView] = useState(read);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onHashChange = () => setView(read());
    addEventListener("hashchange", onHashChange);
    return () => removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    document.querySelector("header")?.scrollIntoView?.();
  }, [view]);

  return (
    <ErrorBoundary>
      <EpisodeProvider>
        <CareProvider>
          <a href="#workspace-content" onClick={event => { event.preventDefault(); content.current?.focus(); }} className="sr-only z-50 bg-white p-3 font-bold focus:not-sr-only focus:absolute">
            Skip to workspace
          </a>
          <header className="border-b border-line bg-white print:hidden">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-8">
              <a href="#mom" className="inline-flex items-center gap-2 font-extrabold text-navy">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white"><Activity size={19} aria-hidden="true" /></span>
                AVENLYTH
              </a>
              <nav aria-label="AVENLYTH navigation" className="order-last grid w-full grid-cols-3 gap-1 min-[460px]:grid-cols-7 sm:order-none sm:flex sm:w-auto">
                {views.map(([id, label]) => (
                  <a key={id} href={`#${id}`} aria-current={view === id ? "page" : undefined} className={`grid min-h-11 place-items-center rounded-lg px-1 text-center text-xs font-bold sm:px-3 sm:text-sm ${view === id ? "bg-navy text-white" : "text-navy hover:bg-hover"}`}>
                    {label}
                  </a>
                ))}
              </nav>
              <Companion />
            </div>
          </header>
          <StorageNotice />
          <div id="workspace-content" ref={content} tabIndex={-1}>
            <Page />
          </div>
          <BuildStatus />
        </CareProvider>
      </EpisodeProvider>
    </ErrorBoundary>
  );
}
