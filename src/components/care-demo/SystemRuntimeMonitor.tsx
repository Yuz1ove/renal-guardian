import { useEffect, useMemo, useState } from "react";
import {
  Braces,
  CheckCircle2,
  DatabaseZap,
  FileClock,
  GitBranch,
  MessageCircle,
  Play,
  RefreshCcw,
  ServerCog,
  ShieldAlert,
  Truck,
  Watch
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { operationsHelpEvents, operationsPatients } from "../../data/careOperationsDemoData";
import { calculateRiskScore, operationRiskLabel, simulateWeakNetworkPacket } from "../../lib/careOperationsEngine";
import type { CareDemoState, WeakNetworkPacket } from "../../types/careOperations";

type RuntimeModuleId =
  | "receiver"
  | "normalizer"
  | "risk"
  | "queue"
  | "dispatch"
  | "communication"
  | "audit";

interface RuntimeModule {
  id: RuntimeModuleId;
  title: string;
  detail: string;
  icon: LucideIcon;
}

interface RuntimeStep {
  id: string;
  moduleId: RuntimeModuleId;
  state: CareDemoState;
  title: string;
  detail: string;
  payload: unknown;
  packet: WeakNetworkPacket;
  userStatus: string;
  deviceStatus: string;
  riskScore: number;
  recommendation: string;
  pseudoCode: string[];
  audit: string;
}

const patient = operationsPatients[0];
const helpEvent = operationsHelpEvents[patient.patientId];
const firstRisk = calculateRiskScore(patient, helpEvent);
const noReplyRisk = calculateRiskScore(patient, helpEvent, { noResponseTimeout: true });
const replyPacket = simulateWeakNetworkPacket({
  type: "ACK_REQUEST",
  eventId: "evt-A-203-164200",
  patientId: patient.patientId,
  connectionPath: "LTE fallback",
  retryCount: 1,
  bufferedPacketCount: 1,
  acknowledgementStatus: "retrying",
  lastSyncTime: "2026-07-02T16:44:00+08:00"
});
const helpPacket = simulateWeakNetworkPacket({
  type: "HELP_EVENT",
  eventId: "evt-A-203-164200",
  patientId: patient.patientId,
  helpEventActive: true,
  connectionPath: "BLE -> phone relay",
  retryCount: 0,
  bufferedPacketCount: 0,
  acknowledgementStatus: "pending",
  lastSyncTime: helpEvent.createdAt
});
const fallbackPacket = simulateWeakNetworkPacket({
  type: "HELP_EVENT",
  eventId: "evt-A-203-164200",
  patientId: patient.patientId,
  helpEventActive: true,
  connectionPath: "LTE fallback",
  retryCount: 2,
  bufferedPacketCount: 1,
  acknowledgementStatus: "retrying",
  lastSyncTime: "2026-07-02T16:42:16+08:00"
});
const ackPacket = simulateWeakNetworkPacket({
  type: "CARE_ACK",
  eventId: "evt-A-203-164200",
  patientId: patient.patientId,
  connectionPath: "Wi-Fi",
  retryCount: 0,
  bufferedPacketCount: 0,
  acknowledgementStatus: "acknowledged",
  lastSyncTime: "2026-07-02T16:54:20+08:00"
});

const runtimeModules: RuntimeModule[] = [
  { id: "receiver", title: "Device Event Receiver", detail: "接收手環與床邊呼叫器 payload", icon: Watch },
  { id: "normalizer", title: "Packet Normalizer", detail: "統一 bracelet / bedside / phone / caregiver event", icon: Braces },
  { id: "risk", title: "Risk Engine", detail: "逐條規則計算 riskScore", icon: ServerCog },
  { id: "queue", title: "Alert Queue Builder", detail: "建立 eventId、priority、status", icon: DatabaseZap },
  { id: "dispatch", title: "Dispatch Engine", detail: "根據距離、負載與等級派工", icon: Truck },
  { id: "communication", title: "Communication Adapter", detail: "normal / weak / emergency fallback", icon: MessageCircle },
  { id: "audit", title: "Audit Log", detail: "記錄自動決策與人工操作", icon: FileClock }
];

const riskFormula = [
  "baseScore = 0",
  "if spo2 < 92 then +30; if spo2 < 88 then +45",
  "if hr > 120 or hr < 50 then +25",
  "if activityDropPercent > 60 then +20",
  "if helpEvent.active then +35",
  "if signalQuality poor then +10",
  "if packetDelay > 10s then +8",
  "if noResponseTimeout then +20",
  "if bedside button + low SpO2 then +25",
  "riskScore = clamp(baseScore, 0, 100)"
];

const runtimeSteps: RuntimeStep[] = [
  {
    id: "step-1-monitoring",
    moduleId: "receiver",
    state: "monitoring",
    title: "Step 1：手環持續監測",
    detail: "接收 HR、SpO2、活動量與佩戴狀態，維持低資料量同步。",
    payload: {
      patientId: patient.patientId,
      source: "bracelet",
      hr: patient.hr,
      spo2: patient.spo2,
      activityDropPercent: patient.activityDropPercent,
      motionState: patient.motionState,
      signalQuality: patient.signalQuality,
      dataQuality: patient.dataQuality,
      lastSyncTime: patient.lastSyncTime
    },
    packet: simulateWeakNetworkPacket({
      type: "TELEMETRY_EVENT",
      eventId: "evt-A-203-164200",
      patientId: patient.patientId,
      connectionPath: "BLE -> phone relay",
      acknowledgementStatus: "sent",
      lastSyncTime: patient.lastSyncTime
    }),
    userStatus: "返家恢復期，手環佩戴中",
    deviceStatus: "wearable streaming / bedside idle",
    riskScore: 0,
    recommendation: "維持例行監測",
    pseudoCode: ["receiver.accept(payload)", "validate patientId and timestamp", "append device buffer"],
    audit: "bracelet payload received"
  },
  {
    id: "step-2-bedside-help",
    moduleId: "receiver",
    state: "bedsideHelpPressed",
    title: "Step 2：床邊呼叫器被按下",
    detail: "中央 SOS 觸發 helpEvent.active，LED ring 進入已送出狀態。",
    payload: {
      helpEvent: {
        active: true,
        source: "bedside_button",
        createdAt: helpEvent.createdAt
      }
    },
    packet: helpPacket,
    userStatus: "患者主動求助",
    deviceStatus: "bedside SOS pressed / LED sent",
    riskScore: 35,
    recommendation: "helpEvent 進入優先佇列",
    pseudoCode: ["receiver.merge(helpEvent)", "mark source = bedside_button", "set emergency event flag"],
    audit: "bedside SOS event received"
  },
  {
    id: "step-3-build-packet",
    moduleId: "normalizer",
    state: "alertQueued",
    title: "Step 3：裝置產生 helpEvent 封包",
    detail: "MCU 建立 eventId，重要事件封包不被一般生理資料覆蓋。",
    payload: {
      normalizedEvent: {
        patientId: patient.patientId,
        source: "bedside_button",
        telemetry: ["hr", "spo2", "activityDropPercent", "motionState"],
        eventFields: ["eventId", "createdAt", "lastSyncTime"]
      }
    },
    packet: helpPacket,
    userStatus: "求助事件等待送出",
    deviceStatus: "eventId retained / local buffer ready",
    riskScore: 35,
    recommendation: "保留 eventId，準備低丟包傳輸",
    pseudoCode: ["normalize(braceletPayload)", "normalize(bedsidePayload)", "helpEvent priority > telemetry"],
    audit: "packet normalized"
  },
  {
    id: "step-4-transmit",
    moduleId: "communication",
    state: "alertQueued",
    title: "Step 4：封包經 BLE / Wi-Fi / LTE 傳送",
    detail: "先走 BLE phone relay，ack timeout 後改走 LTE fallback 並保留 retry。",
    payload: fallbackPacket,
    packet: fallbackPacket,
    userStatus: "等待照護端接收",
    deviceStatus: "retrying / LTE fallback",
    riskScore: 53,
    recommendation: "Critical helpEvent 優先傳送，收到照護端 ack 才停止 retry",
    pseudoCode: ["send(helpEvent)", "if ackTimeout switch LTE fallback", "preserve eventId to avoid duplicate dispatch"],
    audit: "packet retry with fallback path"
  },
  {
    id: "step-5-console-received",
    moduleId: "queue",
    state: "alertQueued",
    title: "Step 5：照護工作台收到事件",
    detail: "建立 alertCase，Critical 個案置頂並開始 SLA 倒數。",
    payload: {
      eventId: "evt-A-203-164200",
      patientId: patient.patientId,
      status: "pending",
      queue: "critical first"
    },
    packet: fallbackPacket,
    userStatus: "A-203 出現在警報佇列最上方",
    deviceStatus: "care console received packet",
    riskScore: firstRisk.riskScore,
    recommendation: "先語音確認並準備通知家屬",
    pseudoCode: ["createAlertCase(patientStatus, riskAssessment)", "push alertQueue", "start SLA countdown"],
    audit: "alertQueue created"
  },
  {
    id: "step-6-risk-engine",
    moduleId: "risk",
    state: "anomalyDetected",
    title: "Step 6：風險引擎加權評分",
    detail: "床邊求助、低血氧、活動下降、訊號延遲共同加權。",
    payload: {
      riskScore: firstRisk.riskScore,
      riskLevel: operationRiskLabel[firstRisk.riskLevel],
      matrix: firstRisk.matrix,
      reasons: firstRisk.reasons
    },
    packet: fallbackPacket,
    userStatus: "Critical",
    deviceStatus: "risk engine complete",
    riskScore: firstRisk.riskScore,
    recommendation: firstRisk.recommendedAction,
    pseudoCode: riskFormula,
    audit: `risk engine calculated riskScore = ${firstRisk.riskScore}`
  },
  {
    id: "step-7-ack-waiting",
    moduleId: "communication",
    state: "patientAckWaiting",
    title: "Step 7：照護端要求患者確認",
    detail: "發送低資料量按鍵式 ACK，患者不需輸入長文字。",
    payload: replyPacket,
    packet: replyPacket,
    userStatus: "等待患者按鍵回覆",
    deviceStatus: "ACK_REQUEST retrying",
    riskScore: firstRisk.riskScore,
    recommendation: "請按一下確認安全，按兩下表示需要協助",
    pseudoCode: ["send ACK_REQUEST options 1..3", "record retryCount and bufferedPacketCount", "wait 30 seconds"],
    audit: "patient acknowledgement requested"
  },
  {
    id: "step-8-escalation",
    moduleId: "dispatch",
    state: "emergencyEscalated",
    title: "Step 8：無回覆則升級家屬 / 居服員 / 119 展示流程",
    detail: "30 秒內未回覆，風險加權並啟動通知與派工。",
    payload: {
      eventId: "evt-A-203-164200",
      patientId: patient.patientId,
      noResponseTimeout: true,
      riskScore: noReplyRisk.riskScore,
      recommendation: noReplyRisk.recommendedAction
    },
    packet: replyPacket,
    userStatus: "無回覆，進入升級",
    deviceStatus: "ACK timeout / retrying",
    riskScore: noReplyRisk.riskScore,
    recommendation: noReplyRisk.recommendedAction,
    pseudoCode: ["if no acknowledgement after 30s then +20", "notify family", "dispatch home care worker", "show 119 escalation path"],
    audit: "no response escalation"
  },
  {
    id: "step-9-resolved",
    moduleId: "audit",
    state: "resolved",
    title: "Step 9：居服員到達並結案",
    detail: "到場確認後回寫 resolved，保留完整 audit trail。",
    payload: {
      eventId: "evt-A-203-164200",
      assignedCareWorkerId: "CW-07",
      status: "resolved",
      resolvedAt: "2026-07-02T16:55:00+08:00"
    },
    packet: ackPacket,
    userStatus: "居服員到達，現場確認安全",
    deviceStatus: "care ACK acknowledged",
    riskScore: 18,
    recommendation: "事件解除，回到例行監測",
    pseudoCode: ["advanceCareWorkflow(markArrived)", "advanceCareWorkflow(resolveCase)", "appendAuditLog(event)"],
    audit: "worker arrived and case resolved"
  }
];

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function SystemRuntimeMonitor() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentStep = runtimeSteps[currentIndex];
  const activeModuleId = currentStep.moduleId;
  const visibleAudit = useMemo(() => runtimeSteps.slice(0, currentIndex + 1), [currentIndex]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setCurrentIndex((index) => {
        if (index >= runtimeSteps.length - 1) {
          setIsPlaying(false);
          return index;
        }
        return index + 1;
      });
    }, 950);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  function play() {
    setCurrentIndex(0);
    setIsPlaying(true);
  }

  function reset() {
    setCurrentIndex(0);
    setIsPlaying(false);
  }

  return (
    <section className="system-runtime-monitor" aria-label="系統程式運行監控台">
      <div className="ops-safety-note">
        <ShieldAlert size={18} />
        <p>
          Runtime 展示三件事：返家後持續監測、求助與生理異常加權、Critical helpEvent 以低丟包策略優先送達。riskScore 僅作展示排序。
        </p>
      </div>

      <div className="runtime-layout">
        <section className="runtime-module-map" aria-label="後端模組流程圖">
          <header>
            <span>Runtime Modules</span>
            <strong>後端程式流程</strong>
          </header>
          <ol>
            {runtimeModules.map((module, index) => {
              const Icon = module.icon;

              return (
                <li
                  key={module.id}
                  className={classNames(activeModuleId === module.id && "is-active", visibleAudit.some((step) => step.moduleId === module.id) && "is-done")}
                >
                  <i>{index + 1}</i>
                  <Icon size={18} />
                  <div>
                    <b>{module.title}</b>
                    <span>{module.detail}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="runtime-payload-panel" aria-label="正在處理的 payload 與計算邏輯">
          <header>
            <div>
              <span>currentStep</span>
              <strong>{currentIndex + 1}. {currentStep.title}</strong>
            </div>
            <em>{currentStep.moduleId}</em>
          </header>
          <p>{currentStep.detail}</p>
          <div className="runtime-step-summary">
            <article>
              <span>使用者狀態</span>
              <b>{currentStep.userStatus}</b>
            </article>
            <article>
              <span>裝置狀態</span>
              <b>{currentStep.deviceStatus}</b>
            </article>
            <article>
              <span>riskScore</span>
              <b>{currentStep.riskScore}</b>
            </article>
            <article>
              <span>decision recommendation</span>
              <b>{currentStep.recommendation}</b>
            </article>
          </div>
          <div className="runtime-packet-strip" aria-label="封包傳輸狀態">
            <article>
              <span>packet id</span>
              <b>{currentStep.packet.packetId}</b>
            </article>
            <article>
              <span>payload</span>
              <b>{currentStep.packet.payloadSizeKb.toFixed(1)} KB</b>
            </article>
            <article>
              <span>connection path</span>
              <b>{currentStep.packet.connectionPath}</b>
            </article>
            <article>
              <span>retry / buffer</span>
              <b>{currentStep.packet.retryCount} / {currentStep.packet.bufferedPacketCount}</b>
            </article>
            <article>
              <span>ack</span>
              <b>{currentStep.packet.acknowledgementStatus}</b>
            </article>
            <article>
              <span>last sync</span>
              <b>{currentStep.packet.lastSyncTime.replace("T", " ").slice(11, 19)}</b>
            </article>
          </div>
          <div className="runtime-code-grid">
            <article>
              <span>JSON / payload</span>
              <pre>{JSON.stringify(currentStep.payload, null, 2)}</pre>
            </article>
            <article>
              <span>pseudo-code</span>
              <ol>
                {currentStep.pseudoCode.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        <section className="runtime-audit-panel" aria-label="audit log 與 state machine">
          <header>
            <span>Audit Log</span>
            <strong>決策與操作紀錄</strong>
          </header>
          <ol>
            {visibleAudit.map((step, index) => (
              <li key={step.id} className={index === currentIndex ? "is-current" : ""}>
                <time>{String(index + 1).padStart(2, "0")}</time>
                <div>
                  <b>{step.audit}</b>
                  <span>{step.moduleId} / {step.title}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="runtime-state-machine">
            {[
              "monitoring",
              "anomalyDetected",
              "bedsideHelpPressed",
              "alertQueued",
              "patientAckWaiting",
              "emergencyEscalated",
              "resolved"
            ].map((state) => (
              <span key={state} className={currentStep.state === state ? "is-active" : ""}>
                {state}
              </span>
            ))}
          </div>
        </section>
      </div>

      <footer className="runtime-controls">
        <button type="button" onClick={play}>
          <Play size={16} />
          播放事件流
        </button>
        <button type="button" onClick={() => setIsPlaying((value) => !value)}>
          <GitBranch size={16} />
          {isPlaying ? "暫停" : "繼續"}
        </button>
        <button type="button" onClick={reset}>
          <RefreshCcw size={16} />
          重設
        </button>
        <span>{currentIndex + 1} / {runtimeSteps.length}</span>
        <CheckCircle2 size={17} />
      </footer>
    </section>
  );
}
