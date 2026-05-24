"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  briefRequestKey?: number;
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
      ? `Overview: This area sits within a growth and mobility readiness workflow. Mobility score: ${area.scores.mobility}. Key evidence: ${evidenceSource}: ${evidenceExcerpt}. Next step: focus City review on transportation constraints, servicing timing, OP alignment, and the municipal action most likely to unlock readiness.${lensContext}`
      : `Overview: This area has a credible delivery case, but feasibility depends on mobility, policy, servicing, approvals, and project timing. Mobility score: ${area.scores.mobility}. Key evidence: ${evidenceSource}: ${evidenceExcerpt}. Next step: use the project profile to test whether the proposal fits local transportation and servicing conditions.${lensContext}`;
  }
  if (prompt.includes("planning brief") || prompt.includes("Generate a short")) {
    return [
      `Planning brief: ${area.name}`,
      `${area.name} is a ${scoreBand(area.scores.mobility)} mobility-readiness ${area.type.replace("_", " ")} with an overall planning constraint of ${area.main_constraint.toLowerCase()}.`,
      `Growth and mobility factors: market ${area.scores.market}, mobility ${area.scores.mobility}, infrastructure ${area.scores.infrastructure}, policy ${area.scores.policy}, strategic ${area.scores.strategic}.`,
      `Transportation considerations: review transit access, active transportation gaps, sidewalk completeness, roadway connectivity, and safety exposure before advancing major growth.`,
      `Recommended municipal actions: ${area.recommended_actions.slice(0, 3).join("; ")}.`,
      `Evidence: ${evidenceSource}: ${evidenceExcerpt}`,
    ].join("\n");
  }
  if (prompt.includes("transportation") || prompt.includes("mobility")) {
    return `Transportation readiness: ${area.name} has a mobility score of ${area.scores.mobility}. The planning review should check transit access, sidewalk completeness, active transportation gaps, roadway connectivity, and safety exposure. The next municipal action is ${topAction}.${lensContext}`;
  }
  if (prompt.includes("Official Plan") || prompt.includes("policies")) {
    return `Policy review: This area is anchored in OP direction. ${evidenceSource} notes: ${evidenceExcerpt}.${lensContext}`;
  }
  if (prompt.includes("sequencing")) {
    return `Sequencing risk: The main driver is ${area.main_constraint.toLowerCase()}. A practical next step is ${topAction}.${lensContext}`;
  }
  if (prompt.includes("restriction") || prompt.includes("restrictions")) {
    return `Restrictions: The most likely restriction is ${area.main_constraint.toLowerCase()}. The clearest evidence tied to this area is ${evidenceSource}: ${evidenceExcerpt}${lensContext}`;
  }
  if (prompt.includes("influencing growth")) {
    return `Growth influence: The strongest influence on growth potential is ${area.main_constraint.toLowerCase()}. ${topAction} would reduce that friction.${lensContext}`;
  }
  if (prompt.includes("policy conflict")) {
    return `Policy conflict: The likely conflict is between current area conditions and the policy direction implied by ${evidenceSource}. ${evidenceExcerpt}.${lensContext}`;
  }
  if (prompt.includes("unblock") || prompt.includes("next step")) {
    return `Next step: The fastest unlock is likely ${topAction}. It addresses the primary planning constraint and should be checked against mobility readiness before major growth is prioritized.${lensContext}`;
  }
  if (prompt.includes("delivery risk")) {
    return `Delivery risk: The main delivery risk is ${area.main_constraint.toLowerCase()}. Resolving it would improve feasibility.${lensContext}`;
  }
  if (prompt.includes("feasibility")) {
    return `Feasibility: Feasibility improves most by addressing ${area.main_constraint.toLowerCase()} and verifying mobility readiness. Start with ${topAction}.${lensContext}`;
  }
  if (prompt.includes("market")) {
    return `Market signal: The strongest market signal here is the ${area.scores.market} market score, supported by area evidence and development activity.${lensContext}`;
  }
  return lens === "city"
    ? `Overview: This area is positioned as a policy-, mobility-, and strategy-aligned growth opportunity. Evidence: ${evidenceSource}: ${evidenceExcerpt}${lensContext}`
    : `Overview: This area shows viable market demand with mobility and servicing dependencies. Evidence: ${evidenceSource}: ${evidenceExcerpt}${lensContext}`;
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
  briefRequestKey = 0,
}: AssistantSidebarProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const resetCopilot = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setDraft("");
    setActivePrompt(null);
    setIsGenerating(false);
    setShowSuggestedQuestions(true);
  }, []);

  const closeCopilot = useCallback(() => {
    resetCopilot();
    setOpen(false);
  }, [resetCopilot]);

  const askAssistant = useCallback(async (
    prompt: string,
    options?: { silent?: boolean },
  ) => {
    setActivePrompt(prompt);
    setShowSuggestedQuestions(false);
    const nextMessages: Message[] = [
      ...messagesRef.current,
      { role: "user", text: prompt },
    ];
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

      if (!options?.silent) {
        setMessages((current) => [
          ...current,
          { role: "assistant", text: normalizeAssistantText(answer) },
        ]);
      }
      setActivePrompt(null);
      setShowSuggestedQuestions(true);
    } catch {
      const fallbackText = normalizeAssistantText(
        replyForPrompt(area, lens, prompt, contextLines),
      );
      if (!options?.silent) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: fallbackText,
          },
        ]);
      }
      setActivePrompt(null);
      setShowSuggestedQuestions(true);
    } finally {
      setIsGenerating(false);
    }
  }, [area, contextLines, developerInputs, lens, summary, weights]);

  useEffect(() => {
    if (!briefRequestKey) return;
    setOpen(true);
    void askAssistant("Generate a short planning brief for this area.");
  }, [briefRequestKey, askAssistant]);

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
        aria-label="Open Planning Copilot"
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
          Planning Copilot
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/20">
          <button
            type="button"
            className="absolute inset-0 z-0 h-full w-full cursor-default"
            aria-label="Close Planning Copilot backdrop"
            onClick={closeCopilot}
          />
          <aside className="absolute right-0 top-0 z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--surface)] shadow-2xl">
            <header className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Planning Copilot
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {area.name}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {score} growth + mobility score - {scoreBand(score)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCopilot}
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
              <button
                type="button"
                onClick={() =>
                  void askAssistant(
                    "Generate a short planning brief for this area.",
                  )
                }
                className="mt-3 w-full rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Generate Planning Brief
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {messages.length === 0 && !isGenerating ? (
                  <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Ready when you are
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                      Ask a planning question or generate a brief
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      The copilot will use {area.name}, the {lens} lens, the
                      current score, mobility context, constraints, evidence,
                      and recommended actions.
                    </p>
                  </section>
                ) : null}

                {lens === "developer" ? (
                  <details className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                            Project profile
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                            Test delivery feasibility
                          </h3>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Open to tune project inputs before asking the copilot
                            to test delivery, mobility, servicing, and approvals risk.
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
                            setShowSuggestedQuestions(true);
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
                            setShowSuggestedQuestions(true);
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
                              setShowSuggestedQuestions(true);
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
                              setShowSuggestedQuestions(true);
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
                        onClick={() => void askAssistant("Assess delivery feasibility")}
                        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        Assess delivery feasibility
                      </button>
                    </div>
                  </details>
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
                        Building a planning response from the selected lens...
                      </div>
                    </div>
                  ) : null}
                </div>

              </div>
            </div>

            <footer className="border-t border-[var(--line)] px-5 py-4">
              {showSuggestedQuestions && !isGenerating ? (
                <div className="mb-3 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Suggested Questions
                  </p>
                  <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
                    {prompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void askAssistant(prompt)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          activePrompt === prompt
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-[var(--line)] bg-white p-3">
                <label className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Ask the copilot
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    className="w-full rounded-full border border-[var(--line)] px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    placeholder="Ask about mobility, readiness, evidence, or actions..."
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

