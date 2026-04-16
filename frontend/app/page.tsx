"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
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
  market: 18,
  infrastructure: 22,
  policy: 32,
  strategic: 28,
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
    weights.infrastructure +
    weights.policy +
    weights.strategic || 1;
  return {
    market: weights.market / total,
    infrastructure: weights.infrastructure / total,
    policy: weights.policy / total,
    strategic: weights.strategic / total,
  };
}

function deriveDeveloperWeights(inputs: DeveloperInputs): WeightProfile {
  const weights: WeightProfile = { ...defaultWeights };
  weights.market = 34;
  weights.infrastructure = 34;
  weights.policy = 18;
  weights.strategic = 14;

  if (inputs.projectType === "residential") {
    weights.market += 3;
    weights.policy += 2;
  } else if (inputs.projectType === "mixed-use") {
    weights.policy += 3;
    weights.strategic += 2;
  } else {
    weights.strategic += 4;
    weights.infrastructure += 2;
  }

  if (inputs.timeline === "0-2 years") {
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

  const getScoreForArea = (area: AreaRecord) =>
    scoreByAreaId.get(area.id) ?? computeReadiness(area, activeWeights);

  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const matches =
        area.name.toLowerCase().includes(query.toLowerCase()) ||
        area.type.toLowerCase().includes(query.toLowerCase());
      if (!matches) return false;
      if (!filterHigh) return true;
      return getScoreForArea(area) >= 75;
    });
  }, [query, filterHigh, activeWeights, scoreByAreaId]);

  const visibleAreas = filteredAreas.length ? filteredAreas : areas;
  const selected =
    visibleAreas.find((area) => area.id === selectedId) ?? visibleAreas[0];
  const selectedScore = selected ? getScoreForArea(selected) : 0;

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
      ? `Selected parcel overview: ${selected?.name ?? "This parcel"} is a ${scoreBand(
          selectedScore,
        )} readiness area. Main constraint: ${
          selected?.main_constraint ?? "not yet identified"
        }. Recommended action: ${
          selected?.recommended_actions[0] ??
          "Review policy direction, servicing timing, and next staff action."
        }`
      : `Selected parcel overview: ${selected?.name ?? "This parcel"} shows ${
          scoreBand(selectedScore)
        } readiness from a developer feasibility perspective. Main constraint: ${
          selected?.main_constraint ?? "not yet identified"
        }. Recommended action: ${
          selected?.recommended_actions[0] ??
          "Test project assumptions against servicing, zoning, and timing."
        }`;

  const assistantContextLines =
    activeLens === "city"
      ? [
          `Policy ${formatWeightPercent(activeWeights.policy)}`,
          `Strategic ${formatWeightPercent(activeWeights.strategic)}`,
          `Infrastructure ${formatWeightPercent(activeWeights.infrastructure)}`,
          `Market ${formatWeightPercent(activeWeights.market)}`,
        ]
      : [
          `Project ${developerInputs.projectType}`,
          `Timeline ${developerInputs.timeline}`,
          `Servicing ${developerInputs.servicingSensitivity}`,
          `Zoning ${developerInputs.zoningCertainty}`,
        ];

  const scoreStatus = isRefreshingScores
    ? "Updating scores..."
    : readinessSnapshot
      ? "Backend scoring active"
      : "Local fallback";

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
              <p className="text-sm text-[var(--muted)]">Score {highest.score}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Lowest Readiness
              </p>
              <p className="mt-2 text-lg font-semibold">{lowest.name}</p>
              <p className="text-sm text-[var(--muted)]">Score {lowest.score}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Lens
                </p>
                <h2 className="text-lg font-semibold">Growth Readiness Map</h2>
                <p className="text-sm text-[var(--muted)]">
                  Switch between a City planning lens and a Developer feasibility
                  lens.
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
                {selected ? `${selected.name} · ${selectedScore} readiness` : ""}
              </span>
            </div>

            {activeLens === "city" ? (
              <details className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                  <div>
                    <h3 className="text-sm font-semibold">City Priorities</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Read-only OP priorities extracted into the scoring lens.
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                    OP-focused
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
                  These priorities are visible for reference only, so the map can
                  stay readable during the demo.
                </p>
              </details>
            ) : null}

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
                Main Constraint
              </h3>
              <p className="mt-2 text-lg font-semibold">{selected?.main_constraint}</p>
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
                {selected?.name} - {scoreBand(selectedScore)} readiness
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--accent-soft)] px-4 py-2 text-2xl font-semibold text-[var(--accent)]">
              {selectedScore}
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
      />
    </div>
  );
}
