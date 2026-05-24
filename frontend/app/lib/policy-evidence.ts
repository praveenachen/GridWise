import fs from "node:fs/promises";
import path from "node:path";

import type { LensMode } from "./workflow";
import type { DeveloperInputs } from "./workflow";

export type EvidenceSnippet = {
  source: string;
  excerpt: string;
  document_name?: string;
  document_type?: string;
  plan_family?: string;
  section_title?: string;
  policy_id?: string;
  page_number?: number;
  source_file?: string;
  content_classification?: string;
  policy_theme?: string;
  growth_dimension?: string;
  relevance_tag?: string;
};

type EvidenceBundleRecord = Record<string, unknown>;

const evidenceDirectoryCandidates = [
  path.resolve(process.cwd(), "..", "data", "evidence"),
  path.resolve(process.cwd(), "data", "evidence"),
  path.resolve(process.cwd(), "..", "backend", "data", "evidence"),
];

let cachedEvidencePromise: Promise<EvidenceSnippet[]> | null = null;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeLookup(value: string) {
  return value.toLowerCase().replace(/[_\W]+/g, " ").replace(/\s+/g, " ").trim();
}

function fileLabel(filePath: string) {
  return path.basename(filePath).replace(/\.jsonl$/i, "").replace(/[_-]+/g, " ");
}

function recordToSnippet(record: EvidenceBundleRecord, sourceFile: string): EvidenceSnippet {
  const documentName =
    asString(record.document_name) ||
    asString(record.source_document_class) ||
    fileLabel(sourceFile);
  const source =
    documentName ||
    asString(record.document_type) ||
    asString(record.plan_family) ||
    fileLabel(sourceFile);

  return {
    source,
    excerpt:
      asString(record.normalized_text) ||
      asString(record.source_text) ||
      asString(record.excerpt),
    document_name: asString(record.document_name, documentName),
    document_type: asString(record.document_type),
    plan_family: asString(record.plan_family),
    section_title: asString(record.section_title),
    policy_id: asString(record.policy_id),
    page_number: asNumber(record.page_number),
    source_file: asString(record.source_file, sourceFile),
    content_classification: asString(record.content_classification),
    policy_theme: asString(record.policy_theme),
    growth_dimension: asString(record.growth_dimension),
    relevance_tag: asString(record.relevance_tag),
  };
}

async function findEvidenceDirectory() {
  for (const candidate of evidenceDirectoryCandidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch {
      // Continue searching the remaining candidates.
    }
  }
  return null;
}

async function readJsonlFile(filePath: string) {
  const contents = await fs.readFile(filePath, "utf8");
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const parsed = JSON.parse(line) as EvidenceBundleRecord;
        return [recordToSnippet(parsed, filePath)];
      } catch {
        return [];
      }
    });
}

export async function loadEvidenceSnippets() {
  if (!cachedEvidencePromise) {
    cachedEvidencePromise = (async () => {
      const directory = await findEvidenceDirectory();
      if (!directory) return [];

      const entries = await fs.readdir(directory, { withFileTypes: true });
      const jsonlFiles = entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".jsonl"))
        .map((entry) => path.join(directory, entry.name));

      const snippets = await Promise.all(
        jsonlFiles.map((filePath) =>
          readJsonlFile(filePath).catch(() => [] as EvidenceSnippet[]),
        ),
      );

      return snippets.flat().filter((item) => item.excerpt.length > 0);
    })();
  }

  return cachedEvidencePromise;
}

function tokenMatches(text: string, token: string) {
  return text.includes(token);
}

function collectKeywords(texts: Array<string | undefined>) {
  const tokens = new Set<string>();
  for (const value of texts) {
    if (!value) continue;
    const normalized = normalizeLookup(value);
    normalized
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
      .forEach((token) => tokens.add(token));
  }
  return [...tokens];
}

