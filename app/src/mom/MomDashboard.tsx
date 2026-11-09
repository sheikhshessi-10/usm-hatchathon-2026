import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, CalendarDays, Check, ChevronRight, CircleHelp, ClipboardList, CloudRain,
  Heart, HeartPulse, History, House, Meh, Phone, Pill, Smile, TriangleAlert,
} from "lucide-react";
import { status, type Mom } from "../data/moms";
import { FEELINGS, useCare, type Feeling } from "../data/workflow";
import { BPChart } from "../ui/parts";
import "./patient.css";

const FEELING_STYLES = [
  { icon: Smile, color: "peach" },
  { icon: Meh, color: "lavender" },
  { icon: CloudRain, color: "blue" },
] as const;
const PAGES = [
  { label: "Today", icon: House },
  { label: "My plan", icon: ClipboardList },
  { label: "My history", icon: History },
  { label: "Support", icon: CircleHelp },
] as const;

type Page = (typeof PAGES)[number]["label"];

function readPatientRoute() {
  const [, patientId, section] = typeof location === "undefined" ? [] : location.hash.split("/");
  return { patientId, page: section === "history" ? "My history" as const : "Today" as const };
}

function DailyCheckIn({ mom }: { mom: Mom }) {
  const { state, saveCheckIn, storageWarning, recoveryRequired } = useCare();
  const saved = state.checkIns[mom.id];
  const [choice, setChoice] = useState<Feeling | undefined>(saved?.feeling);
  const [note, setNote] = useState(saved?.note ?? "");
  const [isEditing, setEditing] = useState(false);
  const result = useRef<HTMLDivElement>(null);
  const editing = isEditing || !saved;

  function save() {
    if (!choice || recoveryRequired) return;
    saveCheckIn(mom.id, choice, note);
    setEditing(false);
    requestAnimationFrame(() => result.current?.focus());
  }

  return (
    <section className="patient-card">
      <p className="patient-kicker"><Heart size={15} aria-hidden="true" /> Daily check-in</p>
      <h2>{editing ? "How are you feeling today?" : "Check-in saved"}</h2>
      {editing ? (
        <>
          <p className="patient-muted">Choose the option that best describes your day.</p>
          <div className="patient-feelings" role="group" aria-label="How are you feeling today?">
            {FEELING_STYLES.map(({ icon: Icon, color }, index) => {
              const label = FEELINGS[index];
              return (
                <button type="button" key={label} aria-pressed={choice === label} onClick={() => setChoice(label)}>
                  <span className={`patient-face patient-face--${color}`}><Icon aria-hidden="true" size={25} strokeWidth={1.7} /></span>
                  {label}
                </button>
              );
            })}
          </div>
          <label className="patient-note">
            Anything you’d like to add? <span>Optional</span>
            <textarea rows={2} maxLength={600} value={note} onChange={event => setNote(event.target.value)} placeholder="For example, I need help getting to my next visit." />
          </label>
          <button type="button" className="patient-primary" disabled={!choice || recoveryRequired} onClick={save}>
            Save my check-in <ArrowRight size={17} aria-hidden="true" />
          </button>
        </>
      ) : (
        <div className="patient-saved" role="status" tabIndex={-1} ref={result}>
          <span className="patient-icon patient-icon--mint"><Check size={20} aria-hidden="true" /></span>
          <div><strong>{saved?.feeling}</strong><p>{storageWarning ? "Saved for this session." : "Saved on this device."}</p></div>
          <button type="button" className="patient-link" onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
      <p className="patient-fine">Use fictional details only. This entry appears in the demo nurse and doctor views on this device.</p>
    </section>
  );
}

export default function MomDashboard() {
  const { moms, state } = useCare();
  const [momId, setMomId] = useState(() => readPatientRoute().patientId);
  const [page, setPage] = useState<Page>(() => readPatientRoute().page);
  useEffect(() => {
    const sync = () => {
      if (!location.hash.startsWith("#mom")) return;
      const route = readPatientRoute();
      setMomId(route.patientId);
      setPage(route.page);
    };
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, []);
  const nav = useRef<HTMLElement>(null);
  const mom = moms.find((profile) => profile.id === momId) ?? moms[0];
  const { level, today } = status(mom);
  const tasks = state.tasks.filter((task) => task.patientId === mom.id);
  const pending = tasks.filter((task) => !task.completed).sort((a, b) => a.dueDay - b.dueDay);
  const next = pending[0];
  const completed = tasks.length - pending.length;
  const checkIn = state.checkIns[mom.id];
  const urgent = level.startsWith("red");
  const day = Math.max(1, Math.min(mom.dayToday, 10));

  function switchPage(destination: Page) {
    setPage(destination);
    nav.current?.querySelectorAll("button")[PAGES.findIndex(({ label }) => label === destination)]?.focus();
  }

  return (
    <main className="patient-portal">
      <div className="patient-shell">
        <header className="patient-header">
          <div className="patient-brand"><span><Heart size={19} aria-hidden="true" /></span> My care</div>
          <label className="patient-profile">
            <span>Demo profile</span>
            <select value={mom.id} onChange={(event) => { setMomId(event.target.value); setPage("Today"); location.hash = `#mom/${event.target.value}`; }}>
              {moms.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </label>
        </header>

        <section className="patient-hero">
          <div className="patient-hero-copy">
            <p className="patient-kicker"><Heart size={15} aria-hidden="true" /> Postpartum care</p>
            <h1>Hi, {mom.name.split(" ")[0]}.</h1>
            <p>Your care plan and check-ins in one place.</p>
          </div>
          <p className="patient-day"><span>POSTPARTUM</span><strong>Day {day}</strong><small>of 10 in this demo</small></p>
        </section>

        <nav ref={nav} className="patient-nav" aria-label="Patient portal">
          {PAGES.map(({ label, icon: Icon }) => (
            <button type="button" key={label} aria-pressed={page === label} onClick={() => setPage(label)}>
              <Icon size={20} aria-hidden="true" /> <span>{label}</span>
            </button>
          ))}
        </nav>

        {level !== "green" && (
          <aside className={`patient-notice ${urgent ? "patient-notice--urgent" : ""}`}>
            <TriangleAlert size={21} aria-hidden="true" />
            <div>
              <h2>{urgent ? "This demo case needs urgent care-team review" : "Your demo care plan needs a review"}</h2>
              <p>{urgent ? "This sample shows an urgent concern. The demo has no live emergency routing." : "A follow-up needs attention in this sample. The demo hasn’t contacted a nurse."}</p>
            </div>
            {page !== "Support" && <button type="button" className="patient-link" onClick={() => switchPage("Support")}>See support <ChevronRight size={15} aria-hidden="true" /></button>}
          </aside>
        )}

        <div className="patient-grid patient-today" hidden={page !== "Today"}>

            <section className="patient-card patient-next">
              <p className="patient-kicker"><CalendarDays size={15} aria-hidden="true" /> Care plan</p>
              <h2>Your next action</h2>
              {next ? <div className="patient-next-action"><span className="patient-icon"><ClipboardList size={20} aria-hidden="true" /></span><div><strong>{next.title}</strong><p>{next.dueDay < day ? "Past due" : next.dueDay === day ? "Due today" : `Due on day ${next.dueDay} after delivery`}</p></div></div> : <p className="patient-muted">Your sample care actions are up to date.</p>}
              <p className="patient-visit"><strong>Next visit</strong> {mom.visit}</p>
              <button type="button" className="patient-link" onClick={() => switchPage("My plan")}>See my care plan <ArrowRight size={16} aria-hidden="true" /></button>
            </section>
            <DailyCheckIn key={mom.id} mom={mom} />
            <section className="patient-card patient-journey">
              <div>
                <p className="patient-kicker"><HeartPulse size={15} aria-hidden="true" /> Phone check-ins</p>
                <h2>Check-in history</h2>
                <p className="patient-muted">{mom.calls.filter((call) => call.answered).length} recorded phone check-ins in this demo.</p>
              </div>
              <ol className="patient-days" aria-label="Ten-day phone check-in history">
                {Array.from({ length: 10 }, (_, index) => {
                  const number = index + 1;
                  const call = mom.calls.find(({ day }) => day === number);
                  return <li key={number} data-recorded={call?.answered || undefined} aria-current={number === day ? "step" : undefined} aria-label={`Day ${number}: ${call?.answered ? "check-in recorded" : call ? "missed call" : "no call recorded"}`}>
                    <span aria-hidden="true">{call?.answered ? <Check size={14} /> : number}</span>
                    <small aria-hidden="true">{number}</small>
                  </li>;
                })}
              </ol>
            </section>
        </div>

        {page === "My plan" && (
          <div className="patient-grid">
            <section className="patient-card">
              <p className="patient-kicker"><ClipboardList size={15} aria-hidden="true" /> Care actions</p>
              <h2>Your follow-up plan</h2>
              {mom.useCase && <p className="patient-muted">{mom.useCase}</p>}
              <p className="patient-muted">{tasks.length ? `${completed} of ${tasks.length} actions marked complete by the demo care team.` : "Your demo care team hasn’t added any follow-up actions yet."}</p>
              <ul className="patient-list">
                {[...pending, ...tasks.filter((task) => task.completed)].map((task) => (
                  <li key={task.id}>
                    <span className={`patient-icon${task.completed ? " patient-icon--mint" : ""}`}>{task.completed ? <Check size={18} aria-hidden="true" /> : <CalendarDays size={18} aria-hidden="true" />}</span>
                    <div><strong>{task.title}</strong><p>{task.completed ? "Complete" : `Due on day ${task.dueDay} after delivery`}{!task.completed && task.source === "doctor" && (task.acceptedAt ? " · Accepted by your care team" : " · Waiting for the care team to accept")}</p></div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="patient-card">
              <p className="patient-kicker"><Heart size={15} aria-hidden="true" /> Reminders</p>
              <h2>Visits and medicines</h2>
              <ul className="patient-list">
                <li><span className="patient-icon"><CalendarDays size={19} aria-hidden="true" /></span><div><strong>Next visit</strong><p>{mom.visit}</p></div></li>
                <li><span className="patient-icon"><Pill size={19} aria-hidden="true" /></span><div><strong>Medicines on your plan</strong><p>{mom.meds.join(", ") || "No medicines listed."}</p></div></li>
                <li><span className="patient-icon"><Phone size={18} aria-hidden="true" /></span><div><strong>Demo phone check-in</strong><p>{day >= 10 ? "The ten-day demo plan has ended." : "Tomorrow at 9 AM in this sample plan."}</p></div></li>
              </ul>
            </section>
          </div>
        )}

        {page === "My history" && (
          <div className="patient-grid">
            <section className="patient-card patient-history-entry">
              <p className="patient-kicker"><Heart size={15} aria-hidden="true" /> Portal check-in</p>
              <h2>What you shared</h2>
              {checkIn ? (
                <>
                  <p className="patient-muted">Day {mom.dayToday} · {checkIn.feeling}</p>
                  {checkIn.note && <p className="patient-entry-note">{checkIn.note}</p>}
                </>
              ) : <p className="patient-muted">Your daily check-in will appear here once you save it.</p>}
            </section>
            <section className="patient-card">
              <p className="patient-kicker"><HeartPulse size={15} aria-hidden="true" /> Your readings</p>
              <h2>Blood pressure</h2>
              <p className="patient-muted">{today?.answered && today.sys !== undefined && today.dia !== undefined ? `Latest demo check-in: ${today.sys}/${today.dia} mmHg` : "No reading was recorded at the latest check-in."}</p>
              <BPChart calls={mom.calls} height={195} />
            </section>
            <section className="patient-card">
              <p className="patient-kicker"><History size={15} aria-hidden="true" /> Your activity</p>
              <h2>Past phone check-ins</h2>
              <ul className="patient-list">
                {[...mom.calls].reverse().map((call) => <li key={call.day}><span className="patient-icon"><Phone size={17} aria-hidden="true" /></span><div><strong>Day {call.day}</strong><p>{call.answered ? `Check-in recorded at ${call.time}` : "Call missed"}</p></div></li>)}
              </ul>
            </section>
            <section className="patient-card">
              <p className="patient-kicker"><Heart size={15} aria-hidden="true" /> Baby’s check-in</p>
              <h2>{mom.baby.name}’s latest log</h2>
              {today?.baby ? <dl className="patient-baby">
                <div><dt>Feeds</dt><dd>{today.baby.feedsPerDay ?? "—"}</dd></div>
                <div><dt>Wet diapers</dt><dd>{today.baby.wetDiapers ?? "—"}</dd></div>
                <div><dt>Temperature</dt><dd>{today.baby.tempF != null ? `${today.baby.tempF}°F` : "—"}</dd></div>
              </dl> : <p className="patient-muted">No baby check-in was recorded in the latest entry.</p>}
            </section>
          </div>
        )}

        {page === "Support" && (
          <div className="patient-grid">
            <section className="patient-card">
              <p className="patient-kicker"><CircleHelp size={15} aria-hidden="true" /> Support</p>
              <h2>Your care team</h2>
              <p className="patient-muted">The sample care team is Nurse Taylor at Forrest General. This demo can’t send them a message or place a call.</p>
            </section>
            <section className="patient-card">
              <p className="patient-kicker"><TriangleAlert size={15} aria-hidden="true" /> Postpartum warning signs</p>
              <h2>Know when to get help</h2>
              <p className="patient-muted">If you have an urgent warning sign during or after pregnancy, get medical care right away.</p>
              <a className="patient-link" href="https://www.cdc.gov/hearher/maternal-warning-signs/index.html">See the CDC’s warning signs <ArrowRight size={16} aria-hidden="true" /></a>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
