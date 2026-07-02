import type { WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { riskLevelLabel } from "../../domain/riskScoring";
import { modeNarratives } from "./demoFlowData";
import type { DemoMode } from "./scenePresets";

export function DeviceModuleCard({
  mode,
  workflow,
  queueWorkflows
}: {
  mode: DemoMode;
  workflow: WorkflowViewModel;
  queueWorkflows: WorkflowViewModel[];
}) {
  const copy = modeNarratives[mode];
  const telemetryPacket = {
    patientId: workflow.case.patientId,
    hr: workflow.case.telemetry.hr,
    spo2: workflow.case.telemetry.spo2,
    activityDropPercent: workflow.case.telemetry.activityDropPercent,
    payloadSizeKb: workflow.case.telemetry.payloadSizeKb,
    signalStatus: workflow.case.telemetry.signalStatus,
    lastSyncTime: workflow.case.telemetry.lastSyncTime
  };
  const helpPacket = workflow.case.helpEvent ?? {
    active: false,
    source: "homeGateway",
    symptoms: [],
    priority: "normal",
    createdAt: "standby"
  };
  const moduleNames = workflow.wristbandCapability.builtInModules
    .slice(0, 5)
    .map((module) => module.name.replace("感測模組", "").replace("模組", ""));

  return (
    <section className="module-card" aria-label="流程視角說明">
      <div>
        <span>Workflow Lens</span>
        <strong>{copy.title}</strong>
      </div>
      <p>{copy.body}</p>
      <ul>
        {copy.chips.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {mode === "wearable" ? (
        <>
          <pre>{JSON.stringify(telemetryPacket, null, 2)}</pre>
          <ul>
            {moduleNames.map((moduleName) => (
              <li key={moduleName}>{moduleName}</li>
            ))}
          </ul>
        </>
      ) : null}
      {mode === "bedside" ? (
        <pre>{JSON.stringify(helpPacket, null, 2)}</pre>
      ) : null}
      {mode === "team" ? (
        <ol>
          {queueWorkflows.map((item) => (
            <li key={item.case.patientId}>
              {item.case.patientId}｜{riskLevelLabel[item.risk.level]}｜{item.assignment.label}｜
              {item.risk.reasons[0]?.label ?? "目前未觸發風險加分規則"}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
