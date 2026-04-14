type SourceEvidenceProps = {
  evidence: { source: string; excerpt: string }[];
};

export default function SourceEvidence({ evidence }: SourceEvidenceProps) {
  return (
    <details className="rounded-2xl border border-[var(--line)] bg-white p-4">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[var(--muted)]">
        <span>Source Evidence</span>
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
