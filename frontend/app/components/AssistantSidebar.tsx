"use client";

import { useEffect, useState } from "react";
import type { AreaRecord } from "../data/areas";
import { scoreBand } from "../lib/scoring";
import type { WeightProfile } from "../lib/scoring";

type Lens = "city" | "developer";
type Role = "assistant" | "user";

type Message = {
  role: Role;
  text: string;
};

type AssistantSidebarProps = {
  area: AreaRecord;
  lens: Lens;
  score: number;
  weights: WeightProfile;
  summary: string;
  prompts: string[];
  contextLines: string[];
};

function replyForPrompt(
  area: AreaRecord,
  lens: Lens,
  prompt: string,
  contextLines: string[],
) {
  const topAction = area.recommended_actions[0] ?? "Target a near-term action.";
  const evidenceSource =
    area.source_evidence[0]?.source ?? "Official Plan / Master Plan documentation";
  const evidenceExcerpt = area.source_evidence[0]?.excerpt ?? "";
  const lensContext = contextLines.length ? ` ${contextLines[0]}` : "";

  if (prompt.includes("Official Plan")) {
    return `This area is anchored in OP direction. ${evidenceSource} notes: ${evidenceExcerpt}.${lensContext}`;
  }
  if (prompt.includes("sequencing")) {
    return `Sequencing risk is driven by ${area.main_constraint.toLowerCase()}. A practical next step is ${topAction}.${lensContext}`;
  }
  if (prompt.includes("unblock")) {
    return `The fastest unlock is likely ${topAction}. It addresses the primary constraint directly.${lensContext}`;
  }
  if (prompt.includes("delivery risk")) {
    return `The main delivery risk is ${area.main_constraint.toLowerCase()}. Resolving it would improve feasibility.${lensContext}`;
  }
  if (prompt.includes("feasibility")) {
    return `Feasibility improves most by addressing ${area.main_constraint.toLowerCase()}. Start with ${topAction}.${lensContext}`;
  }
  if (prompt.includes("market")) {
    return `The strongest market signal here is the ${area.scores.market} market score, supported by area evidence and development activity.${lensContext}`;
  }
  return lens === "city"
    ? `This area is positioned as a policy- and strategy-aligned growth opportunity.${lensContext}`
    : `This area shows viable market demand with near-term delivery dependencies.${lensContext}`;
}

export default function AssistantSidebar({
  area,
  lens,
  score,
  weights,
  summary,
  prompts,
  contextLines,
}: AssistantSidebarProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(false);
  }, [open, summary, area.id, lens]);

  const askAssistant = async (prompt: string) => {
    setActivePrompt(prompt);
    const nextMessages = [...messages, { role: "user", text: prompt }];
    setMessages(nextMessages);
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
          messages: nextMessages,
          prompt,
        }),
      });

      const data = (await response.json()) as { answer?: string };
      const answer =
        data.answer ?? replyForPrompt(area, lens, prompt, contextLines);

      setMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: replyForPrompt(area, lens, prompt, contextLines) },
      ]);
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
              <div className="mt-3 flex flex-wrap gap-2">
                {contextLines.map((line) => (
                  <span
                    key={line}
                    className="rounded-full bg-white px-3 py-1 text-[11px] text-[var(--muted)] border border-[var(--line)]"
                  >
                    {line}
                  </span>
                ))}
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
                  This assistant uses structured dashboard evidence and lens context.
                </p>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
