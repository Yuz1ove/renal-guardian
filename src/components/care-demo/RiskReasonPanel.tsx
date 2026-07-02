import { Info } from "lucide-react";
import type { RiskResult } from "../../domain/careWorkflowTypes";

export function RiskReasonPanel({ risk }: { risk: RiskResult }) {
  return (
    <section className="risk-reason-panel" aria-label="風險原因">
      <header>
        <Info size={16} />
        <div>
          <strong>風險原因</strong>
          <span>rule scoring reason list</span>
        </div>
      </header>
      <ul>
        {risk.reasons.map((reason) => (
          <li key={reason.id}>
            {reason.label} +{reason.points}
          </li>
        ))}
        <li className={risk.capped ? "is-cap" : undefined}>
          {risk.capped ? `raw ${risk.rawScore}，最終分數上限封頂為 100` : "最終分數上限封頂為 100"}
        </li>
      </ul>
    </section>
  );
}
