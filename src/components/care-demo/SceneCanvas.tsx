import { Activity, BellRing, CircleAlert, LayoutDashboard, Server, Signal, Watch } from "lucide-react";
import { bedsideHelpEvent, wearablePacket } from "./demoFlowData";
import type { PatientWithRisk } from "./mockPatients";
import type { DemoMode } from "./scenePresets";

interface SceneCanvasProps {
  mode: DemoMode;
  patients: PatientWithRisk[];
  activePatientId: string;
  bedsideEventActive: boolean;
  acknowledged: boolean;
  assigned: boolean;
  onModeChange: (mode: DemoMode) => void;
}

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function LabelCard({
  className,
  title,
  lines,
  active = false
}: {
  className: string;
  title: string;
  lines: string[];
  active?: boolean;
}) {
  return (
    <article className={classNames("flow-label-card", className, active && "is-active")}>
      <strong>{title}</strong>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </article>
  );
}

function DataCard({ mode }: { mode: DemoMode }) {
  if (mode === "wearable") {
    return (
      <aside className="flow-detail-card flow-detail-card-wearable" aria-label="手環封包內容">
        <strong>patientId {wearablePacket.patientId}</strong>
        <span>HR {wearablePacket.hr}</span>
        <span>SpO2 {wearablePacket.spo2}</span>
        <span>activityDrop {wearablePacket.activityDrop}%</span>
        <span>payload {wearablePacket.payloadSize}</span>
      </aside>
    );
  }

  if (mode === "bedside") {
    return (
      <aside className="flow-detail-card flow-detail-card-bedside" aria-label="床邊求助事件內容">
        <strong>eventType {bedsideHelpEvent.eventType}</strong>
        <span>symptom {bedsideHelpEvent.symptom}</span>
        <span>priority {bedsideHelpEvent.priority}</span>
      </aside>
    );
  }

  if (mode === "team") {
    return (
      <aside className="flow-detail-card flow-detail-card-team" aria-label="照護端任務隊列">
        <strong>care queue</strong>
        <span>A-203 Critical 立即關注</span>
        <span>A-118 Warning 30 分鐘內追蹤</span>
        <span>A-076 Stable 例行觀察</span>
      </aside>
    );
  }

  return null;
}

function FlowLines({ mode }: { mode: DemoMode }) {
  const wearableActive = mode === "overview" || mode === "wearable";
  const bedsideActive = mode === "overview" || mode === "bedside";
  const dashboardActive = mode === "overview" || mode === "wearable" || mode === "bedside" || mode === "team";

  return (
    <svg className="product-flow-lines" viewBox="0 0 1000 430" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <marker id="flow-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <path
        className={classNames("flow-line", wearableActive && "is-active")}
        d="M 188 248 C 298 204, 414 184, 535 174"
      />
      <path
        className={classNames("flow-line", bedsideActive && "is-active")}
        d="M 397 296 C 462 292, 502 254, 548 207"
      />
      <path
        className={classNames("flow-line", dashboardActive && mode !== "team" && "is-active")}
        d="M 662 184 C 724 184, 756 220, 810 254"
      />
    </svg>
  );
}

function WearableDevice({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={classNames("flow-node wearable-node", active && "is-highlighted")} onClick={onClick} aria-label="查看手環監測">
      <span className="device-shadow" />
      <span className="wristband">
        <span className="strap strap-top">
          <i />
          <i />
          <i />
        </span>
        <span className="strap strap-bottom">
          <i />
          <i />
          <i />
        </span>
        <span className="watch-body">
          <Watch size={15} />
          <b>HR 52</b>
          <b>SpO2 93</b>
          <em>
            <Signal size={11} />
          </em>
        </span>
      </span>
    </button>
  );
}

function BedsideDevice({
  active,
  pulsing,
  onClick
}: {
  active: boolean;
  pulsing: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={classNames("flow-node bedside-node", active && "is-highlighted", pulsing && "is-pulsing")} onClick={onClick} aria-label="觸發床邊求助">
      <span className="device-shadow" />
      <span className="call-base">
        <span className="status-light" />
        <span className="call-button">
          <BellRing size={24} />
          <b>SOS</b>
        </span>
        <span className="call-slots">
          <i />
          <i />
          <i />
        </span>
      </span>
    </button>
  );
}

