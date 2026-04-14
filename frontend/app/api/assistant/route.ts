import { NextResponse } from "next/server";
import type { WeightProfile } from "@/app/lib/scoring";

type LensMode = "city" | "developer";

type AssistantMessage = {
  role: "assistant" | "user";
  text: string;
};

type AssistantRequest = {
  area: {
    name: string;
    type: string;
    main_constraint: string;
    scores: {
      market: number;
      infrastructure: number;
      policy: number;
      strategic: number;
    };
    why_bullets: string[];
    recommended_actions: string[];
    source_evidence: { source: string; excerpt: string }[];
  };
  lens: LensMode;
  summary: string;
  contextLines: string[];
  weights: WeightProfile;
  messages: AssistantMessage[];
  prompt: string;
};

function buildDeterministicAnswer(payload: AssistantRequest) {
  const { area, lens, prompt, contextLines, summary } = payload;
  const topAction = area.recommended_actions[0] ?? "Target a near-term action.";
  const evidence = area.source_evidence[0];
  const context = contextLines.length ? ` ${contextLines[0]}` : "";

  if (prompt.includes("Official Plan")) {
    return `${summary} The OP anchor is ${evidence?.source ?? "the plan record"} with the excerpt: ${evidence?.excerpt ?? "no excerpt provided"}.${context}`;
  }
  if (prompt.includes("sequencing")) {
    return `${summary} The key sequencing issue is ${area.main_constraint.toLowerCase()}. A practical next step is ${topAction}.${context}`;
  }
  if (prompt.includes("unblock")) {
    return `${summary} The fastest unlock is likely ${topAction}. It addresses the primary constraint directly.${context}`;
  }
  if (prompt.includes("delivery risk")) {
    return `${summary} The main delivery risk is ${area.main_constraint.toLowerCase()}. Resolving it would improve feasibility.${context}`;
  }
  if (prompt.includes("feasibility")) {
    return `${summary} Feasibility improves most by addressing ${area.main_constraint.toLowerCase()}. Start with ${topAction}.${context}`;
  }
  if (prompt.includes("market")) {
    return `${summary} The strongest market signal here is the ${area.scores.market} market score, supported by the area evidence and development activity.${context}`;
  }

  return lens === "city"
    ? `${summary} This area is positioned as a policy- and strategy-aligned growth opportunity.`
    : `${summary} This area shows viable market demand with near-term delivery dependencies.`;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AssistantRequest;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    return NextResponse.json({
      answer: buildDeterministicAnswer(payload),
      mode: "deterministic",
    });
  }

  const conversation = [
    {
      role: "system",
      content:
        "You are a municipal planning insights assistant. Use only the provided structured context. Do not invent evidence. Explain the score and the implications clearly and in plain language. Keep the response concise but substantive. If the context is insufficient, say what is missing.",
    },
    {
      role: "user",
      content: JSON.stringify(payload),
    },
    ...payload.messages.map((message) => ({
      role: message.role,
      content: message.text,
    })),
  ] as Array<{ role: "system" | "user" | "assistant"; content: string }>;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: conversation,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({
      answer: buildDeterministicAnswer(payload),
      mode: "deterministic",
    });
  }

  const data = await response.json();
  const answer =
    data?.choices?.[0]?.message?.content?.trim() ??
    buildDeterministicAnswer(payload);

  return NextResponse.json({
    answer,
    mode: "llm",
    model,
  });
}
