"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import MetricDetails from "./components/MetricDetails";
import ActionDetails from "./components/ActionDetails";
import SourceEvidence from "./components/SourceEvidence";
import AssistantSidebar from "./components/AssistantSidebar";
import { areas, type AreaRecord } from "./data/areas";
import {
  computeReadiness,
  defaultWeights,
  scoreBand,
  scoreSoftColor,
  type WeightProfile,
} from "./lib/scoring";
import {
  cityPriorityLabels,
  defaultDeveloperInputs,
  lensPrompts,
  type DeveloperInputs,
  type LensMode,
} from "./lib/workflow";

const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-2xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)] shadow-sm">
      Loading map...
    </div>
  ),
});

type DashboardPreferences = {
  activeLens: LensMode;
  developerInputs: DeveloperInputs;
  selectedId: string;
  filterHigh: boolean;
};

type ReadinessSnapshot = {
  scores: Array<{ id: string; name: string; score: number }>;
  averageScore: number;
  highest: { id: string; name: string; score: number };
  lowest: { id: string; name: string; score: number };
};

const dashboardStorageKey = "ottawa-growth-dashboard-settings";

const defaultCityWeights: WeightProfile = {
  mobility: 28,
  infrastructure: 22,
  policy: 24,
  strategic: 16,
  market: 10,
};

function loadDashboardPreferences(): DashboardPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(dashboardStorageKey);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardPreferences;
  } catch {
    return null;
  }
}

function normalizeWeights(weights: WeightProfile): WeightProfile {
  const total =
    weights.market +
    weights.mobility +
    weights.infrastructure +
    weights.policy +
    weights.strategic || 1;
  return {
    market: weights.market / total,
    mobility: weights.mobility / total,
    infrastructure: weights.infrastructure / total,
    policy: weights.policy / total,
    strategic: weights.strategic / total,
  };
}

function deriveDeveloperWeights(inputs: DeveloperInputs): WeightProfile {
  const weights: WeightProfile = { ...defaultWeights };
  weights.market = 24;
  weights.mobility = 24;
  weights.infrastructure = 26;
  weights.policy = 16;
  weights.strategic = 10;

  if (inputs.projectType === "residential") {
    weights.market += 3;
    weights.mobility += 2;
    weights.policy += 2;
  } else if (inputs.projectType === "mixed-use") {
    weights.mobility += 3;
    weights.policy += 3;
    weights.strategic += 2;
  } else {
    weights.strategic += 4;
    weights.infrastructure += 2;
  }

  if (inputs.timeline === "0-2 years") {
    weights.mobility += 3;
    weights.infrastructure += 5;
    weights.policy += 2;
    weights.market -= 2;
    weights.strategic -= 1;
  } else if (inputs.timeline === "4+ years") {
    weights.market += 3;
    weights.strategic += 2;
    weights.infrastructure -= 3;
  } else {
    weights.market += 1;
    weights.strategic += 1;
  }

  if (inputs.servicingSensitivity === "high") {
    weights.infrastructure += 6;
    weights.mobility += 1;
    weights.market -= 2;
  } else if (inputs.servicingSensitivity === "low") {
    weights.infrastructure -= 2;
    weights.market += 2;
  }

  if (inputs.zoningCertainty === "high") {
    weights.policy += 5;
    weights.strategic += 1;
  } else if (inputs.zoningCertainty === "low") {
    weights.policy += 2;
    weights.strategic -= 1;
  }

  return normalizeWeights(weights);
}

function formatWeightPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatAreaType(type: AreaRecord["type"]) {
  return type.replace("_", " ");
}

