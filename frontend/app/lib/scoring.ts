import type { AreaRecord } from "../data/areas";

export type WeightProfile = {
  market: number;
  mobility: number;
  infrastructure: number;
  policy: number;
  strategic: number;
};

export const defaultWeights: WeightProfile = {
  mobility: 0.24,
  infrastructure: 0.24,
  policy: 0.22,
  market: 0.16,
  strategic: 0.14,
};

export function computeReadiness(
  area: AreaRecord,
  weights: WeightProfile = defaultWeights,
) {
  const { market, mobility, infrastructure, policy, strategic } = area.scores;
  const score =
    market * weights.market +
    mobility * weights.mobility +
    infrastructure * weights.infrastructure +
    policy * weights.policy +
    strategic * weights.strategic;
  return Math.round(score);
}

export function scoreBand(score: number) {
  if (score >= 75) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}

export function scoreColor(score: number) {
  if (score >= 75) return "#0f6b5b";
  if (score >= 50) return "#2f7f73";
  return "#b15a19";
}

export function scoreSoftColor(score: number) {
  if (score >= 75) return "#dff0ec";
  if (score >= 50) return "#e8f2ef";
  return "#f8eadf";
}
