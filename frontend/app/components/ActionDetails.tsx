type ActionDetailsProps = {
  actions: string[];
  details: string[];
};

export default function ActionDetails({ actions, details }: ActionDetailsProps) {
  return (
    <details className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
        <span>Recommended Actions</span>
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
