import { useEffect, useState } from "react";
import { Activity, ArrowRight, ClipboardList, ShieldCheck } from "lucide-react";
import NurseDashboard from "./nurse/NurseDashboard";
import MomDashboard from "./mom/MomDashboard";
import EpisodesDashboard from "./episodes/EpisodesDashboard";
import { EpisodeProvider } from "./episodes/context";
import ReportsDashboard from "./reports/ReportsDashboard";
import DoctorDashboard from "./doctor/DoctorDashboard";
import { CareProvider } from "./data/workflow";

const views = [
  ["overview", "Overview"],
  ["episodes", "Care loops"],
  ["nurse", "Nurse"],
  ["doctor", "Doctor"],
  ["mom", "Mother"],
  ["reports", "Reports"],
] as const;
type View = (typeof views)[number][0];

function read(): View {
  const hash = location.hash.slice(1);
  if (hash.startsWith("doctor")) return "doctor";
  return views.find(([key]) => key === hash)?.[0] ?? "overview";
}

function Overview() {
  return (
    <main className="min-h-screen bg-ground px-4 pb-12 pt-24 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-card bg-navy px-6 py-10 text-white sm:px-12 sm:py-16">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
            <Activity size={16} aria-hidden="true" /> CareBridge · USM Hatchathon
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Follow-up that reaches a verified outcome
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
            Follow two fictional patients from first contact through staff coordination,
            evidence review, and doctor verification.
          </p>
          <a href="#episodes" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy">
            Start the care-loop demo <ArrowRight size={16} aria-hidden="true" />
          </a>
          <p className="mt-5 text-sm text-white/75">
            Synthetic demo. Use fictional information only. All interactions are simulated in this browser.
          </p>
        </header>

        <section aria-labelledby="workspaces" className="space-y-3">
          <h2 id="workspaces" className="text-xl font-bold text-navy">Explore the workspaces</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-card border border-line bg-white p-6">
              <ClipboardList className="text-navy" size={24} aria-hidden="true" />
              <h3 className="mt-3 font-bold text-navy">Maternal care team</h3>
              <p className="mt-2 text-sm text-body">Work through a 15-patient synthetic cohort. Review a flagged check-in, assign a care action, then record its acceptance and completion.</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-navy">
                <a className="underline" href="#nurse">Nurse queue</a>
                <a className="underline" href="#doctor">Doctor workspace</a>
                <a className="underline" href="#mom">Mother view</a>
              </div>
            </article>
            <article className="rounded-card border border-line bg-white p-6">
              <ShieldCheck className="text-navy" size={24} aria-hidden="true" />
              <h3 className="mt-3 font-bold text-navy">Outcomes and audit</h3>
              <p className="mt-2 text-sm text-body">Inspect workflow measures, their denominators, and the evidence behind each verified care episode.</p>
              <a className="mt-4 inline-block text-sm font-bold text-navy underline" href="#reports">Open reports</a>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

const pages = {
  overview: Overview,
  episodes: EpisodesDashboard,
  nurse: NurseDashboard,
  doctor: DoctorDashboard,
  mom: MomDashboard,
  reports: ReportsDashboard,
};

export default function App() {
  const [view, setView] = useState<View>(read);
  useEffect(() => {
    const on = () => setView(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);

  const Page = pages[view];
  return (
    <EpisodeProvider>
      <CareProvider>
        <nav aria-label="CareBridge workspaces" className="fixed left-4 right-4 top-4 z-30 ml-auto flex w-fit max-w-[calc(100%-2rem)] overflow-x-auto rounded-full border border-line bg-white/95 p-1 text-xs font-semibold shadow-sm backdrop-blur print:hidden">
          {views.map(([key, label]) => (
            <a
              key={key}
              href={`#${key}`}
              aria-current={view === key ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-2 py-2 sm:px-3 ${view === key ? "bg-navy text-white" : "text-navy hover:bg-hover"}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <Page />
      </CareProvider>
    </EpisodeProvider>
  );
}
