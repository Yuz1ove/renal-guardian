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
import type { AlertCase, CareWorker, CareWorkflowAction, EmergencyFlowStatus, GeneratedCareEventKind, OperationRiskLevel } from "../../types/careOperations";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function buildInitialAlertCases() {
  return operationsPatients
    .map((patient) => {
      const helpEvent = operationsHelpEvents[patient.patientId];
      const risk = calculateRiskScore(patient, helpEvent);
      const alertCase = createAlertCase(patient, risk, helpEvent);
      return refreshCaseWorkflow({
        ...alertCase,
        lowDataPacket: simulateWeakNetworkPacket({
          type: helpEvent.active ? "HELP_EVENT" : "TELEMETRY_EVENT",
          eventId: alertCase.eventId,
          patientId: patient.patientId,
          helpEventActive: helpEvent.active,
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
  selectedEventId,
  onSelect
}: {
  alertCases: AlertCase[];
  selectedEventId: string;
  onSelect: (eventId: string) => void;
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
        {activeCases.map((alertCase) => (
          <button
            key={alertCase.eventId}
            type="button"
            className={classNames(
              "ops-alert-card",
              selectedEventId === alertCase.eventId && "is-active",
              alertCase.riskLevel === "critical" && "has-alert",
              `risk-${levelTone(alertCase.riskLevel)}`
            )}
            onClick={() => onSelect(alertCase.eventId)}
          >
            <div className="alert-card-head">
              <b>{alertCase.patientStatus.codeName} / {alertCase.patientId}</b>
              <span>{operationRiskLabel[alertCase.riskLevel]}</span>
              <strong>{alertCase.riskScore}</strong>
            </div>
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
            {alertCase.riskLevel === "critical" || alertCase.helpEvent.active ? (
              <small className="alert-badge-line">Alert: {triggerReasons(alertCase)[0]}</small>
            ) : null}
            <small>最後回報 {alertCase.patientStatus.lastSyncTime.replace("T", " ").slice(0, 19)}</small>
          </button>
        ))}
      </div>
      <div className="resolved-queue">
        <span>已完成事件</span>
        {resolvedCases.length ? (
          resolvedCases.map((item) => (
            <button key={item.eventId} type="button" onClick={() => onSelect(item.eventId)}>
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
  assignedWorker
}: {
  alertCase: AlertCase;
  assignedWorker?: CareWorker;
}) {
  const patient = alertCase.patientStatus;
  const statusRows = [
    ["hr", `${patient.hr} bpm`],
    ["spo2", `${patient.spo2}%`],
    ["活動下降", `${patient.activityDropPercent}%`],
    ["GPS / 室內位置", patient.locationStatus],
    ["motionState", patient.motionState],
    ["signalQuality", patient.signalQuality],
    ["是否佩戴手環", patient.wearableStatus],
    ["是否按下床邊呼叫器", patient.bedsideButtonStatus],
    ["connectionPath", patient.connectionPath],
    ["packet delay", `${patient.packetDelaySeconds}s / ${patient.bufferedPacketCount} buffered`],
    ["acknowledgementStatus", patient.acknowledgementStatus],
    ["是否已通知家屬", patient.familyNotified ? "yes" : "no"],
    ["是否已派遣居服員", assignedWorker ? `${assignedWorker.name} / ${assignedWorker.workerId}` : "no"]
  ];
  const matrixRows = [
    ["生理風險", alertCase.riskAssessment.matrix.physiologicalRisk],
    ["活動風險", alertCase.riskAssessment.matrix.activityRisk],
    ["求助事件", alertCase.riskAssessment.matrix.helpEventRisk],
    ["通訊風險", alertCase.riskAssessment.matrix.communicationRisk],
    ["加總分數", alertCase.riskAssessment.matrix.totalScore],
    ["判定等級", operationRiskLabel[alertCase.riskAssessment.matrix.level]]
  ];

  return (
    <section className="ops-panel patient-status-panel" aria-label="個案即時狀態面板">
      <header>
        <div>
          <span>Patient Live Status</span>
          <strong>{patient.patientId} / {patient.codeName}</strong>
        </div>
        <b className={`risk-badge risk-${levelTone(alertCase.riskLevel)}`}>{operationRiskLabel[alertCase.riskLevel]}</b>
      </header>
      <div className="care-live-summary">
        <article>
          <span>riskScore</span>
          <strong>{alertCase.riskScore}</strong>
        </article>
        <article>
          <span>workflowState</span>
          <strong>{alertCase.workflowState}</strong>
        </article>
        <article>
          <span>lastSyncTime</span>
          <strong>{patient.lastSyncTime.replace("T", " ").slice(11, 19)}</strong>
        </article>
      </div>
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
        <span>{alertCase.riskLevel === "critical" ? "為什麼被判定為 Critical" : "Risk Assessment"}</span>
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
  assignedWorker,
  expanded,
  lockedOpen,
  onToggle
}: {
  alertCase: AlertCase;
  assignedWorker?: CareWorker;
  expanded: boolean;
  lockedOpen: boolean;
  onToggle: () => void;
}) {
  const flow = alertCase.workflow.escalationFlow;
  const activeCount = flow.filter((node) => isEmergencyStatus(node.status)).length;
  const emergencySummary = [
    ["患者", `${alertCase.patientStatus.codeName} / ${alertCase.patientId}`],
    ["位置", alertCase.patientStatus.locationStatus],
    ["生命徵象", `HR ${alertCase.patientStatus.hr} bpm / SpO2 ${alertCase.patientStatus.spo2}%`],
    ["活動狀態", `${alertCase.patientStatus.motionState} / activityDrop ${alertCase.patientStatus.activityDropPercent}%`],
    ["封包", `${alertCase.lowDataPacket?.packetId ?? "pending"} / ${alertCase.patientStatus.connectionPath}`],
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
        <p className="emergency-flow-collapsed">Critical 條件或手動升級後會自動展開，並顯示封包、通知、派遣與回寫狀態。</p>
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

function PacketStatusCard({ alertCase }: { alertCase: AlertCase }) {
  const packet = alertCase.lowDataPacket;
  const rows = packet
    ? [
        ["packet id", packet.packetId],
        ["payload size", `${packet.payloadSizeKb.toFixed(1)} KB`],
        ["connection path", packet.connectionPath],
        ["retry count", String(packet.retryCount)],
        ["buffered count", String(packet.bufferedPacketCount)],
        ["ack status", packet.acknowledgementStatus],
        ["last sync", packet.lastSyncTime.replace("T", " ").slice(0, 19)]
      ]
    : [
        ["packet id", "not generated"],
        ["connection path", alertCase.patientStatus.connectionPath],
        ["ack status", alertCase.patientStatus.acknowledgementStatus]
      ];

  return (
    <article className="packet-status-card" aria-label="封包傳輸狀態">
      <header>
        <span>Packet Delivery</span>
        <b>{packet?.priority === "critical" ? "Critical helpEvent 優先" : "Telemetry"}</b>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>helpEvent 封包保留 eventId；斷線先寫入 buffer，恢復連線後補送，收到照護端 ack 才停止 retry。</p>
    </article>
  );
}

function ActionPanel({
  alertCase,
  careWorkers,
  assignedWorker,
  onAssign,
  onAdvance,
  onSendLowData,
  onReply,
  onGenerateEvent
}: {
  alertCase: AlertCase;
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
  const recommendedSteps = [
    { label: "先語音確認", status: compactActionStatus(actionStatuses.callPatient) },
    { label: "發送簡訊 / App 推播", status: compactActionStatus(actionStatuses.patientCheckPrompt) },
    { label: "通知家屬", status: compactActionStatus(actionStatuses.notifyFamily) },
    { label: "通知居服員", status: compactActionStatus(actionStatuses.workerDispatch) },
    { label: "升級 119 展示流程", status: emergencyActionStatus }
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
        <button type="button" className="danger" onClick={() => onAdvance("escalateEmergency")} disabled={disabled}>
          <Siren size={15} />
          升級 119 / 緊急醫療
        </button>
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

      <PacketStatusCard alertCase={alertCase} />

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
  const selectedCase = alertCases.find((item) => item.eventId === selectedEventId) ?? alertCases[0];
  const assignedWorker = selectedCase?.assignedCareWorkerId
    ? careWorkers.find((worker) => worker.workerId === selectedCase.assignedCareWorkerId)
    : undefined;

  const sortedAlertCases = useMemo(
    () =>
      alertCases.slice().sort((a, b) => {
        if (a.status === "resolved" && b.status !== "resolved") return 1;
        if (a.status !== "resolved" && b.status === "resolved") return -1;
        return b.riskScore - a.riskScore;
      }),
    [alertCases]
  );

  useEffect(() => {
    const nextCase = alertCases.find((item) => item.patientId === selectedPatientId);
    if (nextCase && nextCase.eventId !== selectedEventId) setSelectedEventId(nextCase.eventId);
  }, [alertCases, selectedEventId, selectedPatientId]);

  if (!selectedCase) return null;

  const emergencyFlowLockedOpen = selectedCase.workflow.escalationFlowVisible;
  const emergencyFlowExpanded = emergencyFlowLockedOpen || Boolean(flowPanelOpenByEvent[selectedCase.eventId]);

  function replaceCase(nextCase: AlertCase) {
    setAlertCases((items) => items.map((item) => (item.eventId === nextCase.eventId ? nextCase : item)));
    setSelectedEventId(nextCase.eventId);
    onSelectPatient(nextCase.patientId);
  }

  function selectCase(eventId: string) {
    const nextCase = alertCases.find((item) => item.eventId === eventId);
    if (!nextCase) return;
    setSelectedEventId(eventId);
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
          核心價值：透析返家後仍能監測；求助事件與生理異常由風險矩陣加權；Critical helpEvent 以低丟包策略優先送達照護端。riskScore 僅為展示排序。
        </p>
      </div>
      <CareKpis alertCases={alertCases} careWorkers={careWorkers} />
      <div className="care-ops-grid">
        <AlertQueue alertCases={sortedAlertCases} selectedEventId={selectedCase.eventId} onSelect={selectCase} />
        <div className="ops-center-stack">
          <PatientStatusPanel alertCase={selectedCase} assignedWorker={assignedWorker} />
          <EmergencyEscalationFlowPanel
            alertCase={selectedCase}
            assignedWorker={assignedWorker}
            expanded={emergencyFlowExpanded}
            lockedOpen={emergencyFlowLockedOpen}
            onToggle={toggleEmergencyFlow}
          />
        </div>
        <div className="ops-right-stack">
          <ActionPanel
            alertCase={selectedCase}
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
