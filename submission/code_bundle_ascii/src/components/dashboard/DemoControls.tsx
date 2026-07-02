import { Activity, AlertTriangle, HeartPulse } from "lucide-react";
import { useCareStore } from "../../store/careStore";

export function DemoControls() {
  const scenario = useCareStore((state) => state.scenario);
  const simulateScenario = useCareStore((state) => state.simulateScenario);

  return (
    <div className="demo-controls" aria-label="展示情境控制">
      <button className={scenario === "stable" ? "is-active" : ""} onClick={() => simulateScenario("stable")}>
        <Activity size={16} />
        模擬穩定狀態
      </button>
      <button className={scenario === "weak" ? "is-active" : ""} onClick={() => simulateScenario("weak")}>
        <HeartPulse size={16} />
        模擬透析後虛弱
      </button>
      <button className={scenario === "emergency" ? "is-active danger" : "danger"} onClick={() => simulateScenario("emergency")}>
        <AlertTriangle size={16} />
        模擬緊急事件
      </button>
    </div>
  );
}
