import { NextResponse } from "next/server";
import { areas } from "@/app/data/areas";
import { computeReadiness, type WeightProfile } from "@/app/lib/scoring";

type ReadinessRequest = {
  weights: WeightProfile;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as ReadinessRequest;
  const weights = payload.weights;

  const scores = areas.map((area) => ({
    id: area.id,
    name: area.name,
    score: computeReadiness(area, weights),
  }));

  const averageScore = scores.length
    ? Math.round(scores.reduce((acc, item) => acc + item.score, 0) / scores.length)
    : 0;

  const highest = scores.reduce((prev, current) =>
    current.score > prev.score ? current : prev,
  );

  const lowest = scores.reduce((prev, current) =>
    current.score < prev.score ? current : prev,
  );

  return NextResponse.json({
    scores,
    averageScore,
    highest,
    lowest,
  });
}
