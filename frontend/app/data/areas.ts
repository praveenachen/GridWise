export type AreaRecord = {
  id: string;
  name: string;
  type: "corridor" | "station_area" | "district";
  center: [number, number];
  polygon: [number, number][];
  scores: {
    market: number;
    infrastructure: number;
    policy: number;
    strategic: number;
  };
  score_details: {
    market: string[];
    infrastructure: string[];
    policy: string[];
    strategic: string[];
  };
  main_constraint: string;
  why_bullets: string[];
  recommended_actions: string[];
  action_details: string[];
  evidence_notes: string[];
};

export const areas: AreaRecord[] = [
  {
    id: "corridor_bronson",
    name: "Bronson Corridor",
    type: "corridor",
    center: [45.4035, -75.6972],
    polygon: [
      [45.4085, -75.709],
      [45.4095, -75.687],
      [45.399, -75.683],
      [45.3955, -75.704],
    ],
    scores: {
      market: 78,
      infrastructure: 62,
      policy: 70,
      strategic: 66,
    },
    score_details: {
      market: [
        "Active developer inquiries along transit corridor",
        "Recent mixed-use applications within 1 km",
        "Land values trending above city median",
      ],
      infrastructure: [
        "Water servicing upgrades not yet funded",
        "Transit reliability improves in next cycle",
        "Limited near-term sewer capacity headroom",
      ],
      policy: [
        "Intensification corridor designation supports density",
        "Secondary plan encourages mid-rise form",
        "Zoning alignment pending in key nodes",
      ],
      strategic: [
        "Priority corridor for mode shift and housing supply",
        "Near major employment and institutional anchors",
        "Alignment with growth management objectives",
      ],
    },
    main_constraint: "Servicing capacity upgrades not yet funded",
    why_bullets: [
      "Strong development interest along the transit corridor",
      "Official Plan supports mid-rise intensification",
      "Near-term water servicing upgrades are unfunded",
    ],
    recommended_actions: [
      "Advance servicing design and funding for 2026-2028",
      "Prioritize zoning alignment for mid-rise as-of-right",
      "Coordinate with transit timing to reduce delivery risk",
    ],
    action_details: [
      "Confirm funding source, scope, and delivery window for servicing upgrades.",
      "Draft zoning update package with targeted mid-rise permissions and standards.",
      "Align capital timing with transit reliability improvements to reduce risk.",
    ],
    evidence_notes: [
      "Designated intensification corridor in planning docs",
      "Capital plan identifies future water main upgrades",
    ],
  },
  {
    id: "station_hurdman",
    name: "Hurdman Station Area",
    type: "station_area",
    center: [45.4142, -75.6635],
    polygon: [
      [45.4185, -75.675],
      [45.4202, -75.655],
      [45.4102, -75.651],
      [45.4078, -75.669],
    ],
    scores: {
      market: 64,
      infrastructure: 80,
      policy: 74,
      strategic: 72,
    },
    score_details: {
      market: [
        "Moderate demand tied to station-area redevelopment",
        "Limited recent application volume",
        "Market interest improves with land assembly",
      ],
      infrastructure: [
        "Transit service is already in place",
        "Trunk infrastructure capacity available",
        "Few near-term servicing constraints",
      ],
      policy: [
        "Station area designated for higher density",
        "Mixed-use permissions already in place",
        "Policy aligns with transit-oriented growth",
      ],
      strategic: [
        "Key interchange for east-west connectivity",
        "Supports climate and mode-shift targets",
        "Identified as a growth node",
      ],
    },
    main_constraint: "Site assembly and phasing complexity",
    why_bullets: [
      "Transit-accessible node with strong policy support",
      "Servicing capacity largely in place",
      "Multiple parcels with complex ownership",
    ],
    recommended_actions: [
      "Launch targeted land assembly strategy",
      "Offer pre-application support for mixed-use proposals",
      "Coordinate with major employer anchors",
    ],
    action_details: [
      "Identify priority parcels and explore land swaps or acquisitions.",
      "Create a fast-track pre-application clinic for station-area proposals.",
      "Engage employers on shared infrastructure and phasing commitments.",
    ],
    evidence_notes: [
      "Station area identified as a growth node",
      "Existing trunk infrastructure capacity available",
    ],
  },
  {
    id: "district_bayview",
    name: "Bayview District",
    type: "district",
    center: [45.4111, -75.7168],
    polygon: [
      [45.418, -75.732],
      [45.422, -75.707],
      [45.407, -75.701],
      [45.403, -75.724],
    ],
    scores: {
      market: 70,
      infrastructure: 58,
      policy: 68,
      strategic: 80,
    },
    score_details: {
      market: [
        "Strong market interest near transit interchange",
        "Multiple sites with redevelopment potential",
        "Retail vacancy signals re-use opportunities",
      ],
      infrastructure: [
        "Upgrades identified but not scheduled",
        "Capacity constraints for near-term growth",
        "Funding trigger not yet confirmed",
      ],
      policy: [
        "Policy supports mixed-use intensification",
        "District plan encourages employment density",
        "Zoning updates still required",
      ],
      strategic: [
        "High strategic priority in growth strategy",
        "Interchange location supports multimodal access",
        "Critical node for housing supply targets",
      ],
    },
    main_constraint: "Planned infrastructure upgrades not yet scheduled",
    why_bullets: [
      "Strategic priority area near major transit interchange",
      "Policy direction supports mixed-use growth",
      "Infrastructure timeline remains uncertain",
    ],
    recommended_actions: [
      "Clarify servicing schedule and funding trigger",
      "Align development phasing with transit expansion",
      "Prepare a near-term district plan update",
    ],
    action_details: [
      "Publish a clear servicing trigger tied to capital plan milestones.",
      "Sequence development approvals to match transit delivery phases.",
      "Update district plan guidance to reflect current market conditions.",
    ],
    evidence_notes: [
      "Interchange area highlighted as a priority node",
      "Servicing program under review",
    ],
  },
  {
    id: "corridor_baseline",
    name: "Baseline Corridor",
    type: "corridor",
    center: [45.364, -75.738],
    polygon: [
      [45.373, -75.754],
      [45.374, -75.725],
      [45.356, -75.721],
      [45.355, -75.748],
    ],
    scores: {
      market: 60,
      infrastructure: 55,
      policy: 62,
      strategic: 58,
    },
    score_details: {
      market: [
        "Steady but moderate redevelopment interest",
        "Limited recent mid-rise proposals",
        "Market grows with transit improvements",
      ],
      infrastructure: [
        "Transit capacity upgrades scheduled later",
        "Servicing upgrades planned but unfunded",
        "Road capacity constraints in peak periods",
      ],
      policy: [
        "Mixed-use nodes identified in plans",
        "Policy direction supports gradual intensification",
        "Zoning updates required for higher density",
      ],
      strategic: [
        "Supports corridor connectivity goals",
        "Moderate priority relative to other nodes",
        "Opportunity to stage growth over time",
      ],
    },
    main_constraint: "Limited near-term transit capacity upgrades",
    why_bullets: [
      "Moderate market interest with steady redevelopment pressure",
      "Policy direction supports mixed-use nodes",
      "Transit capacity upgrades are scheduled later in the plan window",
    ],
    recommended_actions: [
      "Align node planning with scheduled transit improvements",
      "Target mid-rise zoning near key intersections",
      "Coordinate servicing upgrades with corridor phasing",
    ],
    action_details: [
      "Link node-level planning to transit timelines and service levels.",
      "Prepare zoning changes for key intersections to unlock density.",
      "Package servicing upgrades into phased capital delivery.",
    ],
    evidence_notes: [
      "Corridor identified for gradual intensification",
      "Transit expansion noted for later phases",
    ],
  },
  {
    id: "district_orleans",
    name: "Orleans Town Centre",
    type: "district",
    center: [45.476, -75.528],
    polygon: [
      [45.486, -75.54],
      [45.488, -75.514],
      [45.468, -75.511],
      [45.466, -75.537],
    ],
    scores: {
      market: 72,
      infrastructure: 64,
      policy: 70,
      strategic: 60,
    },
    score_details: {
      market: [
        "Strong east-end housing demand",
        "Growing interest near town centre",
        "Potential for mixed-use redevelopment",
      ],
      infrastructure: [
        "Servicing timing under review",
        "Water/wastewater upgrades anticipated",
        "Transit capacity moderate but improving",
      ],
      policy: [
        "Town centre designated for higher density",
        "Secondary plan supports mixed-use growth",
        "Policy alignment generally strong",
      ],
      strategic: [
        "Important for east-end balance",
        "Moderate priority in citywide sequencing",
        "Opportunity to align with transit phases",
      ],
    },
    main_constraint: "Unclear funding timing for servicing upgrades",
    why_bullets: [
      "Strong residential demand in the east end",
      "Policy supports higher density near the town centre",
      "Servicing timing is still under review",
    ],
    recommended_actions: [
      "Confirm servicing investment schedule",
      "Coordinate town centre plan with transit priorities",
      "Identify catalytic mixed-use sites",
    ],
    action_details: [
      "Secure a published servicing schedule tied to budget approval.",
      "Align planning approvals with transit program timelines.",
      "Advance site readiness for early catalytic projects.",
    ],
    evidence_notes: [
      "Town centre designated for intensified growth",
      "Servicing program awaiting prioritization",
    ],
  },
  {
    id: "station_blair",
    name: "Blair Station Area",
    type: "station_area",
    center: [45.431, -75.614],
    polygon: [
      [45.437, -75.628],
      [45.439, -75.604],
      [45.425, -75.601],
      [45.423, -75.624],
    ],
    scores: {
      market: 68,
      infrastructure: 73,
      policy: 76,
      strategic: 74,
    },
    score_details: {
      market: [
        "Steady interest for transit-adjacent sites",
        "Retail conversion opportunities emerging",
        "Market activity depends on parcel assembly",
      ],
      infrastructure: [
        "Transit service already in place",
        "Servicing capacity largely sufficient",
        "Few near-term infrastructure blockers",
      ],
      policy: [
        "Policy supports transit-oriented density",
        "Mixed-use permissions already defined",
        "Good alignment with growth direction",
      ],
      strategic: [
        "High strategic value for modal shift",
        "Supports housing diversification goals",
        "Aligns with station-area planning priorities",
      ],
    },
    main_constraint: "Fragmented parcels slow coordinated delivery",
    why_bullets: [
      "Station area supports transit-oriented development",
      "Infrastructure capacity mostly available",
      "Land assembly challenges remain",
    ],
    recommended_actions: [
      "Create a station-area delivery plan",
      "Support coordinated applications across parcels",
      "Clarify density targets with community partners",
    ],
    action_details: [
      "Outline phasing, responsibilities, and infrastructure sequencing.",
      "Set up a coordinated review process for adjacent proposals.",
      "Use stakeholder workshops to align on density and form.",
    ],
    evidence_notes: [
      "Station area identified as a growth node",
      "Transit service is already in place",
    ],
  },
  {
    id: "district_barrhaven",
    name: "Barrhaven Town Centre",
    type: "district",
    center: [45.273, -75.735],
    polygon: [
      [45.281, -75.75],
      [45.283, -75.721],
      [45.265, -75.718],
      [45.263, -75.746],
    ],
    scores: {
      market: 66,
      infrastructure: 60,
      policy: 58,
      strategic: 62,
    },
    score_details: {
      market: [
        "Strong suburban demand for mixed-use",
        "Limited recent high-density proposals",
        "Market response improves with policy clarity",
      ],
      infrastructure: [
        "Moderate servicing capacity available",
        "Upgrade needs emerging for future phases",
        "Transit expansion improves medium-term",
      ],
      policy: [
        "Secondary plan updates needed",
        "Zoning permissions lag market interest",
        "Policy direction requires refinement",
      ],
      strategic: [
        "Key suburban centre for balanced growth",
        "Supports community service delivery",
        "Requires coordinated investment sequencing",
      ],
    },
    main_constraint: "Policy updates needed for higher densities",
    why_bullets: [
      "Strong market interest in suburban mixed-use",
      "Infrastructure capacity is moderate",
      "Policy updates required to unlock higher density",
    ],
    recommended_actions: [
      "Advance secondary plan updates",
      "Align servicing strategy with town centre growth",
      "Prioritize mixed-use zoning permissions",
    ],
    action_details: [
      "Modernize the secondary plan to support higher density.",
      "Align servicing upgrades with growth staging targets.",
      "Prioritize zoning updates to unlock mixed-use projects.",
    ],
    evidence_notes: [
      "Town centre identified for future intensification",
      "Policy updates pending",
    ],
  },
  {
    id: "corridor_rideau",
    name: "Rideau Mainstreet",
    type: "corridor",
    center: [45.426, -75.682],
    polygon: [
      [45.432, -75.695],
      [45.434, -75.668],
      [45.418, -75.665],
      [45.417, -75.692],
    ],
    scores: {
      market: 82,
      infrastructure: 70,
      policy: 78,
      strategic: 76,
    },
    score_details: {
      market: [
        "High demand for central mixed-use sites",
        "Strong redevelopment pressure already visible",
        "Market fundamentals exceed city average",
      ],
      infrastructure: [
        "Infrastructure generally adequate",
        "Public realm upgrades still needed",
        "Transit access already strong",
      ],
      policy: [
        "Mainstreet intensification policies in place",
        "As-of-right permissions expanding",
        "Policy strongly aligned with growth goals",
      ],
      strategic: [
        "Flagship corridor for housing supply targets",
        "Supports walkability and mode shift",
        "High visibility for near-term wins",
      ],
    },
    main_constraint: "Public realm upgrades needed to support density",
    why_bullets: [
      "High demand for central mixed-use development",
      "Policy encourages mainstreet intensification",
      "Streetscape upgrades lag behind growth pressure",
    ],
    recommended_actions: [
      "Accelerate mainstreet public realm improvements",
      "Coordinate active transportation upgrades",
      "Expand as-of-right mid-rise permissions",
    ],
    action_details: [
      "Package streetscape improvements to support higher density.",
      "Prioritize active transportation upgrades for safety and access.",
      "Expand permissions to reduce rezoning timelines.",
    ],
    evidence_notes: [
      "Mainstreet identified for growth and intensification",
      "Public realm upgrade list pending funding",
    ],
  },
];
