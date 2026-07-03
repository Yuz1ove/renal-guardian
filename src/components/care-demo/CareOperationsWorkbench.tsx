import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquare,
  PhoneCall,
  Radio,
  Route,
  ShieldAlert,
  Siren,
  UserCheck,
  Users
} from "lucide-react";
import { careWorkersSeed, operationsHelpEvents, operationsPatients } from "../../data/careOperationsDemoData";
import {
  alertStatusLabel,
  applyPatientReply,
  assignCareWorker,
  attachLowDataPacket,
  calculateRiskScore,
  createAlertCase,
  generateCareEvent,
  operationRiskLabel,
  advanceCareWorkflow,
  refreshCaseWorkflow,
  simulateWeakNetworkPacket
} from "../../lib/careOperationsEngine";
import type {
  AlertCase,
  CareWorker,
  CareWorkflowAction,
  EmergencyFlowStatus,
  GeneratedCareEventKind,
  OperationRiskLevel,
  Patient
} from "../../types/careOperations";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function buildInitialAlertCases() {
  return operationsPatients
    .map((patient) => {
      const helpEvent = operationsHelpEvents[patient.patientId];
      const risk = calculateRiskScore(patient, helpEvent);
      const alertCase = createAlertCase(patient, risk, helpEvent);
      const criticalPacket = risk.riskLevel === "critical" || helpEvent.source === "bedside_button";
      return refreshCaseWorkflow({
        ...alertCase,
        lowDataPacket: simulateWeakNetworkPacket({
          type: criticalPacket ? "HELP_EVENT" : "TELEMETRY_EVENT",
          eventId: alertCase.eventId,
          patientId: patient.patientId,
          helpEventActive: criticalPacket,
          connectionPath: patient.connectionPath,
          retryCount: patient.connectionPath === "LTE fallback" ? 1 : patient.connectionPath === "buffered offline" ? 3 : 0,
          bufferedPacketCount: patient.bufferedPacketCount,
          acknowledgementStatus: patient.acknowledgementStatus,
          lastSyncTime: patient.lastSyncTime
        })
      });
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

const severityByLevel: Record<OperationRiskLevel, Patient["severity"]> = {
  critical: "Critical",
  warning: "Warning",
  watch: "Watch",
  stable: "Stable"
};

function patientHelpSource(source: AlertCase["source"]): NonNullable<Patient["helpEvent"]>["source"] {
  if (source === "bedside_button") return "bedside_button";
  if (source === "system_prediction") return "system_prediction";
  return "bracelet";
}

function locationFromStatus(locationStatus: string): NonNullable<Patient["location"]> {
  const confidenceMatch = locationStatus.match(/confidence\s+(\d+)/i);
  const source: NonNullable<Patient["location"]>["source"] =
    /GPS/i.test(locationStatus) && /gateway|beacon|indoor/i.test(locationStatus)
      ? "hybrid"
      : /GPS/i.test(locationStatus)
        ? "GPS"
        : "indoor";

  return {
    label: locationStatus,
    confidence: confidenceMatch ? Number(confidenceMatch[1]) : source === "GPS" ? 82 : source === "hybrid" ? 76 : 88,
    source
  };
}

function patientFromAlertCase(alertCase: AlertCase): Patient {
  const matrix = alertCase.riskAssessment.matrix;
  const packet = alertCase.lowDataPacket;

  return {
    id: alertCase.patientId,
    name: alertCase.patientStatus.codeName,
    room: alertCase.patientId,
    severity: severityByLevel[alertCase.riskLevel],
    riskScore: alertCase.riskScore,
    hr: alertCase.patientStatus.hr,
    spo2: alertCase.patientStatus.spo2,
    motionState: alertCase.patientStatus.motionState,
    activityDropPercent: alertCase.patientStatus.activityDropPercent,
    signalQuality: alertCase.patientStatus.signalQuality,
    connectionPath: alertCase.patientStatus.connectionPath,
    workflowState: alertCase.workflowState,
    lastSyncTime: alertCase.patientStatus.lastSyncTime,
    helpEvent: {
      active: alertCase.helpEvent.active,
      source: patientHelpSource(alertCase.helpEvent.source),
      createdAt: alertCase.helpEvent.createdAt
    },
    packet: packet
      ? {
          id: packet.packetId,
          delaySeconds: alertCase.patientStatus.packetDelaySeconds,
          bufferedCount: packet.bufferedPacketCount,
          payloadSizeKb: packet.payloadSizeKb,
          acknowledgementStatus: packet.acknowledgementStatus
        }
      : {
          id: "not generated",
          delaySeconds: alertCase.patientStatus.packetDelaySeconds,
          bufferedCount: alertCase.patientStatus.bufferedPacketCount,
          payloadSizeKb: 0,
          acknowledgementStatus: alertCase.patientStatus.acknowledgementStatus
        },
    location: locationFromStatus(alertCase.patientStatus.locationStatus),
    riskBreakdown: [
      { label: "生理風險", points: matrix.physiologicalRisk, description: "HR / SpO2 生命徵象加權" },
      { label: "活動風險", points: matrix.activityRisk, description: "活動下降與 motionState 加權" },
      { label: "求助事件", points: matrix.helpEventRisk, description: "helpEvent / bedside pressed 狀態" },
      { label: "通訊風險", points: matrix.communicationRisk, description: "signalQuality、packet delay、buffered packets" },
      { label: "加總分數", points: matrix.totalScore, description: operationRiskLabel[matrix.level] }
    ]
  };
}

function formatSla(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function sourceLabel(source: AlertCase["source"]) {
  if (source === "bedside_button") return "bedside_button";
  if (source === "system_prediction") return "system_prediction";
  if (source === "phone_reply") return "phone_reply";
  if (source === "caregiver_operation") return "caregiver_operation";
  return "bracelet";
}

function triggerReasons(alertCase: AlertCase) {
  const reasons = [...alertCase.riskAssessment.reasons];
  if (alertCase.patientStatus.bedsideButtonStatus === "pressed") reasons.push("床邊 SOS 按鈕觸發");
  if (alertCase.patientStatus.spo2 < 94) reasons.push("SpO2 下降");
  if (alertCase.patientStatus.activityDropPercent > 40) reasons.push("activityDropPercent 過高");
  if (alertCase.status === "no_response") reasons.push("長時間無回應");
  return Array.from(new Set(reasons)).slice(0, 5);
}

function levelTone(level: OperationRiskLevel) {
  if (level === "critical") return "critical";
  if (level === "warning") return "warning";
  if (level === "watch") return "watch";
  return "stable";
}

function isEmergencyStatus(status: EmergencyFlowStatus | string) {
  return ["active", "sent", "retrying", "confirmed", "resolved"].includes(status);
}

function compactActionStatus(status: string) {
  if (status === "idle") return "pending";
  if (status === "connected") return "confirmed";
  if (status === "departed") return "sent";
  if (status === "arrived") return "confirmed";
  if (status === "timeout") return "retrying";
  return status;
}

function CareKpis({
  alertCases,
  careWorkers
}: {
  alertCases: AlertCase[];
  careWorkers: CareWorker[];
}) {
  const pending = alertCases.filter((item) => !["resolved", "acknowledged"].includes(item.status)).length;
  const assigned = alertCases.filter((item) => Boolean(item.assignedCareWorkerId)).length;
  const weakDelivered = alertCases.filter((item) =>
    ["acknowledged", "delivered", "sent"].includes(item.lowDataPacket?.deliveryStatus ?? "")
  ).length;
  const weakTotal = alertCases.filter((item) => item.lowDataPacket).length;
  const successRate = weakTotal ? `${Math.round((weakDelivered / weakTotal) * 100)}%` : "98%";

  const kpis = [
    { label: "今日監測人數", value: String(operationsPatients.length), helper: "active home recovery" },
    { label: "目前高風險個案", value: String(alertCases.filter((item) => item.riskLevel === "critical").length), helper: "Critical queue" },
    { label: "待確認警報", value: String(pending), helper: "pending / contacting" },
    { label: "已派工事件", value: String(assigned), helper: `${careWorkers.filter((item) => item.status === "busy").length} workers busy` },
    { label: "平均回應時間", value: "04:18", helper: "demo rolling avg" },
    { label: "弱網路通訊成功率", value: successRate, helper: "low-data ACK" }
  ];

  return (
    <section className="care-kpi-grid" aria-label="照護工作台 KPI">
      {kpis.map((item) => (
        <article key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.helper}</small>
        </article>
      ))}
    </section>
  );
}

function AlertQueue({
  alertCases,
  selectedPatientId,
  onSelect
}: {
  alertCases: AlertCase[];
  selectedPatientId: string;
  onSelect: (patientId: string) => void;
}) {
  const activeCases = alertCases.filter((item) => item.status !== "resolved");
  const resolvedCases = alertCases.filter((item) => item.status === "resolved");

  return (
    <section className="ops-panel alert-queue-panel" aria-label="Alert Queue 警報佇列">
      <header>
        <div>
          <span>Monitored Patients</span>
          <strong>受照護者列表</strong>
        </div>
        <em>{alertCases.length} 位</em>
      </header>
      <div className="ops-alert-list">
        {activeCases.map((alertCase) => {
          const selected = selectedPatientId === alertCase.patientId;

          return (
            <button
              key={alertCase.eventId}
              type="button"
              className={classNames(
                "ops-alert-card",
                selected && "is-active",
                alertCase.riskLevel === "critical" && "has-alert",
                `risk-${levelTone(alertCase.riskLevel)}`
              )}
              onClick={() => onSelect(alertCase.patientId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(alertCase.patientId);
                }
              }}
              aria-pressed={selected}
              aria-current={selected ? "true" : undefined}
            >
              <div className="alert-card-head">
                <b>{alertCase.patientStatus.codeName} / {alertCase.patientId}</b>
                <span>{operationRiskLabel[alertCase.riskLevel]}</span>
                <strong>{alertCase.riskScore}</strong>
              </div>
              <small className={classNames("viewing-indicator", selected && "is-visible")}>
                <i aria-hidden="true" />
                {selected ? "正在查看" : "可切換查看"}
              </small>
              <dl>
                <div>
                  <dt>hr</dt>
                  <dd>{alertCase.patientStatus.hr} bpm</dd>
                </div>
                <div>
                  <dt>SpO2</dt>
                  <dd>{alertCase.patientStatus.spo2}%</dd>
                </div>
                <div>
                  <dt>signal</dt>
                  <dd>{alertCase.patientStatus.signalQuality}</dd>
                </div>
              </dl>
              <ul>
                {[alertCase.patientStatus.motionState, sourceLabel(alertCase.source), `SLA ${formatSla(alertCase.slaSecondsRemaining)}`].map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              {alertCase.riskLevel === "critical" || alertCase.helpEvent.source === "bedside_button" ? (
                <small className="alert-badge-line">Alert: {triggerReasons(alertCase)[0]}</small>
              ) : null}
              <small>最後回報 {alertCase.patientStatus.lastSyncTime.replace("T", " ").slice(0, 19)}</small>
            </button>
          );
        })}
      </div>
      <div className="resolved-queue">
        <span>已完成事件</span>
        {resolvedCases.length ? (
          resolvedCases.map((item) => (
            <button key={item.eventId} type="button" onClick={() => onSelect(item.patientId)}>
              {item.patientId} / resolved
            </button>
          ))
        ) : (
          <p>尚無已解除事件</p>
        )}
      </div>
    </section>
  );
}

function PatientStatusPanel({
  alertCase,
  selectedPatient,
  assignedWorker
}: {
  alertCase: AlertCase;
  selectedPatient: Patient;
  assignedWorker?: CareWorker;
}) {
  const patient = alertCase.patientStatus;
  const helpEventLabel = selectedPatient.helpEvent?.active
    ? `${selectedPatient.helpEvent.source ?? sourceLabel(alertCase.source)} active`
    : "inactive";
  const statusRows = [
    ["hr", `${selectedPatient.hr} bpm`],
    ["spo2", `${selectedPatient.spo2}%`],
    ["活動下降", `${selectedPatient.activityDropPercent}%`],
    ["GPS / 室內位置", selectedPatient.location?.label ?? patient.locationStatus],
    ["location confidence", `${selectedPatient.location?.confidence ?? "--"} / ${selectedPatient.location?.source ?? "hybrid"}`],
    ["motionState", selectedPatient.motionState],
    ["signalQuality", selectedPatient.signalQuality],
    ["helpEvent", helpEventLabel],
    ["是否佩戴手環", patient.wearableStatus],
    ["是否按下床邊呼叫器", patient.bedsideButtonStatus],
    ["connectionPath", selectedPatient.connectionPath],
    ["packet delay", `${selectedPatient.packet?.delaySeconds ?? patient.packetDelaySeconds}s / ${selectedPatient.packet?.bufferedCount ?? patient.bufferedPacketCount} buffered`],
    ["acknowledgementStatus", selectedPatient.packet?.acknowledgementStatus ?? patient.acknowledgementStatus],
    ["是否已通知家屬", patient.familyNotified ? "yes" : "no"],
    ["是否已派遣居服員", assignedWorker ? `${assignedWorker.name} / ${assignedWorker.workerId}` : "no"]
  ];
  const matrixRows = selectedPatient.riskBreakdown.map((item) => [
    item.label,
    item.label === "加總分數" ? `${item.points} / ${item.description}` : item.points
  ]);
  const assessmentTitle = `為什麼被判定為 ${selectedPatient.severity}`;
  const offlineNotice =
    selectedPatient.signalQuality === "offline"
      ? "資料品質不足：目前無法完整判讀即時狀態，需等待 buffered packets 補送或由照護端人工確認。"
      : null;

  return (
    <section className="ops-panel patient-status-panel" aria-label="個案即時狀態面板">
      <header>
        <div>
          <span>Patient Live Status</span>
          <strong>{selectedPatient.room} / {selectedPatient.name}</strong>
        </div>
        <b className={`risk-badge risk-${levelTone(alertCase.riskLevel)}`}>{operationRiskLabel[alertCase.riskLevel]}</b>
      </header>
      <div className="care-live-summary">
        <article>
          <span>riskScore</span>
          <strong>{selectedPatient.riskScore}</strong>
        </article>
        <article>
          <span>workflowState</span>
          <strong>{selectedPatient.workflowState}</strong>
        </article>
        <article>
          <span>lastSyncTime</span>
          <strong>{selectedPatient.lastSyncTime.replace("T", " ").slice(11, 19)}</strong>
        </article>
      </div>
      {offlineNotice ? <p className="data-quality-warning">{offlineNotice}</p> : null}
      <div className="patient-status-grid">
        {statusRows.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </article>
        ))}
      </div>
      <div className="risk-matrix-grid" aria-label="風險矩陣">
        {matrixRows.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </article>
        ))}
      </div>
      <div className="risk-calculation-card">
        <span>{assessmentTitle}</span>
        <strong>{alertCase.riskAssessment.recommendedAction}</strong>
        <ul>
          {alertCase.riskAssessment.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p>{alertCase.riskAssessment.communicationStrategy}</p>
      </div>
    </section>
  );
}

