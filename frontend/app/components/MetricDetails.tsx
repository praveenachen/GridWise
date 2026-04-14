type MetricDetailsProps = {
  title: string;
  details: string[];
};

export default function MetricDetails({
  title,
  details,
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
    </details>
  );
}
