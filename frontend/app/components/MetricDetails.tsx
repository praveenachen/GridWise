type MetricDetailsProps = {
  title: string;
  details: string[];
  evidence?: { source: string; excerpt: string }[];
};

export default function MetricDetails({
  title,
  details,
  evidence = [],
}: MetricDetailsProps) {
  return (
    <details className="rounded-xl border border-[var(--line)] bg-white px-3 py-2">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
        <span>{title}</span>
        <span className="text-lg text-[var(--muted)]">▾</span>
      </summary>
      <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
        {details.map((detail) => (
          <li key={detail} className="rounded-lg bg-[#f7f7f3] px-3 py-2">
            {detail}
          </li>
        ))}
      </ul>
      {evidence.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Source Evidence
          </p>
          {evidence.map((item) => (
            <div
              key={`${title}-${item.source}`}
              className="rounded-lg bg-[#f7f7f3] px-3 py-2 text-xs text-[var(--muted)]"
            >
              <span className="font-semibold text-[var(--accent)]">
                {item.source}:
              </span>{" "}
              <span className="text-[var(--foreground)]">{item.excerpt}</span>
            </div>
          ))}
        </div>
      ) : null}
    </details>
  );
}
