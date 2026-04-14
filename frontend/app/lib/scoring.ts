import type { AreaRecord } from "../data/areas";

export type WeightProfile = {
  market: number;
  infrastructure: number;
  policy: number;
  strategic: number;
};

export const defaultWeights: WeightProfile = {
  infrastructure: 0.3,
  policy: 0.25,
  market: 0.25,
  strategic: 0.2,
};

export function computeReadiness(
  area: AreaRecord,
  weights: WeightProfile = defaultWeights,
) {
  const { market, infrastructure, policy, strategic } = area.scores;
  const score =
    market * weights.market +
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
