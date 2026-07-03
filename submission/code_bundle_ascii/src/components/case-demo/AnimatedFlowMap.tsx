import {
  BellRing,
  Cpu,
  LayoutDashboard,
  MapPin,
  Server,
  Smartphone,
  UserRound,
  Watch
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  flowStatusLabels,
  riskLevelLabels,
  type CaseStep,
  type FlowNodeId
} from "./caseScenario";

interface FlowNodeMeta {
  id: FlowNodeId;
  label: string;
  detail: string;
  icon: LucideIcon;
}

const flowNodes: FlowNodeMeta[] = [
  { id: "patient", label: "患者", detail: "返家恢復期狀態", icon: UserRound },
  { id: "wearable", label: "手環感測", detail: "HR / SpO2 / activity", icon: Watch },
  { id: "gateway", label: "BLE Gateway", detail: "手機 / 床邊設備", icon: Smartphone },
  { id: "backend", label: "後端 API", detail: "事件與封包 ingest", icon: Server },
  { id: "riskEngine", label: "Risk Engine", detail: "規則加權與分級", icon: Cpu },
  { id: "dashboard", label: "照護端 Dashboard", detail: "警報卡與隊列", icon: LayoutDashboard },
  { id: "notification", label: "通知醫護", detail: "家屬 / 居服員 / 醫護", icon: BellRing },
  { id: "arrival", label: "到達現場", detail: "處置與解除", icon: MapPin }
];

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function AnimatedFlowMap({
  step,
  showPackets,
  isPlaying
}: {
  step: CaseStep;
  showPackets: boolean;
  isPlaying: boolean;
}) {
  return (
    <section className={classNames("animated-flow-map", `risk-${step.risk.level}`)} aria-label="Animated Flow Map">
      <header className="case-panel-heading">
        <div>
          <span>Animated Flow Map</span>
          <h3>資料流與處置流程</h3>
        </div>
        <b>{riskLevelLabels[step.risk.level]} {step.risk.score}</b>
      </header>

      <div className="flow-node-row">
        {flowNodes.map((node, index) => {
          const Icon = node.icon;
          const status = step.flowStatuses[node.id];
          const segmentActive = step.activeFlowSegments.includes(index);
          return (
            <div
              key={node.id}
              className={classNames(
                "flow-node-shell",
                index === flowNodes.length - 1 && "is-last",
                segmentActive && "has-active-segment",
                showPackets && segmentActive && "show-packet",
                isPlaying && "is-playing"
              )}
            >
              <article className={classNames("case-flow-node", `status-${status}`)}>
                <span className="node-status-light" aria-hidden="true" />
                <Icon size={20} />
                <strong>{node.label}</strong>
                <small>{node.detail}</small>
                <em>{flowStatusLabels[status]}</em>
              </article>
              {showPackets && segmentActive && index < flowNodes.length - 1 ? (
                <span className="packet-dot" aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flow-map-status-strip">
        <article>
          <span>BLE</span>
          <strong>{step.transport.bleStatus}</strong>
        </article>
        <article>
          <span>Gateway</span>
          <strong>{step.transport.gatewayStatus}</strong>
        </article>
        <article>
          <span>Backend</span>
          <strong>{step.transport.backendStatus}</strong>
        </article>
        <article>
          <span>Packet</span>
          <strong>{step.wearable.packetType}</strong>
        </article>
      </div>
    </section>
  );
}
