import { CheckCircle2, HeartPulse, ListChecks, RefreshCcw } from "lucide-react";

const items = [
  { label: "data source", icon: HeartPulse },
  { label: "triage", icon: ListChecks },
  { label: "assignment", icon: CheckCircle2 },
  { label: "sync", icon: RefreshCcw }
];

export function SystemLayerLegend() {
  return (
    <footer className="closed-loop-strip" aria-label="閉環摘要">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <span key={item.label}>
            <Icon size={15} />
            {item.label}
          </span>
        );
      })}
    </footer>
  );
}
