import { Heart } from "lucide-react";
import type { Mom } from "../data/moms";
import { useCare } from "../data/workflow";

export function PatientCheckIn({ mom }: { mom: Mom }) {
  const { state } = useCare();
  const entry = state.checkIns[mom.id];

  return (
    <section className="mt-4 rounded-xl border border-[#eedfe8] bg-[#fff7fa] p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#632e4e]">
        <Heart size={16} aria-hidden="true" /> Patient portal check-in
      </h3>
      {entry ? (
        <>
          <p className="mt-2 text-sm font-semibold">{entry.feeling}</p>
          {entry.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{entry.note}</p>}
          <p className="mt-2 text-xs text-body">
            Patient-reported · Postpartum day {mom.dayToday}
            {entry.at && <> · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time></>}
          </p>
          <a className="mt-2 inline-block text-sm font-semibold text-navy underline" href={`#mom/${mom.id}/history`}>View patient entry</a>
        </>
      ) : <p className="mt-2 text-sm text-body">No portal check-in recorded for this demo patient.</p>}
    </section>
  );
}
