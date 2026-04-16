import { NextResponse } from "next/server";
import type { WeightProfile } from "@/app/lib/scoring";
import { selectRelevantEvidence, type EvidenceSnippet } from "@/app/lib/policy-evidence";
import type { DeveloperInputs } from "@/app/lib/workflow";

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
  projectProfile?: DeveloperInputs;
  summary: string;
  contextLines: string[];
  weights: WeightProfile;
  messages: AssistantMessage[];
  prompt: string;
};

function formatEvidence(evidence: EvidenceSnippet[]) {
  if (!evidence.length) {
    return "- No additional evidence was selected for this question.";
  }

  return evidence
    .map((item) => {
      const metaParts = [
        item.document_name,
        item.section_title,
        item.policy_id,
        item.page_number ? `p.${item.page_number}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      return `- ${item.source}${metaParts ? ` (${metaParts})` : ""}: ${item.excerpt}`;
    })
    .join("\n");
}

function followUpQuestions(lens: LensMode) {
  return lens === "city"
    ? [
        "Which policy section is the main constraint here?",
        "Does this look like an intentional restriction or an outdated one?",
        "What flexibility or mitigation options should City staff review next?",
      ]
    : [
        "What project size is most viable here?",
        "Which approval, zoning, or servicing issue matters most?",
        "What would most improve feasibility in the next 12-24 months?",
      ];
}

function buildDeterministicAnswer(
  payload: AssistantRequest,
  evidence: EvidenceSnippet[],
) {
  const { area, lens, contextLines, summary, projectProfile, prompt } = payload;
  const topAction = area.recommended_actions[0] ?? "Target a near-term action.";
  const context = contextLines.length ? ` ${contextLines[0]}` : "";

  const profileSummary = projectProfile
    ? `Project profile: ${projectProfile.projectType}, ${projectProfile.timeline}, ${projectProfile.servicingSensitivity} servicing sensitivity, ${projectProfile.zoningCertainty} zoning certainty.`
    : "";
  const normalizedPrompt = prompt.toLowerCase();

  const overview =
    normalizedPrompt.includes("calculate feasibility") && lens === "developer"
      ? `Overview: This project should be tested against policy, servicing, density, zoning, and timing constraints before it is treated as feasible.`
      : lens === "city"
      ? `Overview: This parcel is best read as a policy and sequencing question. The core issue is whether the current plan framework supports growth without avoidable conflict.`
      : `Overview: This parcel is best read as a feasibility question. The core issue is whether the proposed project can proceed with acceptable policy, servicing, and market risk.`;

  const constraintLine =
    lens === "city"
      ? `Likely policy constraint: ${area.main_constraint.toLowerCase()}.`
      : `Likely delivery constraint: ${area.main_constraint.toLowerCase()}.`;

  const evidenceBlock = formatEvidence(evidence.length ? evidence : area.source_evidence);

  return [
    `Overview`,
    overview,
    profileSummary ? `\n${profileSummary}` : "",
    `Key constraints`,
    `- ${constraintLine}`,
    `- ${summary}${context}`,
    `Relevant evidence`,
    evidenceBlock,
    `Mitigation options`,
    `- ${topAction}.`,
    `- ${area.recommended_actions[1] ?? "Coordinate a near-term review with relevant planning and servicing teams."}`,
    `Follow-up questions`,
    followUpQuestions(lens)
      .map((question) => `- ${question}`)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AssistantRequest;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const evidence = await selectRelevantEvidence({
    lens: payload.lens,
    prompt: payload.prompt,
    areaName: payload.area.name,
    areaConstraint: payload.area.main_constraint,
    projectProfile: payload.projectProfile ?? null,
    fallbackSnippets: payload.area.source_evidence,
    limit: payload.lens === "city" ? 8 : 5,
  });

  if (!apiKey) {
    return NextResponse.json({
      answer: buildDeterministicAnswer(payload, evidence),
      mode: "deterministic",
      sources: evidence,
    });
  }

  const conversation = [
    {
      role: "system",
      content:
        [
          "You are a municipal planning insights assistant.",
          "Use only the provided structured context and evidence snippets.",
          "Do not invent policy claims or cite sources that are not in the context.",
          "Write a grounded response using plain text with short section labels such as Overview, Key constraints, Relevant evidence, Mitigation options, and Follow-up questions.",
          "Do not use markdown headings, bullets, bold, code formatting, or other decorative syntax.",
          "Keep the answer detailed enough to feel useful, but stay concise and practical.",
          "If the context is insufficient, say what is missing.",
          payload.lens === "city"
            ? "In City view, emphasize Official Plan alignment, master-plan direction, policy restrictions, flexibility, and growth implications. Mention the most relevant document families when supported by the evidence, such as the Official Plan, TMP, IMP, zoning by-law, and financial plans."
            : "In Developer view, emphasize feasibility, zoning, servicing, market fit, delivery risk, and what a project team should verify before proceeding. Mention the most relevant document families when supported by the evidence, such as the Official Plan, TMP, IMP, zoning by-law, and financial plans.",
        ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        ...payload,
        evidence,
      }),
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
      answer: buildDeterministicAnswer(payload, evidence),
      mode: "deterministic",
      sources: evidence,
    });
  }

  const data = await response.json();
  const answer =
    data?.choices?.[0]?.message?.content?.trim() ??
    buildDeterministicAnswer(payload, evidence);

  return NextResponse.json({
    answer,
    mode: "llm",
    model,
    sources: evidence,
  });
}
