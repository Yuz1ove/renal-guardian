import type { WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { riskLevelLabel, riskLevelZhLabel } from "../../domain/riskScoring";

export function RiskScoreCard({ workflow }: { workflow: WorkflowViewModel }) {
  const risk = workflow.risk;

  return (
    <section className={`score-card score-card-${risk.level}`} aria-label="風險分數">
      <div>
        <span>Risk Score</span>
        <strong>{risk.score}</strong>
      </div>
      <div className="score-detail">
        <b>
          {riskLevelLabel[risk.level]}｜{riskLevelZhLabel[risk.level]}｜{workflow.assignment.label}
        </b>
        <p>{workflow.assignment.description}</p>
        <div className="risk-bar" aria-label={`風險分數 ${risk.score}`}>
          <i style={{ width: `${risk.score}%` }} />
        </div>
        <small>0-39 Stable / 40-69 Watch / 70-89 Warning / 90-100 Critical</small>
        <small>
          confidence {risk.confidence}｜dataQuality {risk.dataQuality}
          {risk.capped ? `｜規則原始分數 ${risk.rawScore}，展示分數封頂為 100` : ""}
        </small>
      </div>
    </section>
  );
}
