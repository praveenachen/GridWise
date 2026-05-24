import type { AreaRecord } from "../data/areas";

type ScoreBreakdownProps = {
  area: AreaRecord;
};

const items: Array<{ key: keyof AreaRecord["scores"]; label: string }> = [
  { key: "market", label: "Market" },
  { key: "mobility", label: "Mobility" },
  { key: "infrastructure", label: "Infrastructure" },
  { key: "policy", label: "Policy" },
  { key: "strategic", label: "Strategic" },
];

export default function ScoreBreakdown({ area }: ScoreBreakdownProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = area.scores[item.key];
        return (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>{item.label}</span>
              <span className="text-slate-600">{value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-[var(--accent)]"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
