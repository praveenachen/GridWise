type SourceEvidenceProps = {
  evidence: { source: string; excerpt: string }[];
};

export default function SourceEvidence({ evidence }: SourceEvidenceProps) {
  return (
    <details className="rounded-2xl border border-[var(--line)] bg-white p-4">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[var(--muted)]">
        <span>Source Evidence</span>
        <span className="text-lg">▾</span>
      </summary>
      <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
        {evidence.map((item) => (
          <div key={item.source} className="rounded-lg bg-[#f7f7f3] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {item.source}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">
              {item.excerpt}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
