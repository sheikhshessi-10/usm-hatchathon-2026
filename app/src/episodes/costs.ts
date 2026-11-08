import { episodeMetrics, type State } from "./engine";
export type CostInputs = {
  voiceRate: string;
  smsRate: string;
  humanRate: string;
  humanMinutes: string;
  overhead: string;
};
export function modeledEconomics(state: State, inputs: CostInputs) {
  const k = episodeMetrics(state);
  const configured = Object.values(inputs).every(
    (v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0,
  );
  const automated = configured
    ? k.simulatedVoiceMinutes * Number(inputs.voiceRate) +
      k.smsMessages * Number(inputs.smsRate)
    : null;
  const candidate =
    automated === null
      ? null
      : automated +
        Number(inputs.humanRate) * Number(inputs.humanMinutes) +
        Number(inputs.overhead);
  const total =
    candidate !== null && Number.isFinite(candidate) ? candidate : null;
  return {
    automated:
      automated !== null && Number.isFinite(automated) ? automated : null,
    total,
    perAttempt: total === null || !k.attempts ? null : total / k.attempts,
    perProcessedEpisode:
      total === null || !k.processed ? null : total / k.processed,
    perVerified: total === null || !k.verified ? null : total / k.verified,
  };
}
