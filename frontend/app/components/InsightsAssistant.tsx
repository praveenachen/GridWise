import { useMemo, useState } from "react";
import type { AreaRecord } from "../data/areas";
import { computeReadiness, scoreBand } from "../lib/scoring";

type Lens = "city" | "developer";

type InsightsAssistantProps = {
  area: AreaRecord;
};

const promptsByLens: Record<Lens, string[]> = {
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

function buildSummary(area: AreaRecord, lens: Lens) {
  const readiness = computeReadiness(area);
  const band = scoreBand(readiness).toLowerCase();
  if (lens === "city") {
    return `${area.name} is ${band} readiness with a score of ${readiness}. City-facing priorities emphasize policy alignment and strategic sequencing. The primary constraint is ${area.main_constraint.toLowerCase()}.`;
  }
  return `${area.name} is ${band} readiness with a score of ${readiness}. Developer-facing priorities emphasize feasibility and delivery risk. The primary constraint is ${area.main_constraint.toLowerCase()}.`;
}

function answerPrompt(area: AreaRecord, lens: Lens, prompt: string) {
  const topAction = area.recommended_actions[0] ?? "Target a near-term action.";
  const evidence =
    area.source_evidence[0]?.source ??
    "Official Plan / Master Plan documentation";
  if (prompt.includes("Official Plan")) {
    return `Alignment is supported by OP designations and related policy guidance. Evidence base: ${evidence}.`;
  }
  if (prompt.includes("sequencing")) {
    return `Sequencing risk is driven by ${area.main_constraint.toLowerCase()}. A practical mitigation is: ${topAction}.`;
  }
  if (prompt.includes("unblock")) {
    return `The most impactful near-term action is likely: ${topAction}. This addresses the main constraint directly.`;
  }
  if (prompt.includes("delivery risk")) {
    return `Primary delivery risk: ${area.main_constraint}. Addressing it via ${topAction} improves feasibility.`;
  }
  if (prompt.includes("feasibility")) {
    return `Feasibility improves most by resolving: ${area.main_constraint.toLowerCase()}. Start with ${topAction}.`;
  }
  if (prompt.includes("market")) {
    return `Market signal is strongest where recent activity and demand indicators are highest. The market score here is ${area.scores.market}.`;
  }
  return lens === "city"
    ? "This area is positioned as a policy- and strategy-aligned growth opportunity."
    : "This area shows viable market demand with near-term delivery dependencies.";
}

export default function InsightsAssistant({ area }: InsightsAssistantProps) {
  const [lens, setLens] = useState<Lens>("city");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const summary = useMemo(() => buildSummary(area, lens), [area, lens]);
  const prompts = promptsByLens[lens];
  const response = activePrompt
    ? answerPrompt(area, lens, activePrompt)
    : "Select a prompt to see a focused explanation tied to this area.";

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Insights Assistant</h3>
          <p className="text-xs text-[var(--muted)]">
            Lens-aware summaries and guided questions.
          </p>
        </div>
        <div className="flex rounded-full border border-[var(--line)] bg-white p-1 text-xs">
          <button
            type="button"
            onClick={() => setLens("city")}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              lens === "city"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)]"
            }`}
          >
            City
          </button>
          <button
            type="button"
            onClick={() => setLens("developer")}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              lens === "developer"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)]"
            }`}
          >
            Developer
          </button>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm text-[var(--muted)]">
        {summary}
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Suggested Questions
        </p>
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setActivePrompt(prompt)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                activePrompt === prompt
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line)] bg-white text-[var(--muted)]"
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm text-[var(--foreground)]">
          {response}
        </div>
      </div>
    </div>
  );
}
