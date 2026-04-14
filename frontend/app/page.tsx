"use client";

import { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView";
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

type LensMode = "city" | "developer";
type PriorityKey = keyof WeightProfile;

type DeveloperInputs = {
  projectType: "residential" | "mixed-use" | "employment";
  timeline: "0-2 years" | "2-4 years" | "4+ years";
  servicingSensitivity: "low" | "medium" | "high";
  zoningCertainty: "low" | "medium" | "high";
};

type DashboardPreferences = {
  activeLens: LensMode;
  cityWeights: WeightProfile;
  developerInputs: DeveloperInputs;
  selectedId: string;
  filterHigh: boolean;
};

const dashboardStorageKey = "ottawa-growth-dashboard-settings";

const defaultCityWeights: WeightProfile = {
  market: 18,
  infrastructure: 22,
  policy: 32,
  strategic: 28,
};

const defaultDeveloperInputs: DeveloperInputs = {
  projectType: "mixed-use",
  timeline: "2-4 years",
  servicingSensitivity: "high",
  zoningCertainty: "high",
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

const lensPrompts: Record<LensMode, string[]> = {
  city: [
    "How does this area align with Official Plan priorities?",
    "What is the top sequencing risk for this area?",
    "Which action would unblock the most near-term housing?",
  ],
  developer: [
    "What is the biggest delivery risk for this area?",
    "What would most improve feasibility in the next 12-24 months?",
    "Where is the strongest market signal in this area?",
  ],
};

const cityPriorityLabels: Array<{
  key: PriorityKey;
  label: string;
  hint: string;
}> = [
  {
    key: "policy",
    label: "Intensification / OP alignment",
    hint: "Raises the influence of policy certainty and growth-area designation.",
  },
  {
    key: "strategic",
    label: "Strategic sequencing",
    hint: "Increases the impact of citywide sequencing and timing priorities.",
  },
  {
    key: "infrastructure",
    label: "Servicing readiness",
    hint: "Emphasizes water, wastewater, and transit readiness.",
  },
  {
    key: "market",
    label: "Market momentum",
    hint: "Keeps redevelopment pressure and demand signals in view.",
  },
];

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
  const [cityWeights, setCityWeights] =
    useState<WeightProfile>(defaultCityWeights);
  const [developerInputs, setDeveloperInputs] = useState<DeveloperInputs>(
    defaultDeveloperInputs,
  );
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const activeWeights = useMemo(
    () =>
      activeLens === "city"
        ? normalizeWeights(cityWeights)
        : deriveDeveloperWeights(developerInputs),
    [activeLens, cityWeights, developerInputs],
  );

  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const matches =
        area.name.toLowerCase().includes(query.toLowerCase()) ||
        area.type.toLowerCase().includes(query.toLowerCase());
      if (!matches) return false;
      if (!filterHigh) return true;
      return computeReadiness(area, activeWeights) >= 75;
    });
  }, [query, filterHigh, activeWeights]);

  const visibleAreas = filteredAreas.length ? filteredAreas : areas;
  const selected =
    visibleAreas.find((area) => area.id === selectedId) ?? visibleAreas[0];
  const selectedScore = computeReadiness(selected, activeWeights);

  const readinessScores = visibleAreas.map((area) => ({
    id: area.id,
    name: area.name,
    score: computeReadiness(area, activeWeights),
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
    if (activeLens !== "developer") {
      setDeveloperModalOpen(false);
    }
  }, [activeLens]);

  useEffect(() => {
    const preferences = loadDashboardPreferences();
    if (!preferences) {
      setPreferencesLoaded(true);
      return;
    }
    setActiveLens(preferences.activeLens ?? "city");
    setCityWeights(preferences.cityWeights ?? defaultCityWeights);
    setDeveloperInputs(preferences.developerInputs ?? defaultDeveloperInputs);
    setSelectedId(preferences.selectedId ?? areas[0]?.id ?? "");
    setFilterHigh(Boolean(preferences.filterHigh));
    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    const preferences: DashboardPreferences = {
      activeLens,
      cityWeights,
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
    cityWeights,
    developerInputs,
    selectedId,
    filterHigh,
    preferencesLoaded,
  ]);

  const assistantSummary =
    activeLens === "city"
      ? `City lens: policy and strategic priorities are weighted higher. ${formatWeightPercent(
          activeWeights.policy,
        )} of the score emphasizes policy alignment and ${formatWeightPercent(
          activeWeights.strategic,
        )} emphasizes strategic sequencing.`
      : `Developer lens: feasibility and delivery risk are weighted higher. ${formatWeightPercent(
          activeWeights.market,
        )} of the score emphasizes market demand and ${formatWeightPercent(
          activeWeights.infrastructure,
        )} emphasizes servicing readiness.`;

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
              const score = computeReadiness(area, activeWeights);
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

            {activeLens === "city" ? (
              <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">City Priorities</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Adjust how strongly each Official Plan-led priority affects
                      the ranking.
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                    OP-focused
                  </span>
                </div>
                <div className="mt-4 space-y-4">
                  {cityPriorityLabels.map((item) => (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-[var(--muted)]">{item.hint}</p>
                        </div>
                        <span className="text-sm font-semibold text-[var(--accent)]">
                          {cityWeights[item.key]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={cityWeights[item.key]}
                        onChange={(event) =>
                          setCityWeights((current) => ({
                            ...current,
                            [item.key]: Number(event.target.value),
                          }))
                        }
                        style={{ accentColor: "var(--accent)" }}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Higher values tilt the score toward the City&apos;s priority lens,
                  while preserving the same underlying area data.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Developer Project Inputs</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Enter project context to shift the score toward feasibility
                      and delivery risk.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeveloperModalOpen(true)}
                    className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--accent)] hover:border-[var(--accent)]"
                  >
                    Open form
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#f7f7f3] px-3 py-1 text-xs text-[var(--muted)]">
                    {developerInputs.projectType}
                  </span>
                  <span className="rounded-full bg-[#f7f7f3] px-3 py-1 text-xs text-[var(--muted)]">
                    {developerInputs.timeline}
                  </span>
                  <span className="rounded-full bg-[#f7f7f3] px-3 py-1 text-xs text-[var(--muted)]">
                    {developerInputs.servicingSensitivity} servicing sensitivity
                  </span>
                  <span className="rounded-full bg-[#f7f7f3] px-3 py-1 text-xs text-[var(--muted)]">
                    {developerInputs.zoningCertainty} zoning certainty
                  </span>
                </div>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  These inputs change the weight profile used for Developer view,
                  but the area evidence remains the same.
                </p>
              </div>
            )}

            <div className="mt-4">
              <MapView
                areas={visibleAreas}
                selectedId={selected?.id ?? ""}
                onSelect={setSelectedId}
                weights={activeWeights}
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

      {activeLens === "developer" && developerModalOpen ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 px-4">
          <button
            type="button"
            className="absolute inset-0 h-full w-full"
            aria-label="Close developer inputs modal"
            onClick={() => setDeveloperModalOpen(false)}
          />
          <div className="relative z-[2001] w-full max-w-2xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Developer Inputs
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  Project profile
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  These inputs change the feasibility weighting profile used for
                  Developer view.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeveloperModalOpen(false)}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--accent)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Project type
                </span>
                <select
                  value={developerInputs.projectType}
                  onChange={(event) =>
                    setDeveloperInputs((current) => ({
                      ...current,
                      projectType: event.target.value as DeveloperInputs["projectType"],
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="residential">Residential</option>
                  <option value="mixed-use">Mixed-use</option>
                  <option value="employment">Employment / commercial</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Target delivery timeline
                </span>
                <select
                  value={developerInputs.timeline}
                  onChange={(event) =>
                    setDeveloperInputs((current) => ({
                      ...current,
                      timeline: event.target.value as DeveloperInputs["timeline"],
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="0-2 years">0-2 years</option>
                  <option value="2-4 years">2-4 years</option>
                  <option value="4+ years">4+ years</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Servicing sensitivity
                </span>
                <select
                  value={developerInputs.servicingSensitivity}
                  onChange={(event) =>
                    setDeveloperInputs((current) => ({
                      ...current,
                      servicingSensitivity: event.target.value as DeveloperInputs["servicingSensitivity"],
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Zoning certainty needed
                </span>
                <select
                  value={developerInputs.zoningCertainty}
                  onChange={(event) =>
                    setDeveloperInputs((current) => ({
                      ...current,
                      zoningCertainty: event.target.value as DeveloperInputs["zoningCertainty"],
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[#f7f7f3] p-4 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">Current profile</p>
              <p className="mt-1">
                {developerInputs.projectType} project, {developerInputs.timeline},{" "}
                {developerInputs.servicingSensitivity} servicing sensitivity,{" "}
                {developerInputs.zoningCertainty} zoning certainty.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeveloperModalOpen(false)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setDeveloperModalOpen(false)}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Apply inputs
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AssistantSidebar
        area={selected as AreaRecord}
        lens={activeLens}
        score={selectedScore}
        weights={activeWeights}
        summary={assistantSummary}
        prompts={lensPrompts[activeLens]}
        contextLines={assistantContextLines}
      />
    </div>
  );
}
