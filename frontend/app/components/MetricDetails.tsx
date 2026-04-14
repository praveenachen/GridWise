type MetricDetailsProps = {
  title: string;
  value: number;
  details: string[];
};

export default function MetricDetails({
  title,
  value,
  details,
}: MetricDetailsProps) {
  return (
    <details className="rounded-xl border border-[var(--line)] bg-white px-3 py-3">
      <summary className="flex cursor-pointer flex-col gap-2 text-sm font-semibold">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {title}
            <span className="text-xs text-[var(--muted)]">{value}</span>
          </span>
          <svg
            className="h-4 w-4 text-[var(--muted)]"
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
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-[var(--accent)]"
            style={{ width: `${value}%` }}
          />
        </div>
      </summary>
      <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
        {details.map((detail) => (
          <li key={detail} className="rounded-lg bg-[#f7f7f3] px-3 py-2">
            {detail}
          </li>
        ))}
      </ul>
    </details>
  );
}
