"use client";

import { useEffect, useMemo, useState } from "react";
import type { AreaRecord } from "../data/areas";
import { computeReadiness, scoreBand } from "../lib/scoring";

type Lens = "city" | "developer";
type Role = "assistant" | "user";

type Message = {
  role: Role;
  text: string;
};

type AssistantSidebarProps = {
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
    return `${area.name} is ${band} readiness with a score of ${readiness}. City-facing priorities emphasize policy alignment and strategic sequencing.`;
  }
  return `${area.name} is ${band} readiness with a score of ${readiness}. Developer-facing priorities emphasize feasibility and delivery risk.`;
}

function replyForPrompt(area: AreaRecord, lens: Lens, prompt: string) {
  const topAction = area.recommended_actions[0] ?? "Target a near-term action.";
  const evidenceSource =
    area.source_evidence[0]?.source ?? "Official Plan / Master Plan documentation";
  const evidenceExcerpt = area.source_evidence[0]?.excerpt ?? "";

  if (prompt.includes("Official Plan")) {
    return `This area is anchored in OP direction. ${evidenceSource} notes: ${evidenceExcerpt}`;
  }
  if (prompt.includes("sequencing")) {
    return `Sequencing risk is driven by ${area.main_constraint.toLowerCase()}. A practical next step is ${topAction}.`;
  }
  if (prompt.includes("unblock")) {
    return `The fastest unlock is likely ${topAction}. It addresses the primary constraint directly.`;
  }
  if (prompt.includes("delivery risk")) {
    return `The main delivery risk is ${area.main_constraint.toLowerCase()}. Resolving it would improve feasibility.`;
  }
  if (prompt.includes("feasibility")) {
    return `Feasibility improves most by addressing ${area.main_constraint.toLowerCase()}. Start with ${topAction}.`;
  }
  if (prompt.includes("market")) {
    return `The strongest market signal here is the ${area.scores.market} market score, supported by the area notes and development activity.`;
  }
  return lens === "city"
    ? "This area is positioned as a policy- and strategy-aligned growth opportunity."
    : "This area shows viable market demand with near-term delivery dependencies.";
}

export default function AssistantSidebar({ area }: AssistantSidebarProps) {
  const [open, setOpen] = useState(false);
  const [lens, setLens] = useState<Lens>("city");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const summary = useMemo(() => buildSummary(area, lens), [area, lens]);
  const prompts = promptsByLens[lens];

  useEffect(() => {
    if (!open) return;
    setMessages([
      {
        role: "assistant",
        text: summary,
      },
    ]);
    setActivePrompt(null);
    setDraft("");
  }, [open, summary, area.id, lens]);

  const sendPrompt = (prompt: string) => {
    setActivePrompt(prompt);
    setMessages((current) => [
      ...current,
      { role: "user", text: prompt },
      { role: "assistant", text: replyForPrompt(area, lens, prompt) },
    ]);
  };

  const sendDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      {
        role: "assistant",
        text: replyForPrompt(area, lens, trimmed),
      },
    ]);
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
                    {computeReadiness(area)} readiness score
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
                <button
                  type="button"
                  onClick={() => setLens("city")}
                  className={`flex-1 rounded-full px-3 py-2 font-semibold transition ${
                    lens === "city"
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  City view
                </button>
                <button
                  type="button"
                  onClick={() => setLens("developer")}
                  className={`flex-1 rounded-full px-3 py-2 font-semibold transition ${
                    lens === "developer"
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  Developer view
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Suggested Questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendPrompt(prompt)}
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

                <div className="space-y-3 pt-2">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          message.role === "user"
                            ? "bg-[var(--accent)] text-white"
                            : "bg-white text-[var(--foreground)] border border-[var(--line)]"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>
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
                <p className="mt-2 text-xs text-[var(--muted)]">
                  This assistant uses structured dashboard evidence and recommended
                  actions.
                </p>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
