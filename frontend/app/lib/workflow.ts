export type LensMode = "city" | "developer";

export type DeveloperInputs = {
  projectType: "residential" | "mixed-use" | "employment";
  timeline: "0-2 years" | "2-4 years" | "4+ years";
  servicingSensitivity: "low" | "medium" | "high";
  zoningCertainty: "low" | "medium" | "high";
};

export type PriorityKey = "market" | "infrastructure" | "policy" | "strategic";

export const defaultDeveloperInputs: DeveloperInputs = {
  projectType: "mixed-use",
  timeline: "2-4 years",
  servicingSensitivity: "high",
  zoningCertainty: "high",
};

export const cityPriorityLabels: Array<{
  key: PriorityKey;
  label: string;
  hint: string;
}> = [
  {
    key: "policy",
    label: "Intensification / OP alignment",
    hint: "Shows how strongly the Official Plan supports growth on this parcel.",
  },
  {
    key: "strategic",
    label: "Strategic sequencing",
    hint: "Reflects citywide timing, phasing, and coordination priorities.",
  },
  {
    key: "infrastructure",
    label: "Servicing readiness",
    hint: "Highlights water, wastewater, transit, and capital-readiness signals.",
  },
  {
    key: "market",
    label: "Market momentum",
    hint: "Keeps redevelopment pressure and project demand signals in view.",
  },
];

export const lensPrompts: Record<LensMode, string[]> = {
  city: [
    "Provide a parcel overview and explain the main planning context.",
    "What policies or restrictions pertain to this lot?",
    "How may the current policies influence growth potential here?",
    "Which Official Plan, TMP, IMP, or zoning sections matter most here?",
    "Is there any sign of a policy conflict, outdated restriction, or flexibility issue?",
    "What mitigation, clarification, or City review action should staff consider next?",
  ],
  developer: [
    "Provide a feasibility overview for this project.",
    "What are the biggest delivery risks or blockers for this parcel?",
    "Which policies, zoning rules, or servicing constraints matter most?",
    "How do project scale, density, and timeline affect feasibility here?",
    "What approvals, clarifications, or infrastructure changes would improve viability?",
    "What would make this project more feasible in the next 12-24 months?",
  ],
};
