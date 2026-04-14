type ActionDetailsProps = {
  actions: string[];
  details: string[];
};

export default function ActionDetails({ actions, details }: ActionDetailsProps) {
  return (
    <details className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
        <span>Recommended Actions</span>
        <span className="text-lg text-[var(--muted)]">▾</span>
      </summary>
      <div className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
        {actions.map((action, index) => (
          <div key={action} className="rounded-lg bg-[#f7f7f3] px-3 py-2">
            <p className="font-semibold">{action}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {details[index] ?? ""}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
