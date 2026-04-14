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
  source_evidence: { source: string; excerpt: string }[];
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
        "Market readiness based on recent application activity near the corridor.",
        "Comparable mixed-use projects cited in growth area monitoring summaries.",
        "Land value trend aligns with central corridor demand signals.",
      ],
      infrastructure: [
        "Infrastructure score reflects servicing notes in the Infrastructure Master Plan.",
        "Water and wastewater upgrades listed but not yet funded in the capital plan.",
        "Transit reliability improvements scheduled in the next program window.",
      ],
      policy: [
        "Official Plan designates this as an intensification corridor.",
        "Secondary plan guidance supports mid-rise mixed-use form.",
        "Zoning alignment remains partial for key nodes.",
      ],
      strategic: [
        "Strategic priority reflects growth management objectives in the OP.",
        "Corridor supports mode shift goals in transportation strategy.",
        "Proximity to major employment anchors elevates priority.",
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
    source_evidence: [
      {
        source: "Official Plan (Growth Management)",
        excerpt:
          "Corridor identified for intensification with mid-rise built form.",
      },
      {
        source: "Infrastructure Master Plan",
        excerpt:
          "Water and wastewater upgrades listed for future funding cycles.",
      },
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
        "Station-area market demand tracked in development pipeline reports.",
        "Application volume is moderate relative to other growth nodes.",
        "Market potential increases with coordinated land assembly.",
      ],
      infrastructure: [
        "Transit service is already in place per TMP station profiles.",
        "Trunk infrastructure capacity confirmed in servicing notes.",
        "Few near-term constraints flagged in capital program.",
      ],
      policy: [
        "Official Plan identifies the station area for higher density.",
        "Mixed-use permissions align with transit-oriented development policy.",
        "Policy direction supports station-area intensification.",
      ],
      strategic: [
        "Key interchange for east-west connectivity in TMP.",
        "Supports climate and mode-shift targets in city strategies.",
        "Identified as a growth node in growth management priorities.",
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
    source_evidence: [
      {
        source: "Official Plan (Station Areas)",
        excerpt:
          "Station areas prioritized for higher-density, mixed-use growth.",
      },
      {
        source: "Transportation Master Plan",
        excerpt:
          "Hurdman interchange supports high-capacity transit access.",
      },
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
        "Market score references redevelopment interest near the interchange.",
        "Multiple sites flagged in development pipeline summaries.",
        "Retail vacancy indicates re-use potential in area monitoring notes.",
      ],
      infrastructure: [
        "Infrastructure Master Plan lists upgrades without a committed schedule.",
        "Capacity constraints appear in servicing readiness notes.",
        "Funding triggers are not yet confirmed in capital planning.",
      ],
      policy: [
        "Official Plan supports mixed-use intensification in this district.",
        "District guidance encourages employment density and housing mix.",
        "Zoning updates are still required for full alignment.",
      ],
      strategic: [
        "High strategic priority in growth strategy and OP objectives.",
        "Interchange location supports multimodal access priorities.",
        "Critical node for near-term housing supply targets.",
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
    source_evidence: [
      {
        source: "Official Plan (Strategic Growth Areas)",
        excerpt:
          "Bayview identified as a strategic node for growth and mobility.",
      },
      {
        source: "Infrastructure Master Plan",
        excerpt: "Servicing schedule under review; upgrades not yet scheduled.",
      },
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
        "Market interest is steady but moderate relative to central corridors.",
        "Recent mid-rise proposals are limited in the pipeline data.",
        "Market readiness improves with planned transit upgrades.",
      ],
      infrastructure: [
        "Transit capacity upgrades are scheduled in later TMP phases.",
        "Servicing upgrades are identified but unfunded in capital plans.",
        "Peak-period road capacity constraints remain a near-term limiter.",
      ],
      policy: [
        "Mixed-use nodes identified in the Official Plan.",
        "Policy direction supports gradual corridor intensification.",
        "Zoning updates required to enable higher density.",
      ],
      strategic: [
        "Supports corridor connectivity goals in transportation policy.",
        "Moderate priority relative to other intensification nodes.",
        "Opportunity to stage growth over time with servicing investments.",
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
    source_evidence: [
      {
        source: "Official Plan (Corridors)",
        excerpt: "Baseline corridor targeted for gradual intensification.",
      },
      {
        source: "Transportation Master Plan",
        excerpt:
          "Capacity upgrades planned in later phases of the program window.",
      },
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
        "Strong east-end housing demand noted in growth monitoring.",
        "Growing interest near town centre in recent applications.",
        "Mixed-use redevelopment potential identified in area studies.",
      ],
      infrastructure: [
        "Servicing timing under review in Infrastructure Master Plan.",
        "Water/wastewater upgrades anticipated but not committed.",
        "Transit capacity is moderate with planned improvements.",
      ],
      policy: [
        "Town centre designated for higher density in the OP.",
        "Secondary plan supports mixed-use growth and density.",
        "Policy alignment is strong, zoning updates minimal.",
      ],
      strategic: [
        "Important for east-end balance in growth sequencing.",
        "Moderate priority in citywide prioritization framework.",
        "Opportunity to align with transit delivery phases.",
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
    source_evidence: [
      {
        source: "Official Plan (Town Centres)",
        excerpt: "Orleans Town Centre designated for higher density.",
      },
      {
        source: "Infrastructure Master Plan",
        excerpt: "Servicing timing under review; upgrades anticipated.",
      },
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
        "Steady interest for transit-adjacent sites in pipeline data.",
        "Retail conversion opportunities emerging in area studies.",
        "Market activity depends on parcel assembly timing.",
      ],
      infrastructure: [
        "Transit service already in place per TMP station profiles.",
        "Servicing capacity largely sufficient per servicing notes.",
        "Few near-term infrastructure blockers identified.",
      ],
      policy: [
        "Policy supports transit-oriented density in OP.",
        "Mixed-use permissions already defined in zoning.",
        "Strong alignment with growth direction.",
      ],
      strategic: [
        "High strategic value for mode shift goals.",
        "Supports housing diversification targets.",
        "Aligns with station-area planning priorities.",
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
    source_evidence: [
      {
        source: "Official Plan (Station Areas)",
        excerpt: "Blair station area supports transit-oriented density.",
      },
      {
        source: "Transportation Master Plan",
        excerpt: "Existing transit service provides strong access.",
      },
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
        "Strong suburban demand for mixed-use noted in market data.",
        "Limited recent high-density proposals in pipeline.",
        "Market response improves with policy clarity and servicing.",
      ],
      infrastructure: [
        "Moderate servicing capacity available in short term.",
        "Upgrade needs emerging for future phases in IMP.",
        "Transit expansion improves medium-term readiness.",
      ],
      policy: [
        "Secondary plan updates needed to support higher density.",
        "Zoning permissions lag market interest and demand.",
        "Policy direction requires refinement for near-term delivery.",
      ],
      strategic: [
        "Key suburban centre for balanced growth targets.",
        "Supports community service delivery priorities.",
        "Requires coordinated investment sequencing across plans.",
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
    source_evidence: [
      {
        source: "Official Plan (Town Centres)",
        excerpt:
          "Barrhaven Town Centre identified for future intensification.",
      },
      {
        source: "Secondary Plan Update",
        excerpt: "Policy updates pending to enable higher density.",
      },
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
        "High demand for central mixed-use sites in pipeline data.",
        "Strong redevelopment pressure already visible.",
        "Market fundamentals exceed city average benchmarks.",
      ],
      infrastructure: [
        "Infrastructure generally adequate per servicing notes.",
        "Public realm upgrades still needed for full build-out.",
        "Transit access already strong per TMP.",
      ],
      policy: [
        "Mainstreet intensification policies in the OP.",
        "As-of-right permissions expanding through zoning updates.",
        "Policy strongly aligned with growth goals.",
      ],
      strategic: [
        "Flagship corridor for housing supply targets.",
        "Supports walkability and mode shift objectives.",
        "High visibility for near-term wins.",
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
    source_evidence: [
      {
        source: "Official Plan (Mainstreets)",
        excerpt: "Rideau Mainstreet prioritized for intensification.",
      },
      {
        source: "Capital Plan",
        excerpt: "Public realm upgrades listed but not yet funded.",
      },
    ],
  },
];
