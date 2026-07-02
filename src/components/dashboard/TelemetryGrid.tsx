import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle, Clock3, HeartPulse, Radio, Signal, Watch } from "lucide-react";
import type { DashboardCard, WorkflowViewModel } from "../../domain/careWorkflowTypes";

const cardIconById: Record<string, LucideIcon> = {
  hr: HeartPulse,
  spo2: Watch,
  activity: AlertTriangle,
  payload: Radio,
  signal: Signal,
  sync: Clock3
};

function metricIcon(card: DashboardCard) {
  return cardIconById[card.id] ?? Activity;
}

export function TelemetryGrid({
  workflow,
  highlighted
}: {
  workflow: WorkflowViewModel;
  highlighted?: boolean;
}) {
  return (
    <section className="metric-cards" aria-label="telemetry packet">
      {workflow.dashboardCards.map((card) => {
        const Icon = metricIcon(card);
        const compact = card.id === "payload" || card.id === "signal" || card.id === "sync";
        return (
          <article
            key={card.id}
            className={[highlighted ? "is-highlighted" : "", compact ? "compact-metric" : ""].filter(Boolean).join(" ")}
          >
            <Icon size={17} />
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            {card.helper ? <small>{card.helper}</small> : null}
          </article>
        );
      })}
    </section>
  );
}
