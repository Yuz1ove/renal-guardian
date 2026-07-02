import { Watch } from "lucide-react";
import type { WorkflowStage, WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { StageBadge } from "./StageBadge";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function WristbandCapabilityCard({
  workflow,
  active,
  selected,
  onSelect
}: {
  workflow: WorkflowViewModel;
  active?: boolean;
  selected?: boolean;
  onSelect?: (stage: WorkflowStage) => void;
}) {
  const modules = workflow.wristbandCapability.builtInModules;
  const keyModules = modules.filter((module) =>
    ["ppg-hr", "spo2-red-ir", "accelerometer-3axis", "physical-sos", "ble-low-data", "signal-quality"].includes(module.id)
  );

  return (
    <button
      type="button"
      className={classNames("process-node", "process-node-source", active && "is-active", selected && "is-current")}
      onClick={() => onSelect?.("wristband")}
      aria-pressed={selected}
    >
      <span className="process-node-icon" aria-hidden="true">
        <Watch size={18} />
      </span>
      <span className="process-node-copy">
        <span className="process-node-eyebrow">Wristband capability</span>
        <strong>手環內建資料來源</strong>
        <span className="process-node-description">
          PPG HR、red / IR SpO2、三軸加速度、SOS button、BLE low-data packet 與 signal quality。
        </span>
      </span>
      <span className="process-node-badges">
        {keyModules.map((module) => (
          <StageBadge key={module.id}>{module.name.replace("感測模組", "").replace("模組", "")}</StageBadge>
        ))}
      </span>
    </button>
  );
}
