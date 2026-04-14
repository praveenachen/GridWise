"use client";

import { useMemo, useState } from "react";
import MapView from "./components/MapView";
import MetricDetails from "./components/MetricDetails";
import ActionDetails from "./components/ActionDetails";
import SourceEvidence from "./components/SourceEvidence";
import InsightsAssistant from "./components/InsightsAssistant";
import { areas, type AreaRecord } from "./data/areas";
import { computeReadiness, scoreBand, scoreSoftColor } from "./lib/scoring";

export default function Home() {
  const [query, setQuery] = useState("");
  const [filterHigh, setFilterHigh] = useState(false);
  const [selectedId, setSelectedId] = useState(areas[0]?.id ?? "");

  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const matches =
        area.name.toLowerCase().includes(query.toLowerCase()) ||
        area.type.toLowerCase().includes(query.toLowerCase());
      if (!matches) return false;
      if (!filterHigh) return true;
      return computeReadiness(area) >= 75;
    });
  }, [query, filterHigh]);

  const selected =
    filteredAreas.find((area) => area.id === selectedId) ?? areas[0];
  const readinessScores = filteredAreas.map((area) => ({
    id: area.id,
    name: area.name,
    score: computeReadiness(area),
  }));
  const averageScore = readinessScores.length
    ? Math.round(
        readinessScores.reduce((acc, item) => acc + item.score, 0) /
          readinessScores.length,
      )
    : 0;
  const highest = readinessScores.reduce((prev, current) =>
    current.score > prev.score ? current : prev,
  );
  const lowest = readinessScores.reduce((prev, current) =>
    current.score < prev.score ? current : prev,
  );

  return (
    <div className="min-h-screen px-6 py-8 lg:px-10">
      <header className="mb-8">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
            City of Ottawa Prototype
          </p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)] lg:text-4xl">
            Growth Readiness Dashboard
          </h1>
          <p className="max-w-2xl text-base text-[var(--muted)] lg:text-lg">
            Identify where growth is likely, how ready areas are, and what actions
            can unlock near-term housing.
          </p>
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Areas</h2>
            <span className="text-xs text-[var(--muted)]">
              {filteredAreas.length} total
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              placeholder="Search areas or types"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setFilterHigh((prev) => !prev)}
              className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                filterHigh
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line)] bg-white text-[var(--muted)]"
              }`}
            >
              Show High Readiness
            </button>
          </div>
          <div className="mt-5 space-y-2">
            {filteredAreas.map((area) => {
              const score = computeReadiness(area);
              const isSelected = area.id === selected?.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setSelectedId(area.id)}
                  className={`flex w-full flex-col rounded-xl border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-white hover:border-[var(--accent)]"
                  }`}
                >
                  <span className="text-sm font-semibold">{area.name}</span>
                  <span className="text-xs text-[var(--muted)]">{area.type}</span>
                  <span className="mt-2 text-xs font-semibold text-[var(--accent)]">
                    Readiness {score}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Average Readiness
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--accent)]">
                {averageScore}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Across {readinessScores.length} areas
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Highest Readiness
              </p>
              <p className="mt-2 text-lg font-semibold">{highest.name}</p>
              <p className="text-sm text-[var(--muted)]">
                Score {highest.score}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Lowest Readiness
              </p>
              <p className="mt-2 text-lg font-semibold">{lowest.name}</p>
              <p className="text-sm text-[var(--muted)]">
                Score {lowest.score}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Growth Readiness Map</h2>
                <p className="text-sm text-[var(--muted)]">
                  Click an area to inspect readiness and constraints.
                </p>
              </div>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                Interactive
              </span>
            </div>
            <div className="mt-4">
              <MapView
                areas={filteredAreas.length ? filteredAreas : areas}
                selectedId={selected?.id ?? ""}
                onSelect={setSelectedId}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#0f6b5b]" />
                High readiness
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#2f7f73]" />
                Moderate readiness
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#b15a19]" />
                Low readiness
              </span>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--muted)]">
                Main Constraint
              </h3>
              <p className="mt-2 text-lg font-semibold">
                {selected?.main_constraint}
              </p>
            </div>
            <ActionDetails
              actions={selected?.recommended_actions ?? []}
              details={selected?.action_details ?? []}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Readiness Summary</h2>
              <p className="text-sm text-[var(--muted)]">
                {selected?.name} · {scoreBand(computeReadiness(selected))}{" "}
                readiness
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--accent-soft)] px-4 py-2 text-2xl font-semibold text-[var(--accent)]">
              {computeReadiness(selected)}
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Metric Details
              </p>
              <MetricDetails
                title="Market"
                value={selected?.scores.market ?? 0}
                details={selected?.score_details.market ?? []}
              />
              <MetricDetails
                title="Infrastructure"
                value={selected?.scores.infrastructure ?? 0}
                details={selected?.score_details.infrastructure ?? []}
              />
              <MetricDetails
                title="Policy"
                value={selected?.scores.policy ?? 0}
                details={selected?.score_details.policy ?? []}
              />
              <MetricDetails
                title="Strategic"
                value={selected?.scores.strategic ?? 0}
                details={selected?.score_details.strategic ?? []}
              />
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
              <h3 className="text-sm font-semibold text-[var(--muted)]">
                Why this score
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {selected?.why_bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="rounded-lg px-3 py-2"
                    style={{ background: scoreSoftColor(computeReadiness(selected)) }}
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
            <SourceEvidence evidence={selected?.source_evidence ?? []} />
            <InsightsAssistant area={selected as AreaRecord} />
          </div>
        </section>
      </main>
    </div>
  );
}
