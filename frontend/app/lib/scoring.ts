import type { AreaRecord } from "../data/areas";

const weights = {
  infrastructure: 0.3,
  policy: 0.25,
  market: 0.25,
  strategic: 0.2,
};

export function computeReadiness(area: AreaRecord) {
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
