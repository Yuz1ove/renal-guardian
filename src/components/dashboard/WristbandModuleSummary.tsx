import { Cpu } from "lucide-react";
import type { WorkflowViewModel, WristbandModule } from "../../domain/careWorkflowTypes";

const priorityModuleIds = [
  "ppg-hr",
  "spo2-red-ir",
  "accelerometer-3axis",
  "physical-sos",
  "signal-quality",
  "ble-low-data",
  "local-buffer-time-sync"
];

export function WristbandModuleSummary({ workflow }: { workflow: WorkflowViewModel }) {
  const modules = priorityModuleIds
    .map((id) => workflow.wristbandCapability.builtInModules.find((module) => module.id === id))
    .filter((module): module is WristbandModule => Boolean(module));
  const feedback = workflow.wristbandCapability.feedbackOutputs[0];

  return (
    <section className="wristband-module-summary" aria-label="手環資料來源能力">
      <header>
        <Cpu size={16} />
        <div>
          <strong>手環資料來源能力</strong>
          <span>low-data recovery wristband</span>
        </div>
      </header>
      <ul>
        {modules.map((module) => (
          <li key={module.id}>
            <b>{module.name}</b>
            <span>{module.dataFields.slice(0, 3).join(" / ")}</span>
          </li>
        ))}
        {feedback ? (
          <li>
            <b>{feedback.name}</b>
            <span>acknowledgementStatus</span>
          </li>
        ) : null}
      </ul>
      <p>{workflow.wristbandCapability.connectivity.gatewayDescription}</p>
    </section>
  );
}