function EngineNode({ active }: { active: boolean }) {
  return (
    <section className={classNames("flow-node engine-node", active && "is-highlighted")} aria-label="API risk engine 節點">
      <span className="engine-chip">
        <Server size={20} />
        <strong>API / risk engine</strong>
        <span>rule scoring</span>
        <span>+40 event</span>
        <span>cap 100</span>
      </span>
    </section>
  );
}

function DashboardDevice({
  patient,
  patients,
  active,
  acknowledged,
  onClick
}: {
  patient: PatientWithRisk;
  patients: PatientWithRisk[];
  active: boolean;
  acknowledged: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={classNames("flow-node dashboard-node", active && "is-highlighted")} onClick={onClick} aria-label="查看照護端 dashboard">
      <span className="device-shadow" />
      <span className="mini-dashboard">
        <span className="dashboard-top">
          <LayoutDashboard size={14} />
          <b>Care Dashboard</b>
        </span>
        <span className="risk-row">
          <strong>Risk {patient.risk.score}</strong>
          <em>Critical</em>
        </span>
        <span className="vital-grid">
          <i>HR 52</i>
          <i>SpO2 93</i>
          <i>Bedside help</i>
        </span>
        <span className="queue-preview">
          {patients.slice(0, 3).map((item) => (
            <span key={item.id} className={item.id === "a203" ? "is-critical" : ""}>
              <b>{item.displayId}</b>
              <i>{item.id === "a203" ? (acknowledged ? "Assigned" : "Critical") : item.risk.level === "warning" ? "Warning" : "Stable"}</i>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

export function SceneCanvas(props: SceneCanvasProps) {
  const activePatient = props.patients.find((patient) => patient.id === props.activePatientId) ?? props.patients[0];
  const wearableActive = props.mode === "overview" || props.mode === "wearable";
  const bedsideActive = props.mode === "overview" || props.mode === "bedside";
  const engineActive = props.mode !== "team";
  const dashboardActive = props.mode === "overview" || props.mode === "team" || props.mode === "wearable" || props.mode === "bedside";

  return (
    <div className={`care-scene-frame product-flow-stage mode-${props.mode}`}>
      <FlowLines mode={props.mode} />

      <LabelCard
        className="label-wearable"
        title="手環監測"
        active={props.mode === "wearable"}
        lines={["HR 52 bpm", "SpO2 93%", "活動量 -31%", "封包 0.8 KB"]}
      />
      <LabelCard
        className="label-bedside"
        title="床邊求助"
        active={props.mode === "bedside"}
        lines={["一鍵求助", "回報頭暈", "事件送出"]}
      />
      <LabelCard
        className="label-engine"
        title="API / risk engine"
        active={props.mode === "wearable" || props.mode === "bedside"}
        lines={["rule scoring", "+40 event", "cap 100"]}
      />
      <LabelCard
        className="label-dashboard"
        title="照護端 dashboard"
        active={props.mode === "team"}
        lines={["風險分數 100", "Critical｜立即關注", "A-203 置頂"]}
      />

      <WearableDevice active={wearableActive} onClick={() => props.onModeChange("wearable")} />
      <BedsideDevice active={bedsideActive} pulsing={props.mode === "bedside" || props.bedsideEventActive} onClick={() => props.onModeChange("bedside")} />
      <EngineNode active={engineActive} />
      <DashboardDevice patient={activePatient} patients={props.patients} active={dashboardActive} acknowledged={props.acknowledged} onClick={() => props.onModeChange("team")} />

      <span className={classNames("flow-pill pill-telemetry", wearableActive && "is-active")}>
        <Activity size={13} />
        telemetry packet
      </span>
      <span className={classNames("flow-pill pill-help", bedsideActive && "is-active")}>
        <BellRing size={13} />
        help event
      </span>
      <span className={classNames("flow-pill pill-risk", dashboardActive && "is-active")}>
        <CircleAlert size={13} />
        risk score
      </span>

      <DataCard mode={props.mode} />
    </div>
  );
}
