import { Database, GitBranch, RefreshCcw, Route } from "lucide-react";

const layers = [
  {
    title: "Data Layer",
    icon: Database,
    items: ["wristband telemetry", "bedside help event", "caregiver report"]
  },
  {
    title: "Risk Layer",
    icon: GitBranch,
    items: ["rule scoring", "risk cap", "reason extraction"]
  },
  {
    title: "Coordination Layer",
    icon: Route,
    items: ["queue priority", "assignment", "escalation"]
  },
  {
    title: "Feedback Layer",
    icon: RefreshCcw,
    items: ["caregiver reply", "family / care team sync", "state update"]
  }
];

export function SystemLayerCards() {
  return (
    <section className="system-layer-cards" aria-label="照護協作系統四層架構">
      {layers.map((layer) => {
        const Icon = layer.icon;
        return (
          <article key={layer.title}>
            <span className="layer-icon" aria-hidden="true">
              <Icon size={17} />
            </span>
            <div>
              <strong>{layer.title}</strong>
              <ul>
                {layer.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        );
      })}
    </section>
  );
}
