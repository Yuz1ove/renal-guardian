import type { WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { WorkflowResultPanel } from "../dashboard/WorkflowResultPanel";
import type { DemoMode } from "./scenePresets";

export function RiskDashboard({
  workflow,
  queueWorkflows,
  mode,
  toast,
  focusMessage,
  onSelectPatient,
  onWearablePacket,
  onBedsideEvent,
  onFocusA203
}: {
  workflow: WorkflowViewModel;
  queueWorkflows: WorkflowViewModel[];
  mode: DemoMode;
  toast: string;
  focusMessage: string;
  onSelectPatient: (patientId: string) => void;
  onWearablePacket: () => void;
  onBedsideEvent: () => void;
  onFocusA203: () => void;
}) {
  return (
    <WorkflowResultPanel
      workflow={workflow}
      queueWorkflows={queueWorkflows}
      mode={mode}
      toast={toast}
      focusMessage={focusMessage}
      onSelectPatient={onSelectPatient}
      onWearablePacket={onWearablePacket}
      onHelpEvent={onBedsideEvent}
      onAssignmentSync={onFocusA203}
    />
  );
}
