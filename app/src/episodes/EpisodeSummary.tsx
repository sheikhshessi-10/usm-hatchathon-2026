import { useEpisodes } from "./context";
import { episodeMetrics } from "./engine";
import { Card } from "../ui/parts";
import { rate } from "../data/metrics";
export function EpisodeSummary() {
  const { state } = useEpisodes();
  const k = episodeMetrics(state);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="font-bold">Evidence-backed care episodes</h2>
          <p className="mt-1 text-xs text-body">
            Separate two-patient scenario suite. This denominator is not the
            15-patient maternal reporting cohort.
          </p>
        </div>
        <a className="text-sm font-bold text-navy underline" href="#episodes">
          Open care-loop demonstration
        </a>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-body">Verified care completion</dt>
          <dd className="text-2xl font-bold">
            {k.verified}/{k.episodes} · {rate(k.verified, k.episodes)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-body">Unresolved episodes</dt>
          <dd className="text-2xl font-bold">{k.open}</dd>
        </div>
        <div>
          <dt className="text-xs text-body">Evidence awaiting verification</dt>
          <dd className="text-2xl font-bold">{k.evidencePending}</dd>
        </div>
        <div>
          <dt className="text-xs text-body">Ended conversations</dt>
          <dd className="text-2xl font-bold">
            {k.ended}/{k.conversations}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-body">
        A patient statement, ended interaction, accepted handoff, or completed
        administrative task does not close a care episode.
      </p>
    </Card>
  );
}
