"use client";

import { useEffect, useMemo, useState } from "react";
import type { AreaRecord } from "../data/areas";
import { scoreBand } from "../lib/scoring";
import type { WeightProfile } from "../lib/scoring";
import type { EvidenceSnippet } from "../lib/policy-evidence";
import type { DeveloperInputs, LensMode } from "../lib/workflow";

type Role = "assistant" | "user";

type Message = {
  role: Role;
  text: string;
};

type OverviewSnapshot = {
  answer: string;
  sources: EvidenceSnippet[];
};

type DossierCard = {
  title: string;
  whyItMatters: string;
  excerpt: string;
  sourceLabel: string;
  metaLabel: string;
  status: "Applicable" | "Watch" | "Potential tension";
  implication: string;
};

type AssistantSidebarProps = {
  area: AreaRecord;
  lens: LensMode;
  score: number;
  weights: WeightProfile;
  summary: string;
  prompts: string[];
  contextLines: string[];
  developerInputs: DeveloperInputs;
  onDeveloperInputsChange: (next: DeveloperInputs) => void;
};

function replyForPrompt(
  area: AreaRecord,
  lens: LensMode,
  prompt: string,
  contextLines: string[],
) {
  const topAction = area.recommended_actions[0] ?? "Target a near-term action.";
  const evidence = area.source_evidence[0];
  const evidenceSource =
    evidence?.source ?? "Official Plan / Master Plan documentation";
  const evidenceExcerpt = evidence?.excerpt ?? "";
  const lensContext = contextLines.length ? ` ${contextLines[0]}` : "";

  if (
    prompt.includes("overview") ||
    prompt.includes("Provide Overview") ||
    prompt.includes("feasibility overview") ||
    prompt.includes("Calculate feasibility")
  ) {
    return lens === "city"
      ? `Overview: This parcel sits within a policy-sensitive growth context. Key evidence: ${evidenceSource}: ${evidenceExcerpt}. Next step: focus City review on the OP sections and master-plan rules most likely to affect growth.${lensContext}`
      : `Overview: This parcel has a credible development case, but feasibility depends on policy, servicing, and project timing. Key evidence: ${evidenceSource}: ${evidenceExcerpt}. Next step: use the project profile to test whether the proposal fits local policy and servicing conditions.${lensContext}`;
  }
  if (prompt.includes("Official Plan") || prompt.includes("policies")) {
    return `Policy review: This area is anchored in OP direction. ${evidenceSource} notes: ${evidenceExcerpt}.${lensContext}`;
  }
  if (prompt.includes("sequencing")) {
    return `Sequencing risk: The main driver is ${area.main_constraint.toLowerCase()}. A practical next step is ${topAction}.${lensContext}`;
  }
  if (prompt.includes("restriction") || prompt.includes("restrictions")) {
    return `Restrictions: The most likely restriction is ${area.main_constraint.toLowerCase()}. The clearest evidence tied to this parcel is ${evidenceSource}: ${evidenceExcerpt}${lensContext}`;
  }
  if (prompt.includes("influencing growth")) {
    return `Growth influence: The strongest influence on growth potential is ${area.main_constraint.toLowerCase()}. ${topAction} would reduce that friction.${lensContext}`;
  }
  if (prompt.includes("policy conflict")) {
    return `Policy conflict: The likely conflict is between current parcel conditions and the policy direction implied by ${evidenceSource}. ${evidenceExcerpt}.${lensContext}`;
  }
  if (prompt.includes("unblock") || prompt.includes("next step")) {
    return `Next step: The fastest unlock is likely ${topAction}. It addresses the primary constraint directly.${lensContext}`;
  }
  if (prompt.includes("delivery risk")) {
    return `Delivery risk: The main delivery risk is ${area.main_constraint.toLowerCase()}. Resolving it would improve feasibility.${lensContext}`;
  }
  if (prompt.includes("feasibility")) {
    return `Feasibility: Feasibility improves most by addressing ${area.main_constraint.toLowerCase()}. Start with ${topAction}.${lensContext}`;
  }
  if (prompt.includes("market")) {
    return `Market signal: The strongest market signal here is the ${area.scores.market} market score, supported by area evidence and development activity.${lensContext}`;
  }
  return lens === "city"
    ? `Overview: This area is positioned as a policy- and strategy-aligned growth opportunity. Evidence: ${evidenceSource}: ${evidenceExcerpt}${lensContext}`
    : `Overview: This area shows viable market demand with near-term delivery dependencies. Evidence: ${evidenceSource}: ${evidenceExcerpt}${lensContext}`;
}