function getScoreDrivers(area: AreaRecord | undefined) {
  if (!area) {
    return {
      strongest: "No area selected",
      blocker: "Select an area to see score drivers.",
    };
  }

  const entries = Object.entries(area.scores) as Array<
    [keyof AreaRecord["scores"], number]
  >;
  const [strongestKey, strongestValue] = entries.reduce((prev, current) =>
    current[1] > prev[1] ? current : prev,
  );
  const [weakestKey, weakestValue] = entries.reduce((prev, current) =>
    current[1] < prev[1] ? current : prev,
  );
  const strongestLabel =
    strongestKey.charAt(0).toUpperCase() + strongestKey.slice(1);
  const weakestLabel = weakestKey.charAt(0).toUpperCase() + weakestKey.slice(1);

  return {
    strongest: `${strongestLabel} is the strongest positive driver at ${strongestValue}.`,
    blocker: `${weakestLabel} is the main blocker at ${weakestValue}.`,
  };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [filterHigh, setFilterHigh] = useState(false);
  const [selectedId, setSelectedId] = useState(areas[0]?.id ?? "");
  const [activeLens, setActiveLens] = useState<LensMode>("city");
  const [developerInputs, setDeveloperInputs] = useState<DeveloperInputs>(
    defaultDeveloperInputs,
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [readinessSnapshot, setReadinessSnapshot] =
    useState<ReadinessSnapshot | null>(null);
  const [isRefreshingScores, setIsRefreshingScores] = useState(false);
  const [briefRequestKey, setBriefRequestKey] = useState(0);

  const activeWeights = useMemo(
    () =>
      activeLens === "city"
        ? normalizeWeights(defaultCityWeights)
        : deriveDeveloperWeights(developerInputs),
    [activeLens, developerInputs],
  );

  const scoreByAreaId = useMemo(() => {
    return new Map(
      readinessSnapshot?.scores.map((item) => [item.id, item.score]) ?? [],
    );
  }, [readinessSnapshot]);

  const getScoreForArea = useCallback(
    (area: AreaRecord) =>
      scoreByAreaId.get(area.id) ?? computeReadiness(area, activeWeights),
    [activeWeights, scoreByAreaId],
  );

  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const matches =
        area.name.toLowerCase().includes(query.toLowerCase()) ||
        area.type.toLowerCase().includes(query.toLowerCase());
      if (!matches) return false;
      if (!filterHigh) return true;
      return getScoreForArea(area) >= 75;
    });
  }, [query, filterHigh, getScoreForArea]);

  const visibleAreas = filteredAreas.length ? filteredAreas : areas;
  const selected =
    visibleAreas.find((area) => area.id === selectedId) ?? visibleAreas[0];
  const selectedScore = selected ? getScoreForArea(selected) : 0;
  const scoreDrivers = getScoreDrivers(selected);

  const readinessScores = visibleAreas.map((area) => ({
    id: area.id,
    name: area.name,
    score: getScoreForArea(area),
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

  useEffect(() => {
    const preferences = loadDashboardPreferences();
    if (!preferences) {
      setPreferencesLoaded(true);
      return;
    }
    setActiveLens(preferences.activeLens ?? "city");
    setDeveloperInputs(preferences.developerInputs ?? defaultDeveloperInputs);
    setSelectedId(preferences.selectedId ?? areas[0]?.id ?? "");
    setFilterHigh(Boolean(preferences.filterHigh));
    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    const preferences: DashboardPreferences = {
      activeLens,
      developerInputs,
      selectedId,
      filterHigh,
    };
    window.localStorage.setItem(
      dashboardStorageKey,
      JSON.stringify(preferences),
    );
  }, [
    activeLens,
    developerInputs,
    selectedId,
    filterHigh,
    preferencesLoaded,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function refreshReadiness() {
      setIsRefreshingScores(true);
      try {
        const response = await fetch("/api/readiness", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            weights: activeWeights,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to refresh readiness");
        }

        const data = (await response.json()) as ReadinessSnapshot;
        if (!cancelled) {
          setReadinessSnapshot(data);
        }
      } catch {
        if (!cancelled) {
          setReadinessSnapshot(null);
        }
      } finally {
        if (!cancelled) {
          setIsRefreshingScores(false);
        }
      }
    }

    void refreshReadiness();

    return () => {
    cancelled = true;
  };
  }, [activeWeights]);

  const assistantSummary =
    activeLens === "city"
      ? `Selected area overview: ${selected?.name ?? "This area"} is a ${scoreBand(
          selectedScore,
        )} growth and mobility readiness area. Mobility score: ${
          selected?.scores.mobility ?? "not available"
        }. Main constraint: ${
          selected?.main_constraint ?? "not yet identified"
        }. Recommended action: ${
          selected?.recommended_actions[0] ??
          "Review mobility, servicing, policy direction, and next municipal action."
        }`
      : `Selected area overview: ${selected?.name ?? "This area"} shows ${
          scoreBand(selectedScore)
        } readiness from a developer delivery perspective. Mobility score: ${
          selected?.scores.mobility ?? "not available"
        }. Main constraint: ${
          selected?.main_constraint ?? "not yet identified"
        }. Recommended action: ${
          selected?.recommended_actions[0] ??
          "Test project assumptions against mobility, servicing, zoning, and timing."
        }`;

  const assistantContextLines =
    activeLens === "city"
      ? [
          `Mobility ${formatWeightPercent(activeWeights.mobility)}`,
          `Policy ${formatWeightPercent(activeWeights.policy)}`,
          `Infrastructure ${formatWeightPercent(activeWeights.infrastructure)}`,
          `Strategic ${formatWeightPercent(activeWeights.strategic)}`,
          `Market ${formatWeightPercent(activeWeights.market)}`,
        ]
      : [
          `Project ${developerInputs.projectType}`,
          `Timeline ${developerInputs.timeline}`,
          `Mobility ${formatWeightPercent(activeWeights.mobility)}`,
          `Servicing ${developerInputs.servicingSensitivity}`,
          `Zoning ${developerInputs.zoningCertainty}`,
        ];

  const scoreStatus = isRefreshingScores
    ? "Updating scores..."
    : readinessSnapshot
      ? "Backend scoring active"
      : "Local fallback";

  return (
    <div className="min-h-screen px-6 py-6 lg:px-10">
      <header className="mb-5">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
            GridWise Portfolio Prototype
          </p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)] lg:text-4xl">
            GridWise Growth and Mobility Readiness
          </h1>
          <p className="max-w-xl text-base text-[var(--muted)]">
            AI-assisted workflow for prioritizing growth areas, mobility
            constraints, and next municipal actions.
          </p>
          <p className="max-w-3xl text-sm text-[var(--muted)]">
            Uses sample planning data for portfolio purposes. GridWise is not
            an official municipal planning tool.
          </p>
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Areas</h2>
            <span className="text-xs text-[var(--muted)]">
              {visibleAreas.length} total
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
            {visibleAreas.map((area) => {
              const score = getScoreForArea(area);
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
                  <span className="text-xs capitalize text-[var(--muted)]">
                    {formatAreaType(area.type)}
                  </span>
                  <span className="mt-2 text-xs font-semibold text-[var(--accent)]">
                    Growth + mobility {score}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Average Score
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--accent)]">
                {averageScore}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Across {readinessScores.length} areas
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Highest Priority
              </p>
              <p className="mt-1 text-base font-semibold">{highest.name}</p>
              <p className="text-sm text-[var(--muted)]">Score {highest.score}</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Needs Attention
              </p>
              <p className="mt-1 text-base font-semibold">{lowest.name}</p>
              <p className="text-sm text-[var(--muted)]">Score {lowest.score}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Lens
                </p>
                <h2 className="text-lg font-semibold">
                  Growth + Mobility Readiness Map
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  City lens prioritizes public action and sequencing. Developer
                  lens tests delivery risk, approvals, servicing, and timing.
                </p>
              </div>
              <div className="flex rounded-full border border-[var(--line)] bg-white p-1 text-xs shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveLens("city")}
                  className={`rounded-full px-4 py-2 font-semibold transition ${
                    activeLens === "city"
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  City
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLens("developer")}
                  className={`rounded-full px-4 py-2 font-semibold transition ${
                    activeLens === "developer"
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  Developer
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>{scoreStatus}</span>
              <span>
                {selected ? `${selected.name} - ${selectedScore} readiness` : ""}
              </span>
            </div>

            {activeLens === "city" ? (
              <details className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                  <div>
                    <h3 className="text-sm font-semibold">
                      City Planner Priorities
                    </h3>
                    <p className="text-sm text-[var(--muted)]">
                      Transparent weights for prioritizing public action,
                      mobility readiness, and growth sequencing.
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                    Workflow weights
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  {cityPriorityLabels.map((item) => (
                    <div key={item.key} className="space-y-2 rounded-xl border border-[var(--line)] bg-[#fcfcfa] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-[var(--muted)]">{item.hint}</p>
                        </div>
                        <span className="text-sm font-semibold text-[var(--accent)]">
                          {formatWeightPercent(activeWeights[item.key])}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-[var(--accent)]"
                          style={{ width: `${Math.round(activeWeights[item.key] * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  These weights are visible so planners can audit why an area is
                  ranked and which public constraints affect the recommendation.
                </p>
              </details>
            ) : null}

            <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[#f8fbfa] px-4 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Selected Area
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    {selected?.name} · {scoreBand(selectedScore)} readiness
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    Mobility {selected?.scores.mobility} · Main blocker:{" "}
                    {selected?.main_constraint}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBriefRequestKey((current) => current + 1)}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b5c50]"
                >
                  Generate Planning Brief
                </button>
              </div>
            </div>

            <div className="mt-4">
              <MapView
                areas={visibleAreas}
                selectedId={selected?.id ?? ""}
                onSelect={setSelectedId}
                weights={activeWeights}
                scoresById={Object.fromEntries(scoreByAreaId)}
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
                Main Planning Constraint
              </h3>
              <p className="mt-2 text-lg font-semibold">{selected?.main_constraint}</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Mobility readiness: {selected?.scores.mobility}.{" "}
                {selected?.score_details.mobility[0]}
              </p>
            </div>
            <ActionDetails
              actions={selected?.recommended_actions ?? []}
              details={selected?.action_details ?? []}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Why This Area?</h2>
              <p className="text-sm text-[var(--muted)]">
                {selected?.name} - {scoreBand(selectedScore)} growth and mobility readiness
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--accent-soft)] px-4 py-2 text-2xl font-semibold text-[var(--accent)]">
              {selectedScore}
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Explainable Score Drivers
              </p>
              <div className="rounded-2xl border border-[var(--line)] bg-white p-4 text-sm">
                <p className="font-semibold text-[var(--foreground)]">
                  {scoreDrivers.strongest}
                </p>
                <p className="mt-1 text-[var(--muted)]">{scoreDrivers.blocker}</p>
              </div>
              <MetricDetails
                title="Market"
                value={selected?.scores.market ?? 0}
                details={selected?.score_details.market ?? []}
              />
              <MetricDetails
                title="Mobility"
                value={selected?.scores.mobility ?? 0}
                details={selected?.score_details.mobility ?? []}
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
                Concise Reasoning
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {selected?.why_bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="rounded-lg px-3 py-2"
                    style={{ background: scoreSoftColor(selectedScore) }}
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
            <SourceEvidence evidence={selected?.source_evidence ?? []} />
          </div>
        </section>
      </main>

      <AssistantSidebar
        area={selected as AreaRecord}
        lens={activeLens}
        score={selectedScore}
        weights={activeWeights}
        summary={assistantSummary}
        prompts={lensPrompts[activeLens]}
        contextLines={assistantContextLines}
        developerInputs={developerInputs}
        onDeveloperInputsChange={setDeveloperInputs}
        briefRequestKey={briefRequestKey}
      />
    </div>
  );
}
