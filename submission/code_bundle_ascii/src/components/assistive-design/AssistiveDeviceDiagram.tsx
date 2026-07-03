import { Bed, Network, Watch } from "lucide-react";
import { useState } from "react";
import { BedsideCallerDiagram } from "./BedsideCallerDiagram";
import { BraceletDiagram } from "./BraceletDiagram";
import { DataFlowSimulation } from "./DataFlowSimulation";
import "./assistive-device.css";

type BlueprintTab = "bracelet" | "bedside" | "flow";

const blueprintTabs: Array<{ id: BlueprintTab; label: string; icon: typeof Watch }> = [
  { id: "bracelet", label: "監測手環", icon: Watch },
  { id: "bedside", label: "床邊呼叫器", icon: Bed },
  { id: "flow", label: "資料串接", icon: Network }
];

export function AssistiveDeviceDiagram({
  baseRiskScore,
  patientId
}: {
  baseRiskScore: number;
  patientId: string;
}) {
  const [activeTab, setActiveTab] = useState<BlueprintTab>("bracelet");

  return (
    <section className="assistive-design-page" aria-label="輔具設計圖">
      <nav className="blueprint-tabs" aria-label="輔具設計圖分頁">
        {blueprintTabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === "bracelet" ? <BraceletDiagram /> : null}
      {activeTab === "bedside" ? (
        <BedsideCallerDiagram baseRiskScore={baseRiskScore} patientId={patientId} />
      ) : null}
      {activeTab === "flow" ? <DataFlowSimulation /> : null}
    </section>
  );
}
