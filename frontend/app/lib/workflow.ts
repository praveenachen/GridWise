export type LensMode = "city" | "developer";

export type DeveloperInputs = {
  projectType: "residential" | "mixed-use" | "employment";
  timeline: "0-2 years" | "2-4 years" | "4+ years";
  servicingSensitivity: "low" | "medium" | "high";
  zoningCertainty: "low" | "medium" | "high";
};

export type PriorityKey =
  | "market"
  | "mobility"
  | "infrastructure"
  | "policy"
  | "strategic";

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
    key: "mobility",
    label: "Mobility readiness",
    hint: "Reflects transit access, active transportation, sidewalk completeness, safety exposure, and network connectivity.",
  },
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
    hint: "Highlights water, wastewater, utilities, and capital-readiness signals.",
  },
  {
    key: "market",
    label: "Market momentum",
    hint: "Keeps redevelopment pressure and project demand signals in view.",
  },
];

export const lensPrompts: Record<LensMode, string[]> = {
  city: [
    "Generate a short planning brief for this area.",
    "Why is this area ranked highly?",
    "What transportation constraints affect this area?",
    "Which infrastructure upgrades would unlock growth here?",
    "What should the city prioritize next?",
    "Which sequencing or policy considerations matter most?",
  ],
  developer: [
    "Generate a short planning brief for this area.",
    "What are the biggest delivery risks or blockers for this parcel?",
    "How does mobility readiness affect feasibility?",
    "Which policies, zoning rules, servicing, or mobility constraints matter most?",
    "How do project scale, density, and timeline affect feasibility here?",
    "What approvals, clarifications, or infrastructure changes would improve viability?",
    "What would make this project more feasible in the next 12-24 months?",
  ],
};