function scoreSnippet(
  snippet: EvidenceSnippet,
  lens: LensMode,
  prompt: string,
  areaName: string,
  areaConstraint: string,
  projectProfile: DeveloperInputs | null,
) {
  const text = normalizeLookup(
    [
      snippet.source,
      snippet.document_name,
      snippet.document_type,
      snippet.plan_family,
      snippet.section_title,
      snippet.policy_id,
      snippet.content_classification,
      snippet.policy_theme,
      snippet.growth_dimension,
      snippet.relevance_tag,
      snippet.excerpt,
    ]
      .filter(Boolean)
      .join(" "),
  );

  let score = 0;

  const lensBoosts: Record<LensMode, Record<string, number>> = {
    city: {
      official_plan: 24,
      transportation: 24,
      zoning: 18,
      mobility: 18,
      financial: 10,
      supporting: 8,
      legacy: 4,
    },
    developer: {
      zoning: 26,
      official_plan: 16,
      infrastructure: 22,
      transportation: 20,
      mobility: 18,
      financial: 20,
      supporting: 8,
      legacy: 4,
    },
  };

  const docType = normalizeLookup(
    `${snippet.document_type ?? ""} ${snippet.plan_family ?? ""} ${snippet.source}`,
  );
  for (const [key, value] of Object.entries(lensBoosts[lens])) {
    if (tokenMatches(docType, key)) {
      score += value;
    }
  }

  const promptKeywords = collectKeywords([prompt, areaName, areaConstraint]);
  for (const keyword of promptKeywords) {
    if (keyword.length > 3 && tokenMatches(text, keyword)) {
      score += 5;
    }
  }

  if (projectProfile) {
    const profileKeywords = collectKeywords([
      projectProfile.projectType,
      projectProfile.timeline,
      projectProfile.servicingSensitivity,
      projectProfile.zoningCertainty,
    ]);
    for (const keyword of profileKeywords) {
      if (tokenMatches(text, keyword)) {
        score += 4;
      }
    }
  }

  const constraintKeywords = normalizeLookup(areaConstraint).split(" ");
  for (const keyword of constraintKeywords) {
    if (keyword.length > 3 && tokenMatches(text, keyword)) {
      score += 3;
    }
  }

  if (text.includes("policy") || text.includes("restriction")) score += 6;
  if (text.includes("transit") || text.includes("transportation")) score += 7;
  if (text.includes("sidewalk") || text.includes("cycling")) score += 5;
  if (text.includes("safety") || text.includes("collision")) score += 5;
  if (text.includes("servicing") || text.includes("capacity")) score += 5;
  if (text.includes("funding") || text.includes("capital")) score += 5;
  if (text.includes("zoning") || text.includes("density")) score += 5;

  return score;
}

export async function selectRelevantEvidence(options: {
  lens: LensMode;
  prompt: string;
  areaName: string;
  areaConstraint: string;
  projectProfile?: DeveloperInputs | null;
  fallbackSnippets?: Array<{ source: string; excerpt: string }>;
  limit?: number;
}) {
  const limit = options.limit ?? 5;
  const snippets = await loadEvidenceSnippets();
  const ranked = snippets
    .map((snippet) => ({
      snippet,
      score: scoreSnippet(
        snippet,
        options.lens,
        options.prompt,
        options.areaName,
        options.areaConstraint,
        options.projectProfile ?? null,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const top: EvidenceSnippet[] = [];
  const seen = new Set<string>();

  for (const item of ranked) {
    const key = normalizeLookup(`${item.snippet.source} ${item.snippet.excerpt}`);
    if (seen.has(key)) continue;
    seen.add(key);
    top.push(item.snippet);
    if (top.length >= limit) break;
  }

  if (top.length < limit && options.fallbackSnippets?.length) {
    for (const fallback of options.fallbackSnippets) {
      const key = normalizeLookup(`${fallback.source} ${fallback.excerpt}`);
      if (seen.has(key)) continue;
      seen.add(key);
      top.push({
        source: fallback.source,
        excerpt: fallback.excerpt,
        relevance_tag: "fallback",
      });
      if (top.length >= limit) break;
    }
  }

  return top.slice(0, limit);
}