function normalizeAssistantText(text: string) {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^- /gm, "- ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractOverviewLead(answer: string) {
  const lines = normalizeAssistantText(answer)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const overviewIndex = lines.findIndex(
    (line) => line.toLowerCase() === "overview",
  );
  if (overviewIndex >= 0 && lines[overviewIndex + 1]) {
    return lines[overviewIndex + 1];
  }
  return lines[0] ?? "";
}

function getEvidenceFamily(snippet: EvidenceSnippet) {
  const combined = [
    snippet.document_type,
    snippet.plan_family,
    snippet.source,
    snippet.document_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (combined.includes("official_plan") || combined.includes("official plan")) {
    return "Official Plan";
  }
  if (combined.includes("transportation")) return "TMP";
  if (combined.includes("infrastructure")) return "IMP";
  if (combined.includes("zoning")) return "Zoning By-Law";
  if (
    combined.includes("climate") ||
    combined.includes("greenspace") ||
    combined.includes("urban forest")
  ) {
    return "Climate / Greenspace";
  }
  if (combined.includes("financial") || combined.includes("lrfp")) return "LRFP";
  return snippet.source || "Planning evidence";
}

function familyWhyItMatters(family: string) {
  switch (family) {
    case "Official Plan":
      return "Sets the policy direction and long-term growth intent for this parcel.";
    case "TMP":
      return "Shows access, mobility, and sequencing implications that affect delivery.";
    case "IMP":
      return "Signals servicing capacity, timing, and capital constraints.";
    case "Zoning By-Law":
      return "Determines what is currently permitted and what may still need approval.";
    case "Climate / Greenspace":
      return "Highlights resilience, canopy, open-space, and environmental considerations.";
    case "LRFP":
      return "Shows whether the financial pathway supports implementation timing.";
    default:
      return "Provides planning context that may influence growth or delivery.";
  }
}

function getDossierStatus(family: string, snippet?: EvidenceSnippet) {
  const text = [
    snippet?.excerpt,
    snippet?.document_name,
    snippet?.section_title,
    family,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const tensionSignals = [
    "unfunded",
    "not yet scheduled",
    "pending",
    "under review",
    "requires",
    "lag",
    "constraint",
    "delay",
    "limited",
    "not committed",
  ];
  const positiveSignals = [
    "supports",
    "prioritized",
    "identified",
    "aligned",
    "already in place",
    "available",
    "strong",
  ];

  if (tensionSignals.some((signal) => text.includes(signal))) {
    return "Potential tension" as const;
  }
  if (positiveSignals.some((signal) => text.includes(signal))) {
    return "Applicable" as const;
  }

  if (family === "LRFP" || family === "IMP") return "Watch" as const;
  return "Applicable" as const;
}

function getDossierImplication(family: string, status: DossierCard["status"]) {
  if (status === "Potential tension") {
    switch (family) {
      case "Official Plan":
        return "Policy direction may be stronger than the current implementation path.";
      case "TMP":
        return "Mobility or sequencing may need to be resolved before growth can proceed.";
      case "IMP":
        return "Capital timing or servicing capacity could delay realization.";
      case "Zoning By-Law":
        return "Permissions may not yet match the intensity or form implied by policy.";
      case "Climate / Greenspace":
        return "Environmental or open-space expectations may constrain form or footprint.";
      case "LRFP":
        return "Funding timing may not yet support implementation at this parcel.";
      default:
        return "There is likely a plan-to-project mismatch that deserves review.";
    }
  }

  if (status === "Watch") {
    switch (family) {
      case "IMP":
        return "Implementation looks possible, but timing or sequencing still matters.";
      case "LRFP":
        return "Financial support is present conceptually, but delivery timing should be checked.";
      default:
        return "Relevant to the parcel, but not the most decisive planning signal.";
    }
  }

  switch (family) {
    case "Official Plan":
      return "This is the strongest policy signal for this parcel.";
    case "TMP":
      return "This plan family supports or conditions access and growth.";
    case "IMP":
      return "This provides the servicing context that underpins delivery.";
    case "Zoning By-Law":
      return "This is directly relevant to what could proceed on the parcel.";
    case "Climate / Greenspace":
      return "This adds design, resilience, or open-space direction.";
    case "LRFP":
      return "This helps confirm whether the implementation path is funded.";
    default:
      return "This is relevant to the parcel’s planning context.";
  }
}

function buildDossierCards(snippets: EvidenceSnippet[]) {
  const order = [
    "Official Plan",
    "TMP",
    "IMP",
    "Zoning By-Law",
    "Climate / Greenspace",
    "LRFP",
  ];
  const grouped = new Map<string, EvidenceSnippet[]>();

  snippets.forEach((snippet) => {
    const family = getEvidenceFamily(snippet);
    const bucket = grouped.get(family) ?? [];
    bucket.push(snippet);
    grouped.set(family, bucket);
  });

  return order.map((family) => {
    const snippet = grouped.get(family)?.[0];
    const status = getDossierStatus(family, snippet);
    return {
      title: family,
      whyItMatters: familyWhyItMatters(family),
      excerpt:
        snippet?.excerpt ||
        "No direct excerpt surfaced yet for this parcel. Use the follow-up questions to probe this plan family further.",
      sourceLabel: snippet?.source ?? "No direct excerpt selected",
      metaLabel: snippet
        ? [
            snippet.document_name,
            snippet.section_title,
            snippet.policy_id,
            snippet.page_number ? `p.${snippet.page_number}` : "",
          ]
            .filter(Boolean)
            .join(" · ")
        : "Evidence not yet surfaced",
      status,
      implication: getDossierImplication(family, status),
    } satisfies DossierCard;
  });
}

export default function AssistantSidebar({
  area,
  lens,
  score,
  weights,
  summary,
  prompts,
  contextLines,
  developerInputs,
  onDeveloperInputsChange,
}: AssistantSidebarProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCalculatedFeasibility, setHasCalculatedFeasibility] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);
  const [overviewSnapshot, setOverviewSnapshot] = useState<OverviewSnapshot | null>(
    null,
  );
  const cityDossierCards = useMemo(
    () => buildDossierCards(overviewSnapshot?.sources ?? []),
    [overviewSnapshot?.sources],
  );

  useEffect(() => {
    if (!open) return;
    setMessages([]);
    setActivePrompt(null);
    setDraft("");
    setIsGenerating(false);
    setHasCalculatedFeasibility(lens === "city");
    setShowSuggestedQuestions(lens === "city");
    setOverviewSnapshot(null);
    if (lens === "city") {
      void askAssistant(
        "Provide a parcel dossier and explain the main planning context. Focus on the Official Plan, TMP, IMP, zoning by-law, climate / greenspace, and LRFP implications.",
        { silent: true },
      );
    }
  }, [open, summary, area.id, lens]);

  const askAssistant = async (
    prompt: string,
    options?: { silent?: boolean },
  ) => {
    setActivePrompt(prompt);
    setShowSuggestedQuestions(false);
    const nextMessages = [...messages, { role: "user", text: prompt }];
    if (!options?.silent) {
      setMessages(nextMessages);
    }
    setIsGenerating(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          area,
          lens,
          summary,
          contextLines,
          weights,
          projectProfile: developerInputs,
          messages: nextMessages,
          prompt,
        }),
      });

      const data = (await response.json()) as {
        answer?: string;
        sources?: EvidenceSnippet[];
      };
      const answer =
        data.answer ?? replyForPrompt(area, lens, prompt, contextLines);

      if (options?.silent) {
        setOverviewSnapshot({
          answer: normalizeAssistantText(answer),
          sources: data.sources ?? [],
        });
      } else {
        setMessages((current) => [
          ...current,
          { role: "assistant", text: normalizeAssistantText(answer) },
        ]);
      }
      setActivePrompt(null);
      if (lens === "developer" && prompt.includes("Calculate feasibility")) {
        setHasCalculatedFeasibility(true);
      }
      setShowSuggestedQuestions(true);
    } catch {
      const fallbackText = normalizeAssistantText(
        replyForPrompt(area, lens, prompt, contextLines),
      );
      if (options?.silent) {
        setOverviewSnapshot({
          answer: fallbackText,
          sources: [],
        });
      } else {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: fallbackText,
          },
        ]);
      }
      setActivePrompt(null);
      if (lens === "developer" && prompt.includes("Calculate feasibility")) {
        setHasCalculatedFeasibility(true);
      }
      setShowSuggestedQuestions(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    void askAssistant(trimmed);
    setDraft("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-6 top-6 z-30 flex h-12 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 shadow-md transition hover:border-[var(--accent)]"
        aria-label="Open insights assistant"
      >
        <svg
          className="h-5 w-5 text-[var(--accent)]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 12h10M7 8h10M7 16h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H9l-5 4V5z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-semibold text-[var(--foreground)]">
          Assistant
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/20">
          <button
            type="button"
            className="absolute inset-0 z-0 h-full w-full cursor-default"
            aria-label="Close insights assistant backdrop"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--surface)] shadow-2xl">
            <header className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Insights Assistant
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {area.name}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {score} readiness score - {scoreBand(score)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--accent)]"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 flex rounded-full border border-[var(--line)] bg-white p-1 text-xs">
                <div className="flex-1 rounded-full px-3 py-2 text-center font-semibold bg-[var(--accent-soft)] text-[var(--accent)]">
                  {lens === "city" ? "City view" : "Developer view"}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {lens === "city" ? (
                  <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                          Parcel overview
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                          Master-plan dossier
                        </h3>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          A Council-facing brief built from the Official Plan, TMP, IMP, zoning, climate / greenspace, and LRFP evidence most relevant to this parcel.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl bg-[var(--accent-soft)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                        Council read
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                        {extractOverviewLead(overviewSnapshot?.answer ?? summary)}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">
                        Applicable = supports or directly guides the parcel
                      </span>
                      <span className="rounded-full bg-[#fff8df] px-3 py-1 text-[#8b6b11]">
                        Watch = relevant, but timing or clarity still matters
                      </span>
                      <span className="rounded-full bg-[#fff3eb] px-3 py-1 text-[#8c4a11]">
                        Potential tension = likely constraint or mismatch
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {cityDossierCards.map((card) => (
                        <article
                          key={card.title}
                          className={`rounded-xl border bg-white p-3 shadow-sm ${
                            card.status === "Potential tension"
                              ? "border-[#d89b7a] border-l-4 border-l-[#b15a19]"
                              : card.status === "Watch"
                                ? "border-[#d6c892] border-l-4 border-l-[#b08f24]"
                                : "border-[var(--line)] border-l-4 border-l-[var(--accent)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                                {card.title}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                                {card.whyItMatters}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                card.status === "Potential tension"
                                  ? "bg-[#fff3eb] text-[#8c4a11]"
                                  : card.status === "Watch"
                                    ? "bg-[#fff8df] text-[#8b6b11]"
                                    : "bg-[var(--accent-soft)] text-[var(--accent)]"
                              }`}
                            >
                              {card.status}
                            </span>
                          </div>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                            Key implication
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                            {card.implication}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                            {card.excerpt}
                          </p>
                          <div className="mt-3 rounded-lg bg-[#fcfcfa] px-3 py-2 text-[11px] text-[var(--muted)]">
                            <span className="font-semibold text-[var(--foreground)]">
                              Source:
                            </span>{" "}
                            {card.sourceLabel}
                            {card.metaLabel ? ` · ${card.metaLabel}` : ""}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : lens === "developer" ? (
                  <details className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                            Project profile
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                            Simulate development feasibility
                          </h3>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Open to tune the project inputs before asking the assistant to calculate feasibility.
                          </p>
                        </div>
                        <svg className="mt-1 h-4 w-4 text-[var(--muted)]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </summary>
                    <div className="mt-4 grid gap-3">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          Project type
                        </span>
                        <select
                          className="w-full rounded-xl border border-[var(--line)] bg-[#fcfcfa] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                          value={developerInputs.projectType}
                          onChange={(event) => {
                            setHasCalculatedFeasibility(false);
                            setShowSuggestedQuestions(false);
                            onDeveloperInputsChange({
                              ...developerInputs,
                              projectType: event.target.value as DeveloperInputs["projectType"],
                            });
                          }}
                        >
                          <option value="residential">Residential</option>
                          <option value="mixed-use">Mixed-use</option>
                          <option value="employment">Employment / commercial</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          Project scale
                        </span>
                        <select
                          className="w-full rounded-xl border border-[var(--line)] bg-[#fcfcfa] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                          value={developerInputs.timeline}
                          onChange={(event) => {
                            setHasCalculatedFeasibility(false);
                            setShowSuggestedQuestions(false);
                            onDeveloperInputsChange({
                              ...developerInputs,
                              timeline: event.target.value as DeveloperInputs["timeline"],
                            });
                          }}
                        >
                          <option value="0-2 years">Small / 0-2 years</option>
                          <option value="2-4 years">Medium / 2-4 years</option>
                          <option value="4+ years">Large / 4+ years</option>
                        </select>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                            Servicing sensitivity
                          </span>
                          <select
                            className="w-full rounded-xl border border-[var(--line)] bg-[#fcfcfa] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                            value={developerInputs.servicingSensitivity}
                            onChange={(event) => {
                              setHasCalculatedFeasibility(false);
                              setShowSuggestedQuestions(false);
                              onDeveloperInputsChange({
                                ...developerInputs,
                                servicingSensitivity: event.target.value as DeveloperInputs["servicingSensitivity"],
                              });
                            }}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                            Zoning certainty
                          </span>
                          <select
                            className="w-full rounded-xl border border-[var(--line)] bg-[#fcfcfa] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                            value={developerInputs.zoningCertainty}
                            onChange={(event) => {
                              setHasCalculatedFeasibility(false);
                              setShowSuggestedQuestions(false);
                              onDeveloperInputsChange({
                                ...developerInputs,
                                zoningCertainty: event.target.value as DeveloperInputs["zoningCertainty"],
                              });
                            }}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => void askAssistant("Calculate feasibility")}
                        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        Calculate feasibility
                      </button>
                    </div>
                  </details>
                ) : null}

                {lens === "city" && showSuggestedQuestions ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Suggested Questions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {prompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void askAssistant(prompt)}
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
                  </div>
                ) : null}

                <div className="space-y-3 pt-2">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          message.role === "user"
                            ? "bg-[var(--accent)] text-white"
                            : "border border-[var(--line)] bg-white text-[var(--foreground)]"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  {isGenerating ? (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-sm">
                        Thinking through the selected lens...
                      </div>
                    </div>
                  ) : null}
                </div>

                {lens === "developer" && hasCalculatedFeasibility && showSuggestedQuestions ? (
                  <div className="space-y-2 pt-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Suggested Questions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {prompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void askAssistant(prompt)}
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
                  </div>
                ) : null}

              </div>
            </div>

            <footer className="border-t border-[var(--line)] px-5 py-4">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-3">
                <label className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Ask a question
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    className="w-full rounded-full border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    placeholder="Ask about readiness, evidence, or actions..."
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        sendDraft();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={sendDraft}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Send
                  </button>
                </div>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}