function FlowStatusMark({ status }: { status: EmergencyFlowStatus }) {
  if (status === "confirmed" || status === "resolved") {
    return (
      <i className="flow-status-mark is-complete" aria-label={status}>
        <CheckCircle2 size={13} />
      </i>
    );
  }
  if (status === "retrying") return <i className="flow-status-mark is-retrying" aria-label="retrying" />;
  if (status === "active") return <i className="flow-status-mark is-active" aria-label="active" />;
  return <i className={`flow-status-mark is-${status}`} aria-label={status} />;
}

function EmergencyEscalationFlowPanel({
  alertCase,
  selectedPatient,
  assignedWorker,
  expanded,
  lockedOpen,
  onToggle
}: {
  alertCase: AlertCase;
  selectedPatient: Patient;
  assignedWorker?: CareWorker;
  expanded: boolean;
  lockedOpen: boolean;
  onToggle: () => void;
}) {
  const flow = alertCase.workflow.escalationFlow;
  const activeCount = flow.filter((node) => isEmergencyStatus(node.status)).length;
  const standbyCopy =
    selectedPatient.severity === "Warning"
      ? "Warning：建議電話確認、持續監測與通知照護人員預備；119 流程維持 standby。"
      : selectedPatient.severity === "Watch"
        ? "Watch：以低強度追蹤、重新同步資料與確認訊號品質為主；不啟動 Critical escalation。"
        : selectedPatient.signalQuality === "offline"
          ? "Signal offline：資料品質不足，等待補送或人工確認；除非有床邊 SOS 或高風險條件，不自動升級 119。"
          : "Stable：一般監測中；119 escalation path 保持待命。";
  const emergencySummary = [
    ["患者", `${selectedPatient.name} / ${selectedPatient.room}`],
    ["位置", selectedPatient.location?.label ?? alertCase.patientStatus.locationStatus],
    ["生命徵象", `HR ${selectedPatient.hr} bpm / SpO2 ${selectedPatient.spo2}%`],
    ["活動狀態", `${selectedPatient.motionState} / activityDrop ${selectedPatient.activityDropPercent}%`],
    ["封包", `${selectedPatient.packet?.id ?? "pending"} / ${selectedPatient.connectionPath}`],
    ["照護資源", assignedWorker ? `${assignedWorker.name} / ${assignedWorker.distanceKm.toFixed(1)}km` : "尚未指派"]
  ];

  return (
    <section className={classNames("ops-panel emergency-flow-panel", expanded && "is-expanded")} aria-label="119 Emergency Escalation Flow">
      <header>
        <div>
          <span>119 Emergency Escalation Flow</span>
          <strong>119 緊急升級流程</strong>
        </div>
        <button type="button" aria-expanded={expanded} onClick={onToggle} disabled={lockedOpen && expanded}>
          {lockedOpen && expanded ? "自動展開" : expanded ? "收合" : "展開"} / {activeCount}
        </button>
      </header>

      {expanded ? (
        <>
          <ol className="emergency-flow-timeline">
            {flow.map((node, index) => (
              <li key={node.id} className={`status-${node.status}`}>
                <div className="flow-rail">
                  <FlowStatusMark status={node.status} />
                  {index < flow.length - 1 ? <span aria-hidden="true" /> : null}
                </div>
                <article>
                  <div className="flow-node-head">
                    <b>{node.label}</b>
                    <small>{node.status}</small>
                  </div>
                  <p>{node.detail}</p>
                  <dl>
                    {node.meta.map((item) => (
                      <div key={`${node.id}-${item.label}`}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </li>
            ))}
          </ol>
          <div className="emergency-summary-card">
            <span>可提供給 119 的摘要資訊</span>
            <dl>
              {emergencySummary.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      ) : (
        <p className="emergency-flow-collapsed">{selectedPatient.severity === "Critical" ? "Critical 條件或手動升級後會自動展開，並顯示封包、通知、派遣與回寫狀態。" : standbyCopy}</p>
      )}
    </section>
  );
}

function CaseEventLog({ alertCase }: { alertCase: AlertCase }) {
  const events = alertCase.workflow.eventLog.slice(-8).reverse();

  return (
    <section className="ops-panel case-event-log" aria-label="Case Event Log">
      <header>
        <div>
          <span>Case Event Log</span>
          <strong>最近事件</strong>
        </div>
        <em>{events.length} / {alertCase.timeline.length}</em>
      </header>
      <ol>
        {events.map((entry) => {
          const isCritical = /critical|emergency|119|timeout|no_response|escalate/i.test(entry.event);

          return (
            <li key={entry.id} className={isCritical ? "is-critical" : ""}>
              <time>{entry.timestamp.slice(11, 19)}</time>
              <div>
                <span className="event-log-source">
                  <i />
                  <b>{entry.event}</b>
                  {isCritical ? <small>Critical</small> : null}
                </span>
                <span>{entry.source} / {entry.actor}</span>
                <p>{entry.decision}</p>
                {entry.statusChange ? <small>{entry.statusChange}</small> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PacketStatusCard({ alertCase, selectedPatient }: { alertCase: AlertCase; selectedPatient: Patient }) {
  const packet = alertCase.lowDataPacket;
  const packetLabel =
    selectedPatient.severity === "Critical" && packet?.priority === "critical"
      ? "Critical helpEvent 優先"
      : selectedPatient.signalQuality === "offline"
        ? "Buffered telemetry / 補送中"
        : selectedPatient.severity === "Warning"
          ? "Warning safety check"
          : selectedPatient.severity === "Watch"
            ? "Watch telemetry"
            : "Routine telemetry";
  const packetCopy =
    selectedPatient.severity === "Critical"
      ? "helpEvent 封包保留 eventId；斷線先寫入 buffer，恢復連線後補送，收到照護端 ack 才停止 retry。"
      : selectedPatient.signalQuality === "offline"
        ? "目前訊號離線，先保留 buffered packets 與 lastSyncTime；補送完成或人工確認前不直接進入 119 流程。"
        : "一般 telemetry 依照 selectedPatient 的 signalQuality、packet delay 與 acknowledgementStatus 更新。";
  const rows = packet
    ? [
        ["packet id", packet.packetId],
        ["payload size", `${packet.payloadSizeKb.toFixed(1)} KB`],
        ["connection path", selectedPatient.connectionPath],
        ["retry count", String(packet.retryCount)],
        ["buffered count", String(selectedPatient.packet?.bufferedCount ?? packet.bufferedPacketCount)],
        ["ack status", selectedPatient.packet?.acknowledgementStatus ?? packet.acknowledgementStatus],
        ["last sync", selectedPatient.lastSyncTime.replace("T", " ").slice(0, 19)]
      ]
    : [
        ["packet id", "not generated"],
        ["connection path", selectedPatient.connectionPath],
        ["ack status", selectedPatient.packet?.acknowledgementStatus ?? alertCase.patientStatus.acknowledgementStatus]
      ];

  return (
    <article className="packet-status-card" aria-label="封包傳輸狀態">
      <header>
        <span>Packet Delivery</span>
        <b>{packetLabel}</b>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>{packetCopy}</p>
    </article>
  );
}

function ActionPanel({
  alertCase,
  selectedPatient,
  careWorkers,
  assignedWorker,
  onAssign,
  onAdvance,
  onSendLowData,
  onReply,
  onGenerateEvent
}: {
  alertCase: AlertCase;
  selectedPatient: Patient;
  careWorkers: CareWorker[];
  assignedWorker?: CareWorker;
  onAssign: () => void;
  onAdvance: (action: CareWorkflowAction) => void;
  onSendLowData: () => void;
  onReply: (replyCode: 1 | 2 | 3 | 4 | 5) => void;
  onGenerateEvent: (kind?: GeneratedCareEventKind) => void;
}) {
  const disabled = alertCase.status === "resolved";
  const actionStatuses = alertCase.workflow.actionStatuses;
  const showEmergencyAction =
    selectedPatient.severity === "Critical" ||
    alertCase.helpEvent.source === "bedside_button" ||
    actionStatuses.emergencyEscalation !== "idle";
  const emergencyActionStatus =
    actionStatuses.emergencyEscalation !== "idle"
      ? compactActionStatus(actionStatuses.emergencyEscalation)
      : alertCase.workflowState === "resolved"
        ? "resolved"
        : ["waitingResponder", "responderArrived"].includes(alertCase.workflowState)
          ? "confirmed"
          : alertCase.workflowState === "emergencyEscalated"
            ? "active"
            : "pending";
  const recommendedSteps =
    selectedPatient.severity === "Critical"
      ? [
          { label: "先語音確認", status: compactActionStatus(actionStatuses.callPatient) },
          { label: "發送簡訊 / App 推播", status: compactActionStatus(actionStatuses.patientCheckPrompt) },
          { label: "通知家屬", status: compactActionStatus(actionStatuses.notifyFamily) },
          { label: "通知居服員", status: compactActionStatus(actionStatuses.workerDispatch) },
          { label: "升級 119 展示流程", status: emergencyActionStatus }
        ]
      : selectedPatient.severity === "Warning"
        ? [
            { label: "建議電話確認", status: compactActionStatus(actionStatuses.callPatient) },
            { label: "發送低資料量確認", status: compactActionStatus(actionStatuses.patientCheckPrompt) },
            { label: "通知照護人員預備", status: compactActionStatus(actionStatuses.workerDispatch) },
            { label: "持續監測", status: "active" }
          ]
        : selectedPatient.severity === "Watch"
          ? [
              { label: "低強度追蹤", status: "active" },
              { label: "重新同步資料", status: selectedPatient.signalQuality === "weak" || selectedPatient.signalQuality === "offline" ? "retrying" : "pending" },
              { label: "確認訊號品質", status: selectedPatient.signalQuality === "good" ? "confirmed" : "pending" }
            ]
          : selectedPatient.signalQuality === "offline"
            ? [
                { label: "資料品質不足", status: "retrying" },
                { label: "補送 buffered packets", status: "retrying" },
                { label: "人工確認同步狀態", status: "pending" }
              ]
            : [
                { label: "一般監測中", status: "confirmed" },
                { label: "下一輪例行同步", status: "pending" },
                { label: "保留狀態紀錄", status: "confirmed" }
              ];
  const quickReplies = [
    { code: 1 as const, label: "請按一下確認安全", helper: "回覆後 acknowledgementStatus = acknowledged" },
    { code: 3 as const, label: "請按兩下表示需要協助", helper: "回覆後維持派工流程" },
    { code: 4 as const, label: "若無法回覆，系統將升級通知", helper: "模擬無法起身 / Critical" }
  ];

  return (
    <section className="ops-panel action-command-panel" aria-label="處置與通訊面板">
      <header>
        <div>
          <span>Care Actions</span>
          <strong>處置與通訊</strong>
        </div>
        <b>{alertStatusLabel[alertCase.status]}</b>
      </header>

      <div className="worker-roster">
        <span>Care Workers</span>
        {careWorkers.map((worker) => (
          <article key={worker.workerId} className={assignedWorker?.workerId === worker.workerId ? "is-assigned" : ""}>
            <b>{worker.name}</b>
            <small>{worker.status} / {worker.distanceKm.toFixed(1)}km / load {worker.currentLoad}</small>
          </article>
        ))}
      </div>

      <div className="recommended-action-list">
        <span>建議處置狀態</span>
        {recommendedSteps.map((step) => (
          <article key={step.label} className={`status-${step.status}`}>
            <b>{step.label}</b>
            <small>{step.status}</small>
          </article>
        ))}
      </div>

      <div className="care-action-grid">
        <button type="button" onClick={onAssign} disabled={disabled || Boolean(alertCase.assignedCareWorkerId)}>
          <UserCheck size={15} />
          指派居服員
        </button>
        <button type="button" onClick={() => onAdvance("contactPatient")} disabled={disabled}>
          <PhoneCall size={15} />
          撥打患者電話
        </button>
        <button type="button" onClick={onSendLowData} disabled={disabled}>
          <MessageSquare size={15} />
          發送低資料量確認訊息
        </button>
        <button type="button" onClick={() => onAdvance("notifyFamily")} disabled={disabled}>
          <Users size={15} />
          通知家屬
        </button>
        {showEmergencyAction ? (
          <button type="button" className="danger" onClick={() => onAdvance("escalateEmergency")} disabled={disabled}>
            <Siren size={15} />
            升級 119 / 緊急醫療
          </button>
        ) : null}
        <button type="button" onClick={() => onAdvance("markOnTheWay")} disabled={disabled}>
          <Route size={15} />
          標記居服員已出發
        </button>
        <button type="button" onClick={() => onAdvance("markArrived")} disabled={disabled}>
          <MapPin size={15} />
          標記已到場
        </button>
        <button type="button" className="is-done" onClick={() => onAdvance("resolveCase")} disabled={disabled}>
          <CheckCircle2 size={15} />
          標記事件解除
        </button>
        <button type="button" onClick={() => onAdvance("noResponseTimeout")} disabled={disabled}>
          <Clock3 size={15} />
          超時未回覆
        </button>
      </div>

      <PacketStatusCard alertCase={alertCase} selectedPatient={selectedPatient} />

      <div className="demo-event-generator">
        <span>Demo Event Generator</span>
        <button type="button" onClick={() => onGenerateEvent()} disabled={disabled}>
          隨機產生照護事件
        </button>
        <div>
          <button type="button" onClick={() => onGenerateEvent("bedside_pressed")} disabled={disabled}>床邊呼叫器按下</button>
          <button type="button" onClick={() => onGenerateEvent("packet_delay")} disabled={disabled}>封包延遲 / 丟包</button>
          <button type="button" onClick={() => onGenerateEvent("no_response")} disabled={disabled}>30 秒無回覆</button>
        </div>
      </div>

      <div className="reply-keypad">
        <span>照護端快速回覆</span>
        {quickReplies.map((reply) => (
          <button key={reply.code} type="button" onClick={() => onReply(reply.code)} disabled={disabled}>
            <b>{reply.code}</b>
            <span>{reply.label}</span>
            <small>{reply.helper}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CareOperationsWorkbench({
  selectedPatientId,
  onSelectPatient
}: {
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
}) {
  const [alertCases, setAlertCases] = useState<AlertCase[]>(() => buildInitialAlertCases());
  const [careWorkers, setCareWorkers] = useState<CareWorker[]>(() => careWorkersSeed);
  const initialEventId =
    alertCases.find((item) => item.patientId === selectedPatientId)?.eventId ??
    alertCases[0]?.eventId ??
    "";
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [flowPanelOpenByEvent, setFlowPanelOpenByEvent] = useState<Record<string, boolean>>({});
  const sortedAlertCases = useMemo(
    () =>
      alertCases.slice().sort((a, b) => {
        if (a.status === "resolved" && b.status !== "resolved") return 1;
        if (a.status !== "resolved" && b.status === "resolved") return -1;
        return b.riskScore - a.riskScore;
      }),
    [alertCases]
  );
  const patients: Patient[] = useMemo(() => alertCases.map(patientFromAlertCase), [alertCases]);
  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? patients[0],
    [patients, selectedPatientId]
  );
  const selectedCase =
    alertCases.find((item) => item.patientId === selectedPatient?.id) ??
    alertCases.find((item) => item.eventId === selectedEventId) ??
    alertCases[0];
  const assignedWorker = selectedCase?.assignedCareWorkerId
    ? careWorkers.find((worker) => worker.workerId === selectedCase.assignedCareWorkerId)
    : undefined;

  useEffect(() => {
    const nextCase = alertCases.find((item) => item.patientId === selectedPatient?.id);
    if (nextCase && nextCase.eventId !== selectedEventId) setSelectedEventId(nextCase.eventId);
  }, [alertCases, selectedEventId, selectedPatient?.id]);

  if (!selectedCase || !selectedPatient) return null;

  const emergencyFlowLockedOpen = selectedCase.workflow.escalationFlowVisible;
  const emergencyFlowExpanded = emergencyFlowLockedOpen || Boolean(flowPanelOpenByEvent[selectedCase.eventId]);

  function replaceCase(nextCase: AlertCase) {
    setAlertCases((items) => items.map((item) => (item.eventId === nextCase.eventId ? nextCase : item)));
    setSelectedEventId(nextCase.eventId);
    onSelectPatient(nextCase.patientId);
  }

  function selectCase(patientId: string) {
    const nextCase = alertCases.find((item) => item.patientId === patientId);
    if (!nextCase) return;
    setSelectedEventId(nextCase.eventId);
    onSelectPatient(nextCase.patientId);
  }

  function handleAssign() {
    const result = assignCareWorker(selectedCase, careWorkers);
    setCareWorkers(result.careWorkers);
    replaceCase(result.alertCase);
  }

  function handleAdvance(action: CareWorkflowAction) {
    replaceCase(advanceCareWorkflow(selectedCase, action));
  }

  function handleLowDataMessage() {
    const packet = simulateWeakNetworkPacket({
      type: "ACK_REQUEST",
      eventId: selectedCase.eventId,
      patientId: selectedCase.patientId,
      options: [1, 2, 3, 4, 5],
      packetPurpose: "low_data_safety_confirmation",
      connectionPath: selectedCase.patientStatus.connectionPath,
      retryCount: selectedCase.patientStatus.connectionPath === "LTE fallback" ? 1 : 0,
      bufferedPacketCount: selectedCase.patientStatus.bufferedPacketCount,
      acknowledgementStatus: "sent",
      lastSyncTime: selectedCase.patientStatus.lastSyncTime
    });
    replaceCase(attachLowDataPacket(selectedCase, packet));
  }

  function handleReply(replyCode: 1 | 2 | 3 | 4 | 5) {
    replaceCase(applyPatientReply(selectedCase, replyCode));
  }

  function handleGenerateEvent(kind?: GeneratedCareEventKind) {
    replaceCase(generateCareEvent(selectedCase, kind));
  }

  function toggleEmergencyFlow() {
    if (selectedCase.workflow.escalationFlowVisible) return;
    setFlowPanelOpenByEvent((items) => ({
      ...items,
      [selectedCase.eventId]: !items[selectedCase.eventId]
    }));
  }

  return (
    <section className="care-operations-workbench" aria-label="居服員與守望隊照護工作台">
      <div className="ops-safety-note">
        <ShieldAlert size={18} />
        <p>
          核心價值：透析返家後仍能監測；求助事件與生理異常由風險矩陣加權；高優先級 helpEvent 以低丟包策略優先送達照護端。riskScore 僅為展示排序。
        </p>
      </div>
      <CareKpis alertCases={alertCases} careWorkers={careWorkers} />
      <div className="care-ops-grid">
        <AlertQueue alertCases={sortedAlertCases} selectedPatientId={selectedPatient.id} onSelect={selectCase} />
        <div className="ops-center-stack">
          <PatientStatusPanel alertCase={selectedCase} selectedPatient={selectedPatient} assignedWorker={assignedWorker} />
          <EmergencyEscalationFlowPanel
            alertCase={selectedCase}
            selectedPatient={selectedPatient}
            assignedWorker={assignedWorker}
            expanded={emergencyFlowExpanded}
            lockedOpen={emergencyFlowLockedOpen}
            onToggle={toggleEmergencyFlow}
          />
        </div>
        <div className="ops-right-stack">
          <ActionPanel
            alertCase={selectedCase}
            selectedPatient={selectedPatient}
            careWorkers={careWorkers}
            assignedWorker={assignedWorker}
            onAssign={handleAssign}
            onAdvance={handleAdvance}
            onSendLowData={handleLowDataMessage}
            onReply={handleReply}
            onGenerateEvent={handleGenerateEvent}
          />
          <CaseEventLog alertCase={selectedCase} />
        </div>
      </div>
      <div className="state-machine-strip" aria-label="care workflow state machine">
        {[
          "normalMonitoring",
          "riskDetected",
          "confirmPatient",
          "notifyCareWorker",
          "emergencyEscalated",
          "waitingResponder",
          "responderArrived",
          "resolved"
        ].map((status) => (
          <span key={status} className={selectedCase.workflowState === status ? "is-active" : ""}>
            {status}
          </span>
        ))}
        <Radio size={16} />
        <b>{selectedCase.workflowState}</b>
      </div>
    </section>
  );
}
