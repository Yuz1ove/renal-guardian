import { Info } from "lucide-react";
import type { RiskReason, WorkflowViewModel } from "../../domain/careWorkflowTypes";

const categoryLabels: Record<RiskReason["category"], string> = {
  physiological: "生理訊號",
  activityRecovery: "活動與返家恢復期",
  helpEvent: "主動求助與症狀",
  dataQuality: "資料品質"
};

const categoryOrder: RiskReason["category"][] = [
  "physiological",
  "activityRecovery",
  "helpEvent",
  "dataQuality"
];

export function RiskReasonList({ workflow }: { workflow: WorkflowViewModel }) {
  return (
    <section className="risk-reason-panel" aria-label="風險原因">
      <header>
        <Info size={16} />
        <div>
          <strong>風險原因</strong>
          <span>classified rule scoring reasons</span>
        </div>
      </header>
      <div className="risk-reason-groups">
        {categoryOrder.map((category) => {
          const reasons = workflow.risk.reasons.filter((reason) => reason.category === category);
          if (!reasons.length) return null;

          return (
            <article key={category}>
              <b>{categoryLabels[category]}</b>
              <ul>
                {reasons.map((reason) => (
                  <li key={reason.id}>
                    <span>{reason.label}</span>
                    <em>+{reason.points}</em>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      {workflow.risk.capped ? (
        <p className="cap-note">最終分數上限封頂為 100。</p>
      ) : null}
    </section>
  );
}
