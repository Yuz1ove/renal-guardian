import type { WorkflowViewModel } from "../../domain/careWorkflowTypes";
import type { DemoMode } from "../care-demo/scenePresets";
import { AssignmentStatusCard } from "./AssignmentStatusCard";
import { CareQueuePanel } from "./CareQueuePanel";
import { DataQualityCard } from "./DataQualityCard";
import { DemoActionBar } from "./DemoActionBar";
import { HelpEventSummary } from "./HelpEventSummary";
import { ProcessTimeline } from "./ProcessTimeline";
import { RiskReasonList } from "./RiskReasonList";
import { RiskScoreCard } from "./RiskScoreCard";
import { TelemetryGrid } from "./TelemetryGrid";
import { WristbandModuleSummary } from "./WristbandModuleSummary";

export function WorkflowResultPanel({
  workflow,
  queueWorkflows,
  mode,
  toast,
  focusMessage,
  onSelectPatient,
  onWearablePacket,
  onHelpEvent,
  onAssignmentSync
}: {
  workflow: WorkflowViewModel;
  queueWorkflows: WorkflowViewModel[];
  mode: DemoMode;
  toast: string;
  focusMessage: string;
  onSelectPatient: (patientId: string) => void;
  onWearablePacket: () => void;
  onHelpEvent: () => void;
  onAssignmentSync: () => void;
}) {
  return (
    <aside className="dashboard-panel" aria-label="照護流程結果面板">
      <header className="dashboard-title">
        <span>Workflow Result Panel</span>
        <h2>照護流程結果面板</h2>
        <p>{workflow.risk.safetyCopy}</p>
      </header>

      <RiskScoreCard workflow={workflow} />
      <TelemetryGrid workflow={workflow} highlighted={mode === "wearable"} />
      <WristbandModuleSummary workflow={workflow} />
      <DataQualityCard workflow={workflow} />
      <RiskReasonList workflow={workflow} />
      <HelpEventSummary workflow={workflow} />
      <AssignmentStatusCard workflow={workflow} />
      <DemoActionBar
        onWearablePacket={onWearablePacket}
        onHelpEvent={onHelpEvent}
        onAssignmentSync={onAssignmentSync}
      />
      <CareQueuePanel
        workflows={queueWorkflows}
        selectedPatientId={workflow.case.patientId}
        onSelectPatient={onSelectPatient}
      />
      <ProcessTimeline items={workflow.timeline} />

      {toast ? <p className="toast-line" role="status">{toast}</p> : null}
      {focusMessage ? <p className="feedback-line">{focusMessage}</p> : null}
    </aside>
  );
}
