import type { WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { riskLevelLabel } from "../../domain/riskScoring";

export function CareQueuePanel({
  workflows,
  selectedPatientId,
  onSelectPatient
}: {
  workflows: WorkflowViewModel[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
}) {
  return (
    <section className="risk-queue" aria-label="照護端風險隊列">
      <header>
        <div>
          <span>Care Queue</span>
          <strong>照護協調隊列</strong>
        </div>
        <em>{workflows.length} 筆</em>
      </header>
      <div className="risk-queue-list">
        {workflows.map((workflow) => {
          const topReason = workflow.risk.reasons[0]?.label ?? "目前未觸發風險加分規則";

          return (
            <article key={workflow.case.patientId} className={workflow.case.patientId === selectedPatientId ? "is-active" : ""}>
              <button className="queue-main" type="button" onClick={() => onSelectPatient(workflow.case.patientId)}>
                <span>{workflow.case.patientId}</span>
                <strong>{workflow.case.displayName}</strong>
                <b>{workflow.risk.score}</b>
                <em className={`level-${workflow.risk.level}`}>{riskLevelLabel[workflow.risk.level]}</em>
              </button>
              <p>
                <strong>{riskLevelLabel[workflow.risk.level]}｜{workflow.assignment.label}</strong>
                <span>{topReason}</span>
              </p>
              <button
                className={workflow.assignment.assigned ? "queue-action is-done" : "queue-action"}
                type="button"
                onClick={() => onSelectPatient(workflow.case.patientId)}
              >
                {workflow.assignment.label}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
