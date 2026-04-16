type SourceEvidenceProps = {
  evidence: {
    source: string;
    excerpt: string;
    document_name?: string;
    section_title?: string;
    policy_id?: string;
    page_number?: number;
  }[];
};

export default function SourceEvidence({ evidence }: SourceEvidenceProps) {
  if (!evidence.length) {
    return null;
  }

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
        {evidence.map((item, index) => {
          const meta = [
            item.document_name,
            item.section_title,
            item.policy_id,
            item.page_number ? `p.${item.page_number}` : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={`${item.source}-${index}`} className="rounded-lg bg-[#f7f7f3] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                {item.source}
              </p>
              {meta ? (
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  {meta}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-[var(--foreground)]">
                {item.excerpt}
              </p>
            </div>
          );
        })}
      </div>
    </details>
  );
}
