import type { WorkflowStage, WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { CareProcessFlowCanvas as WorkflowCanvas } from "../workflow/CareProcessFlowCanvas";
import type { DemoMode } from "./scenePresets";

export function CareProcessFlowCanvas({
  mode,
  workflow,
  queueWorkflows,
  onModeChange,
  selectedStage,
  onStageSelect
}: {
  mode: DemoMode;
  workflow: WorkflowViewModel;
  queueWorkflows: WorkflowViewModel[];
  onModeChange: (mode: DemoMode) => void;
  selectedStage?: WorkflowStage;
  onStageSelect?: (stage: WorkflowStage) => void;
}) {
  return (
    <WorkflowCanvas
      workflow={workflow}
      queueWorkflows={queueWorkflows}
      focusMode={mode}
      onFocusModeChange={onModeChange}
      selectedStage={selectedStage}
      onStageSelect={onStageSelect}
    />
  );
}
