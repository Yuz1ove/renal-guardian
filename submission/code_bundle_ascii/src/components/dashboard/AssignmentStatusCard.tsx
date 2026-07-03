import { Activity } from "lucide-react";
import type { WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { riskLevelLabel } from "../../domain/riskScoring";

function assignmentChips(workflow: WorkflowViewModel) {
  const chips = [riskLevelLabel[workflow.risk.level], workflow.assignment.label];
  if (workflow.assignment.assigned) chips.push("已分派");
  if (workflow.assignment.notifyFamily) chips.push("家屬通知");
  if (workflow.assignment.notifyCareTeam) chips.push("care team notified");
  if (workflow.assignment.stateUpdated) chips.push("state updated");
  return Array.from(new Set(chips));
}

export function AssignmentStatusCard({ workflow }: { workflow: WorkflowViewModel }) {
  return (
    <section className="assignment-status" aria-label="分派狀態">
      <header>
        <Activity size={16} />
        <strong>分派狀態</strong>
      </header>
      <b>{workflow.assignment.label}</b>
      <p>{workflow.assignment.description}</p>
      <ul>
        {assignmentChips(workflow).map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
    </section>
  );
}
