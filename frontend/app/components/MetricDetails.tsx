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
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
        <span className="flex items-center gap-2">
          {title}
          <span className="text-xs text-[var(--muted)]">{value}</span>
        </span>
        <span className="text-lg text-[var(--muted)]">▾</span>
      </summary>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-[var(--accent)]"
          style={{ width: `${value}%` }}
        />
      </div>
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
