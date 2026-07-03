import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  Bluetooth,
  CheckCircle2,
  Cpu,
  Database,
  HeartPulse,
  RadioTower,
  RefreshCcw,
  ServerCog,
  ShieldAlert,
  Smartphone,
  Watch,
  WifiOff
} from "lucide-react";
import type {
  AcknowledgementStatus,
  PacketType,
  SensorSnapshot
} from "../types/wearable";
import { calculateRisk, type RiskResult } from "../lib/risk/riskEngine";
import { SimulatedBleTransport, type BleTransportResult } from "../lib/wearable/bleTransport";
import {
  MockWearableBackendApi,
  mockWearableApiRoutes,
  type CriticalEventRecord,
  type WearableIngestResponse
} from "../lib/wearable/mockWearableApi";
import { buildWearablePacket, type WearablePacket } from "../lib/wearable/packetBuilder";
import { assessSignalQuality } from "../lib/wearable/signalQuality";

interface WearableFlowDemoProps {
  patientId: string;
  displayName: string;
}

interface PacketLogItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: Tone;
}

const safetyCopy = "本頁為競賽展示與照護輔助流程，不作為診斷、治療或緊急醫療決策依據。";
type Tone = "ok" | "warn" | "danger" | "info";

interface FlowNodeState {
  icon: LucideIcon;
  title: string;
  status: string;
  helper: string;
  role: string;
  detail: string;
  tone: Tone;
}

interface ModuleExplanation {
  role: string;
  data: string;
  usage: string;
  abnormalMeaning: string;
  careDecision: string;
}

interface DecisionLogicItem {
  title: string;
  body: string;
  code: string;
}

interface ReliabilityScenario {
  id: "normal" | "weak" | "critical";
  label: string;
  title: string;
  tone: Tone;
  rows: Array<{ label: string; value: string }>;
  ackChain: Array<{ label: string; status: string }>;
  safeguards: string[];
}

const moduleExplanations: Record<string, ModuleExplanation> = {
  ppg: {
    role: "透過光學感測取得脈搏變化，作為洗腎返家恢復期的基礎生命徵象來源。",
    data: "hr（心率 bpm）、pulseSignalQuality（脈搏訊號品質）、lastSyncTime（最後同步時間）。",
    usage: "hr 用於判斷偏快、偏慢或波動；pulseSignalQuality 先確認資料是否可信。",
    abnormalMeaning: "若 hr 明顯異常且訊號品質良好，可能代表不適、脫水、低血壓、心悸或恢復不良；若品質低則先標記需重新量測。",
    careDecision: "心率異常會提高 riskScore；若合併活動下降、求助事件或 SpO2 下降，照護端應升級確認。"
  },
  spo2: {
    role: "以紅光與紅外光偵測血氧濃度，觀察呼吸、循環或返家恢復狀態是否可能異常。",
    data: "spo2（血氧百分比）、spo2SignalQuality（血氧訊號品質）、lastSyncTime（最後同步時間）。",
    usage: "spo2 進入風險矩陣；spo2SignalQuality 用於排除佩戴鬆脫、晃動或光學干擾造成的誤判。",
    abnormalMeaning: "若 spo2 持續偏低且訊號品質良好，可能代表呼吸狀態或循環狀態需要確認；品質差時提示重新配戴或重測。",
    careDecision: "血氧偏低會提高風險等級；若同時有心率異常、活動下降或長時間未回應，後端應升級事件。"
  },
  accelerometer: {
    role: "偵測手部活動、姿態變化與活動量下降，補足單純生命徵象看不出的狀態變化。",
    data: "activityIndex（目前活動量）、activityDropPercent（相對平常下降比例）、motionState（活動狀態）。",
    usage: "activityIndex 與個人基準比較；motionState 協助辨識正常活動、靜止、突然下降或疑似跌倒後無動作。",
    abnormalMeaning: "洗腎後返家若活動量突然下降，可能代表疲倦、頭暈、跌倒、低血壓或無法起身，需要照護端確認。",
    careDecision: "活動下降不單獨觸發最高警報，而是和心率、血氧、求助按鍵與回應狀態一起加權。"
  },
  help: {
    role: "使用者主動求救的最高優先級輸入，讓不適、跌倒、無法起身或需要協助時能用簡單動作觸發事件。",
    data: "helpEvent.active（是否求助）、helpEvent.source（來源）、helpEvent.createdAt（建立時間）。",
    usage: "active 代表正在求助；source 區分 bracelet_button 或 bedside_button；createdAt 用於計算事件持續時間。",
    abnormalMeaning: "一旦按鍵觸發，系統應視為明確求助，不應被低訊號品質覆蓋；其他數值正常也要送出通知。",
    careDecision: "求助事件會直接提高優先級，照護端顯示確認流程；若長時間未解除或未回應，升級通知家屬或居服員。"
  },
  signal: {
    role: "資料可信度守門員，判斷手環是否戴好、感測器是否受干擾、資料是否能進入風險計算。",
    data: "signalStatus（訊號狀態）、signalQuality（整體可信度）、dataQuality（可用程度）。",
    usage: "signalQuality / dataQuality 決定生命徵象是否可被風險引擎採用，避免低品質資料直接造成誤報。",
    abnormalMeaning: "若訊號品質差，系統不能直接把異常數值當成真實危險，也不能完全忽略，應標記資料不穩定。",
    careDecision: "低品質資料會降低自動判讀可信度；若同時有求助按鍵或長時間無回應，仍保留警示與人工確認。"
  },
  ble: {
    role: "將手環整理好的封包送到手機、平板或床邊 Gateway，重點是低功耗、穩定與可重送。",
    data: "payloadSizeKb（封包大小）、packetType（封包種類）、lastSyncTime（最後傳輸時間）、connectionState（連線狀態）。",
    usage: "packetType 區分 vital_summary、help_event、quality_update；lastSyncTime 判斷斷線或延遲。",
    abnormalMeaning: "BLE 斷線代表資料無法即時送到後端；延遲過久時，風險引擎應標記資料過期。",
    careDecision: "斷線時手環先本地暫存；恢復後補送，且 help_event 優先於一般生命徵象摘要。"
  },
  sync: {
    role: "在網路不穩、BLE 中斷或 Gateway 不可用時保存資料；時間同步確保資料可以正確排序。",
    data: "bufferedPacketCount（待送封包數）、packetDelay（資料延遲）、lastSyncTime（最後同步時間）。",
    usage: "bufferedPacketCount 顯示尚未送出的封包；packetDelay 告訴後端資料是不是即時狀態。",
    abnormalMeaning: "若待送封包持續增加，代表資料正在累積但尚未上傳；延遲過高不應被當成即時危險判斷。",
    careDecision: "系統優先補送求助事件與高風險摘要；Dashboard 顯示資料延遲或待同步。"
  },
  feedback: {
    role: "手環對使用者的回饋介面，用震動與 LED 確認事件送出、照護端已收到或需要重新配戴。",
    data: "acknowledgementStatus（確認狀態）、helpCue（求助提示）、ledState（燈號）、vibrationPattern（震動模式）。",
    usage: "ACK 狀態告訴使用者事件是否送達；LED 與震動用低負擔方式提示求助、處理中或需重測。",
    abnormalMeaning: "若按下求助鍵後沒有震動或 LED 回饋，使用者可能誤以為沒有送出；未 ACK 時應持續低頻提示。",
    careDecision: "照護端收到事件後回饋已收到；處理中可改為慢速閃爍或短震，降低使用者不安。"
  }
};

const decisionLogicItems: DecisionLogicItem[] = [
  {
    title: "先看資料可信度",
    body: "單一異常數值不一定直接警報，必須先看 signalQuality / dataQuality；低品質資料會提示重新配戴或等待下一筆資料。",
    code: "signalQuality + dataQuality"
  },
  {
    title: "求助按鍵高優先級",
    body: "help_event 代表使用者明確求助，即使 hr、spo2 仍在正常範圍，也要通知照護端並等待人工確認。",
    code: "HELP_EVENT_ACTIVE"
  },
  {
    title: "多因子同時異常才升級",
    body: "心率、血氧與活動量下降若同時異常，riskScore 會疊加，風險等級會從觀察升級為主動聯絡。",
    code: "HR_ELEVATED / SPO2_LOW / ACTIVITY_DROP"
  },
  {
    title: "延遲資料要標示",
    body: "資料延遲或 BLE 斷線時，Dashboard 必須顯示資料可能不是即時，避免把補傳資料當成當下狀態。",
    code: "DATA_STALE"
  },
  {
    title: "輸出可解釋結果",
    body: "後端輸出 riskLevel、riskScore、reasonCodes、recommendedAction、dataConfidence，照護端能看見為什麼被判定為風險。",
    code: "riskLevel + reasonCodes"
  }
];

const reliabilityScenarios: ReliabilityScenario[] = [
  {
    id: "normal",
    label: "Normal packet",
    title: "一般生命徵象封包完成 ACK",
    tone: "ok",
    rows: [
      { label: "packetId", value: "RG-A203-VITAL-001" },
      { label: "packetType", value: "vital_summary" },
      { label: "acknowledgementStatus", value: "server_ack" },
      { label: "local buffer", value: "0 packets" },
      { label: "retry queue", value: "empty" },
      { label: "priority queue", value: "normal lane" },
      { label: "lastSyncTime", value: "17:08:42" }
    ],
    ackChain: [
      { label: "Local ACK", status: "local_received" },
      { label: "Gateway ACK", status: "gateway_ack" },
      { label: "Server ACK", status: "server_ack" }
    ],
    safeguards: [
      "packetId 與 checksum 讓後端可辨識重複封包。",
      "lastSyncTime 告訴照護端資料是否為最新同步。"
    ]
  },
  {
    id: "weak",
    label: "Weak signal retry",
    title: "弱訊號時保留同一個 packetId 進 retry queue",
    tone: "warn",
    rows: [
      { label: "packetId", value: "RG-A203-RETRY-014" },
      { label: "packetType", value: "quality_update" },
      { label: "acknowledgementStatus", value: "retrying" },
      { label: "local buffer", value: "1 packet retained" },
      { label: "retry queue", value: "1 pending retry" },
      { label: "priority queue", value: "quality before routine telemetry" },
      { label: "lastSyncTime", value: "17:09:04" }
    ],
    ackChain: [
      { label: "Local ACK", status: "local_received" },
      { label: "Gateway ACK", status: "pending retry" },
      { label: "Server ACK", status: "waiting" }
    ],
    safeguards: [
      "local buffer 先保留封包，不因 BLE 中斷直接丟棄。",
      "retry queue 保留相同 packetId，恢復連線後補傳並避免重複建案。"
    ]
  },
  {
    id: "critical",
    label: "Critical help_event priority queue",
    title: "求助事件進 critical priority queue 並等待完整 ACK",
    tone: "danger",
    rows: [
      { label: "packetId", value: "RG-A203-HELP-009" },
      { label: "packetType", value: "help_event" },
      { label: "acknowledgementStatus", value: "local_received → gateway_ack → server_ack" },
      { label: "local buffer", value: "write-through until server_ack" },
      { label: "retry queue", value: "protected critical lane" },
      { label: "priority queue", value: "front of queue" },
      { label: "lastSyncTime", value: "17:09:12" }
    ],
    ackChain: [
      { label: "Local ACK", status: "button press stored" },
      { label: "Gateway ACK", status: "relay received" },
      { label: "Server ACK", status: "care alert created" }
    ],
    safeguards: [
      "help_event 不會被一般 vital_summary 覆蓋，會先進 priority queue。",
      "acknowledgementStatus 讓患者端與照護端知道目前送達到哪一層。",
      "lastSyncTime 搭配 retry queue 顯示求助事件是否仍在等待補送。"
    ]
  }
];

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function compactTime(value: string) {
  return value.slice(11, 19) || value;
}

function deviceIdFor(patientId: string) {
  return `RG-BLE-${patientId.replace(/[^A-Z0-9]/gi, "")}`;
}

function createBaseSnapshot(patientId: string): SensorSnapshot {
  const now = new Date().toISOString();
  return {
    patientId,
    deviceId: deviceIdFor(patientId),
    timestamp: now,
    ppg: {
      hr: 76,
      pulseSignalQuality: 0.92,
      lastSyncTime: now
    },
    spo2: {
      spo2: 97,
      spo2SignalQuality: 0.91,
      lastSyncTime: now
    },
    accelerometer: {
      activityIndex: 42,
      activityDropPercent: 8,
      motionState: "normal"
    },
    helpEvent: {
      active: false,
      source: "bracelet_button",
      createdAt: null
    },
    signal: {
      signalStatus: "normal",
      signalQuality: 0.92,
      dataQuality: "good"
    },
    ble: {
      payloadSizeKb: 0.8,
      packetType: "vital_summary",
      lastSyncTime: now
    },
    sync: {
      bufferedPacketCount: 0,
      lastSyncTime: now,
      packetDelay: 0
    },
    feedback: {
      acknowledgementStatus: "idle"
    }
  };
}

function refreshSignal(snapshot: SensorSnapshot): SensorSnapshot {
  return {
    ...snapshot,
    signal: assessSignalQuality({
      ppg: snapshot.ppg,
      spo2: snapshot.spo2,
      accelerometer: snapshot.accelerometer,
      sync: snapshot.sync
    })
  };
}

function prepareSnapshot(
  patientId: string,
  patch: Partial<SensorSnapshot>,
  packetType: PacketType,
  acknowledgementStatus: AcknowledgementStatus = "idle"
) {
  const now = new Date().toISOString();
  const base = createBaseSnapshot(patientId);
  const next: SensorSnapshot = {
    ...base,
    ...patch,
    timestamp: now,
    ppg: {
      ...base.ppg,
      ...(patch.ppg ?? {}),
      lastSyncTime: patch.ppg?.lastSyncTime ?? now
    },
    spo2: {
      ...base.spo2,
      ...(patch.spo2 ?? {}),
      lastSyncTime: patch.spo2?.lastSyncTime ?? now
    },
    accelerometer: {
      ...base.accelerometer,
      ...(patch.accelerometer ?? {})
    },
    helpEvent: {
      ...base.helpEvent,
      ...(patch.helpEvent ?? {})
    },
    ble: {
      ...base.ble,
      ...(patch.ble ?? {}),
      packetType,
      lastSyncTime: patch.ble?.lastSyncTime ?? now
    },
    sync: {
      ...base.sync,
      ...(patch.sync ?? {}),
      lastSyncTime: patch.sync?.lastSyncTime ?? now
    },
    feedback: {
      acknowledgementStatus
    }
  };

  return refreshSignal(next);
}

function riskTone(level: RiskResult["level"]): Tone {
  if (level === "critical") return "danger";
  if (level === "high") return "danger";
  if (level === "medium") return "warn";
  return "ok";
}

function statusTone(status: string): Tone {
  if (["critical", "high", "invalid", "poor", "failed"].includes(status)) return "danger";
  if (["medium", "fair", "retrying", "stale_data", "loose_wear", "high_motion"].includes(status)) return "warn";
  if (["gateway_ack", "server_ack"].includes(status)) return "info";
  return "ok";
}

function feedbackCueFor(snapshot: SensorSnapshot, bleConnected: boolean) {
  if (snapshot.helpEvent.active) {
    return {
      helpCue: "active_help_cue",
      ledState: snapshot.feedback.acknowledgementStatus === "server_ack" ? "slow_blue_ack" : "fast_amber_sos",
      vibrationPattern: snapshot.feedback.acknowledgementStatus === "server_ack" ? "short-short" : "triple-pulse"
    };
  }

  if (!bleConnected || snapshot.feedback.acknowledgementStatus === "retrying") {
    return {
      helpCue: "pending_sync",
      ledState: "amber_breathing",
      vibrationPattern: "single-soft-reminder"
    };
  }

  if (snapshot.signal.dataQuality === "poor" || snapshot.signal.dataQuality === "invalid") {
    return {
      helpCue: "rewear_or_retry",
      ledState: "white_double_blink",
      vibrationPattern: "two-short"
    };
  }

  return {
    helpCue: "idle",
    ledState: snapshot.feedback.acknowledgementStatus === "server_ack" ? "blue_confirmed" : "green_standby",
    vibrationPattern: snapshot.feedback.acknowledgementStatus === "server_ack" ? "short" : "none"
  };
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <span className="wearable-field">
      <small>{label}</small>
      <b>{value ?? "資料需確認"}</b>
    </span>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  subtitle,
  explanation,
  tone,
  children
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  explanation: ModuleExplanation;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <article className={`wearable-module-card tone-${tone}`}>
      <header>
        <span className="wearable-module-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
      </header>
      <div className="wearable-field-grid">{children}</div>
      <dl className="wearable-module-detail">
        <div>
          <dt>作用</dt>
          <dd>{explanation.role}</dd>
        </div>
        <div>
          <dt>資料</dt>
          <dd>{explanation.data}</dd>
        </div>
        <div>
          <dt>用途</dt>
          <dd>{explanation.usage}</dd>
        </div>
        <div>
          <dt>異常意義</dt>
          <dd>{explanation.abnormalMeaning}</dd>
        </div>
        <div>
          <dt>照護決策</dt>
          <dd>{explanation.careDecision}</dd>
        </div>
      </dl>
    </article>
  );
}

function FlowNode({
  icon: Icon,
  title,
  status,
  helper,
  role,
  detail,
  step,
  tone
}: {
  icon: LucideIcon;
  title: string;
  status: string;
  helper: string;
  role: string;
  detail: string;
  step: number;
  tone: Tone;
}) {
  return (
    <article className={`wearable-flow-node tone-${tone}`}>
      <header>
        <span aria-hidden="true">
          <Icon size={18} />
        </span>
        <small>Step {step}</small>
      </header>
      <strong>{title}</strong>
      <em>角色：{role}</em>
      <p>{detail}</p>
      <b>{status}</b>
      <small>{helper}</small>
    </article>
  );
}

function PacketReliabilityDemo() {
  const [selectedId, setSelectedId] = useState<ReliabilityScenario["id"]>("critical");
  const selected = reliabilityScenarios.find((scenario) => scenario.id === selectedId) ?? reliabilityScenarios[0];

  return (
    <section className="packet-reliability-demo" aria-label="Packet Reliability Demo">
      <header className="wearable-section-title">
        <span>3</span>
        <div>
          <strong>Packet Reliability Demo</strong>
          <p>靜態展示 Normal packet、Weak signal retry 與 Critical help_event priority queue，說明求助事件為什麼不容易遺失。</p>
        </div>
      </header>

      <div className="reliability-button-row" aria-label="packet reliability scenarios">
        {reliabilityScenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={selected.id === scenario.id ? "is-active" : ""}
            onClick={() => setSelectedId(scenario.id)}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      <div className={`reliability-scenario-card tone-${selected.tone}`}>
        <div className="reliability-main">
          <div>
            <span>selected state</span>
            <strong>{selected.title}</strong>
          </div>
          <dl>
            {selected.rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="ack-chain-panel" aria-label="acknowledgement chain">
          {selected.ackChain.map((ack) => (
            <article key={ack.label}>
              <span>{ack.label}</span>
              <b>{ack.status}</b>
            </article>
          ))}
        </div>

        <article className="reliability-explanation">
          <strong>為什麼求助事件不容易遺失</strong>
          <ul>
            {selected.safeguards.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export function WearableFlowDemo({ patientId, displayName }: WearableFlowDemoProps) {
  const bleTransportRef = useRef(new SimulatedBleTransport());
  const backendRef = useRef(new MockWearableBackendApi());
  const logCounterRef = useRef(0);
  const [snapshot, setSnapshot] = useState(() => createBaseSnapshot(patientId));
  const [risk, setRisk] = useState(() => calculateRisk(createBaseSnapshot(patientId)));
  const [latestPacket, setLatestPacket] = useState<WearablePacket | null>(null);
  const [transportResult, setTransportResult] = useState<BleTransportResult | null>(null);
  const [backendResponse, setBackendResponse] = useState<WearableIngestResponse | null>(null);
  const [criticalEvents, setCriticalEvents] = useState<CriticalEventRecord[]>([]);
  const [packetLog, setPacketLog] = useState<PacketLogItem[]>([]);
  const [bleConnected, setBleConnected] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const next = createBaseSnapshot(patientId);
    setSnapshot(next);
    setRisk(calculateRisk(next));
    setLatestPacket(null);
    setTransportResult(null);
    setBackendResponse(null);
    setPacketLog([]);
    logCounterRef.current = 0;
    bleTransportRef.current = new SimulatedBleTransport();
    backendRef.current = new MockWearableBackendApi();
    setBleConnected(true);
  }, [patientId]);

  function appendLog(item: Omit<PacketLogItem, "id" | "time">) {
    const now = new Date().toISOString();
    logCounterRef.current += 1;
    const nextItem = {
      ...item,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${now}-${logCounterRef.current}-${Math.random().toString(16).slice(2)}`,
      time: compactTime(now)
    };
    setPacketLog((items) => {
      if (items[0]?.title === nextItem.title && items[0]?.detail === nextItem.detail) {
        return items;
      }
      return [nextItem, ...items].slice(0, 8);
    });
  }

  async function transmit(nextSnapshot: SensorSnapshot, packetType: PacketType) {
    const packet = buildWearablePacket(nextSnapshot, packetType);
    const uiSnapshot: SensorSnapshot = {
      ...nextSnapshot,
      ble: {
        ...nextSnapshot.ble,
        packetType,
        payloadSizeKb: packet.payloadSizeKb,
        lastSyncTime: packet.createdAt
      }
    };

    setLatestPacket(packet);
    setSnapshot(uiSnapshot);
    appendLog({
      title: `${packetType} packet built`,
      detail: `${packet.packetId}｜seq ${packet.sequence}｜${packet.payloadSizeKb} KB`,
      tone: "info"
    });

    const transport = await bleTransportRef.current.send(packet);
    setTransportResult(transport);

    if (!transport.ok) {
      const bufferedSnapshot: SensorSnapshot = refreshSignal({
        ...uiSnapshot,
        sync: {
          ...uiSnapshot.sync,
          bufferedPacketCount: bleTransportRef.current.getBufferedPacketCount()
        },
        feedback: {
          acknowledgementStatus: transport.acknowledgementStatus
        }
      });
      setSnapshot(bufferedSnapshot);
      setRisk(calculateRisk(bufferedSnapshot));
      appendLog({
        title: "BLE retrying",
        detail: transport.error ?? "packet buffered locally",
        tone: "warn"
      });
      return;
    }

    const gatewaySnapshot: SensorSnapshot = refreshSignal({
      ...uiSnapshot,
      sync: {
        ...uiSnapshot.sync,
        bufferedPacketCount: bleTransportRef.current.getBufferedPacketCount()
      },
      feedback: {
        acknowledgementStatus: "gateway_ack"
      }
    });
    setSnapshot(gatewaySnapshot);
    appendLog({
      title: "Gateway ACK",
      detail: `${packet.packetId} received through GATT notify/write`,
      tone: "info"
    });

    await delay(180);
    const response = backendRef.current.ingestWearablePacket(packet);
    setBackendResponse(response);
    setRisk(response.risk);
    setCriticalEvents(backendRef.current.getCriticalEvents());
    setSnapshot(refreshSignal({
      ...gatewaySnapshot,
      sync: {
        ...gatewaySnapshot.sync,
        packetDelay: response.packetDelay,
        lastSyncTime: response.serverReceivedAt
      },
      feedback: {
        acknowledgementStatus: response.acknowledgementStatus
      }
    }));
    appendLog({
      title: response.staleData ? "Server ACK historical" : "Server ACK latest-risk",
      detail: response.message,
      tone: response.staleData ? "warn" : "ok"
    });
  }

  async function runScenario(label: string, nextSnapshot: SensorSnapshot, packetType: PacketType) {
    setIsRunning(true);
    try {
      appendLog({
        title: label,
        detail: "SensorSnapshot updated by demo control",
        tone: "info"
      });
      await transmit(nextSnapshot, packetType);
    } finally {
      setIsRunning(false);
    }
  }

  async function simulateNormal() {
    bleTransportRef.current.setConnected(true);
    bleTransportRef.current.setUnstableMode(false);
    setBleConnected(true);
    await runScenario(
      "正常返家恢復",
      prepareSnapshot(patientId, {}, "vital_summary", "idle"),
      "vital_summary"
    );
  }

  async function simulateRecoveryFatigue() {
    bleTransportRef.current.setConnected(true);
    bleTransportRef.current.setUnstableMode(false);
    setBleConnected(true);
    await runScenario(
      "洗腎後疲倦但無立即危險",
      prepareSnapshot(
        patientId,
        {
          ppg: { hr: 82, pulseSignalQuality: 0.91, lastSyncTime: new Date().toISOString() },
          spo2: { spo2: 96, spo2SignalQuality: 0.9, lastSyncTime: new Date().toISOString() },
          accelerometer: {
            activityIndex: 14,
            activityDropPercent: 64,
            motionState: "no_motion"
          }
        },
        "vital_summary",
        "idle"
      ),
      "vital_summary"
    );
  }

  async function simulatePhysiologicalAnomaly() {
    bleTransportRef.current.setConnected(true);
    bleTransportRef.current.setUnstableMode(false);
    setBleConnected(true);
    await runScenario(
      "生理數值異常",
      prepareSnapshot(
        patientId,
        {
          ppg: { hr: 126, pulseSignalQuality: 0.93, lastSyncTime: new Date().toISOString() },
          spo2: { spo2: 90, spo2SignalQuality: 0.91, lastSyncTime: new Date().toISOString() },
          accelerometer: {
            activityIndex: 34,
            activityDropPercent: 18,
            motionState: "rest"
          }
        },
        "vital_summary",
        "idle"
      ),
      "vital_summary"
    );
  }

  async function simulatePoorSignal() {
    await runScenario(
      "訊號品質不良",
      prepareSnapshot(
        patientId,
        {
          ppg: { hr: null, pulseSignalQuality: 0.46, lastSyncTime: new Date().toISOString() },
          spo2: { spo2: null, spo2SignalQuality: 0.43, lastSyncTime: new Date().toISOString() }
        },
        "quality_update",
        "idle"
      ),
      "quality_update"
    );
  }

  async function simulateHighMotion() {
    await runScenario(
      "模擬高動作干擾",
      prepareSnapshot(
        patientId,
        {
          ppg: { hr: 96, pulseSignalQuality: 0.7, lastSyncTime: new Date().toISOString() },
          spo2: { spo2: 95, spo2SignalQuality: 0.68, lastSyncTime: new Date().toISOString() },
          accelerometer: {
            activityIndex: 88,
            activityDropPercent: 4,
            motionState: "high_motion"
          }
        },
        "quality_update",
        "idle"
      ),
      "quality_update"
    );
  }

  async function simulateActivityDrop() {
    await runScenario(
      "模擬活動量驟降",
      prepareSnapshot(
        patientId,
        {
          ppg: { hr: 122, pulseSignalQuality: 0.82, lastSyncTime: new Date().toISOString() },
          accelerometer: {
            activityIndex: 6,
            activityDropPercent: 68,
            motionState: "no_motion"
          }
        },
        "vital_summary",
        "idle"
      ),
      "vital_summary"
    );
  }

  async function simulateHelpButton() {
    setIsRunning(true);
    try {
      const createdAt = new Date().toISOString();
      const localSnapshot = prepareSnapshot(
        patientId,
        {
          helpEvent: {
            active: true,
            source: "bracelet_button",
            createdAt
          },
          feedback: {
            acknowledgementStatus: "local_received"
          }
        },
        "help_event",
        "local_received"
      );
      setSnapshot(localSnapshot);
      setRisk(calculateRisk(localSnapshot));
      appendLog({
        title: "local_received",
        detail: "短震 1 次 + LED 黃燈；GPIO interrupt immediately built help_event",
        tone: "warn"
      });
      await delay(260);
      await transmit(localSnapshot, "help_event");
    } finally {
      setIsRunning(false);
    }
  }

  async function simulateBleDisconnect() {
    bleTransportRef.current.setConnected(false);
    setBleConnected(false);
    const staleSyncTime = snapshot.sync.lastSyncTime;
    await runScenario(
      "模擬 BLE 斷線",
      refreshSignal({
        ...snapshot,
        timestamp: new Date().toISOString(),
        ble: {
          ...snapshot.ble,
          packetType: "vital_summary",
          lastSyncTime: staleSyncTime
        },
        sync: {
          ...snapshot.sync,
          lastSyncTime: staleSyncTime,
          packetDelay: snapshot.sync.packetDelay
        },
        feedback: {
          acknowledgementStatus: "retrying"
        }
      }),
      "vital_summary"
    );
  }

  async function simulateBleRestore() {
    setIsRunning(true);
    try {
      bleTransportRef.current.setConnected(true);
      setBleConnected(true);
      const flushedPackets = await bleTransportRef.current.flushBufferedPackets();
      const batchSnapshot = prepareSnapshot(
        patientId,
        {
          ...snapshot,
          sync: {
            bufferedPacketCount: 0,
            lastSyncTime: snapshot.sync.lastSyncTime,
            packetDelay: 90_000
          },
          feedback: {
            acknowledgementStatus: "gateway_ack"
          }
        },
        "buffered_batch",
        "gateway_ack"
      );
      appendLog({
        title: "BLE restored",
        detail: `${flushedPackets.length} buffered packet(s) flushed before buffered_batch upload`,
        tone: flushedPackets.length ? "info" : "warn"
      });
      await transmit(batchSnapshot, "buffered_batch");
    } finally {
      setIsRunning(false);
    }
  }

  function simulateServerAck() {
    if (!latestPacket) {
      appendLog({
        title: "server_ack unavailable",
        detail: "No packet has been built yet",
        tone: "warn"
      });
      return;
    }
    const response = backendRef.current.ingestWearablePacket(latestPacket);
    setBackendResponse(response);
    setRisk(response.risk);
    setCriticalEvents(backendRef.current.getCriticalEvents());
    setSnapshot({
      ...snapshot,
      feedback: {
        acknowledgementStatus: response.acknowledgementStatus
      }
    });
    appendLog({
      title: "Manual server_ack",
      detail: response.message,
      tone: response.duplicate ? "warn" : "ok"
    });
  }

  function acknowledgeFirstEvent() {
    const event = criticalEvents.find((item) => item.status === "open");
    if (!event) return;
    backendRef.current.acknowledgeEvent(event.id);
    setCriticalEvents(backendRef.current.getCriticalEvents());
    appendLog({
      title: "critical event acknowledged",
      detail: `${event.id} marked as acknowledged by care dashboard`,
      tone: "ok"
    });
  }

  const feedbackCue = feedbackCueFor(snapshot, bleConnected);
  const flowNodes: FlowNodeState[] = [
    {
      icon: Watch,
      title: "PPG / SpO2 / 加速度 / 求助鍵",
      status: `${snapshot.ppg.hr ?? "--"} bpm / ${snapshot.spo2.spo2 ?? "--"}%`,
      helper: `motion ${snapshot.accelerometer.motionState}`,
      role: "原始資料來源",
      detail: "收集使用者生命徵象、活動狀態與主動求助事件，先留在手環端等待 MCU 彙整。",
      tone: statusTone(snapshot.signal.dataQuality)
    },
    {
      icon: Cpu,
      title: "MCU Sensor Aggregator",
      status: "SensorSnapshot",
      helper: `q ${snapshot.signal.signalQuality}`,
      role: "手環端資料彙整器",
      detail: "把不同感測器統一成同一個時間點的 SensorSnapshot，避免後端收到彼此不同步的零散資料。",
      tone: statusTone(snapshot.signal.dataQuality)
    },
    {
      icon: ShieldAlert,
      title: "Signal Quality Engine",
      status: snapshot.signal.signalStatus,
      helper: snapshot.signal.dataQuality,
      role: "資料可信度檢查",
      detail: "在送出前判斷佩戴不良、訊號過低、資料過期或數值不可信，低品質資料不直接造成誤報。",
      tone: statusTone(snapshot.signal.signalStatus)
    },
    {
      icon: Database,
      title: "Packet Builder",
      status: snapshot.ble.packetType,
      helper: `${snapshot.ble.payloadSizeKb} KB / checksum`,
      role: "封包建立器",
      detail: "將清洗後資料打包成 vital_summary、help_event、quality_update，加入 timestamp、checksum、deviceId、batteryLevel。",
      tone: "info"
    },
    {
      icon: Bluetooth,
      title: "BLE Transport",
      status: bleConnected ? "connected" : "disconnected",
      helper: snapshot.feedback.acknowledgementStatus,
      role: "低功耗傳輸層",
      detail: "負責封包傳送、ACK 確認、失敗重送與斷線等待；求助事件優先於一般生命徵象摘要。",
      tone: bleConnected ? statusTone(snapshot.feedback.acknowledgementStatus) : "warn"
    },
    {
      icon: Smartphone,
      title: "Gateway / Client",
      status: `${snapshot.sync.bufferedPacketCount} buffered`,
      helper: transportResult?.error ?? "pending upload queue ready",
      role: "手機或床邊接收端",
      detail: "接收 BLE 封包後送往後端 API；網路不穩時顯示 pending upload queue 並保留待上傳資料。",
      tone: snapshot.sync.bufferedPacketCount ? "warn" : "info"
    },
    {
      icon: ServerCog,
      title: "Backend Risk Engine",
      status: risk.level,
      helper: backendResponse?.message ?? mockWearableApiRoutes.ingest,
      role: "風險評估核心",
      detail: "根據生命徵象、活動下降、求助事件、資料品質與回應狀態計算風險，不只看單一數值。",
      tone: riskTone(risk.level)
    },
    {
      icon: RadioTower,
      title: "Care Dashboard",
      status: risk.requireHumanCheck ? "人工確認" : "例行監測",
      helper: `${criticalEvents.length} critical event(s)`,
      role: "照護端決策介面",
      detail: "把風險結果轉成事件卡、風險等級、建議處置、聯絡流程與處理狀態，讓照護人員能判斷下一步。",
      tone: risk.requireHumanCheck ? "danger" : "ok"
    }
  ];

  const dataQualityNeedsRetry = snapshot.signal.dataQuality === "poor" || snapshot.signal.dataQuality === "invalid";

  return (
    <section className="wearable-flow-demo" aria-label="手環資料流與 BLE 後端風險評估展示">
      <header className="wearable-demo-hero">
        <div>
          <span>Wearable BLE Architecture Demo</span>
          <h2>手環 → BLE → Gateway → 後端 → 照護端</h2>
          <p>
            {patientId}｜{displayName}｜所有 demo 控制都會更新 SensorSnapshot、建立 WearablePacket，並通過 BLE transport 與 mock ingest API。
          </p>
        </div>
        <aside className={`wearable-risk-chip tone-${riskTone(risk.level)}`}>
          <small>Risk Score</small>
          <strong>{risk.score}</strong>
          <span>{risk.level}</span>
        </aside>
      </header>

      <section className="wearable-section">
        <header className="wearable-section-title">
          <span>1</span>
          <div>
            <strong>手環模組狀態</strong>
            <p>所有感測模組先進 MCU 與 firmware aggregator，不直接送後端。</p>
          </div>
        </header>
        <div className="wearable-module-grid">
          <ModuleCard
            icon={HeartPulse}
            title="PPG 心率模組"
            subtitle="I2C / SPI / ADC → MCU"
            explanation={moduleExplanations.ppg}
            tone={statusTone(snapshot.signal.dataQuality)}
          >
            <Field label="hr" value={`${snapshot.ppg.hr ?? "--"} bpm`} />
            <Field label="pulseSignalQuality" value={snapshot.ppg.pulseSignalQuality.toFixed(2)} />
            <Field label="lastSyncTime" value={compactTime(snapshot.ppg.lastSyncTime)} />
          </ModuleCard>
          <ModuleCard
            icon={Activity}
            title="紅光 / 紅外光 SpO2"
            subtitle="optical sensor → Sensor Aggregator"
            explanation={moduleExplanations.spo2}
            tone={statusTone(snapshot.signal.dataQuality)}
          >
            <Field label="spo2" value={`${snapshot.spo2.spo2 ?? "--"}%`} />
            <Field label="spo2SignalQuality" value={snapshot.spo2.spo2SignalQuality.toFixed(2)} />
            <Field label="lastSyncTime" value={compactTime(snapshot.spo2.lastSyncTime)} />
          </ModuleCard>
          <ModuleCard
            icon={Activity}
            title="三軸加速度計"
            subtitle="activity + quality gating"
            explanation={moduleExplanations.accelerometer}
            tone={statusTone(snapshot.accelerometer.motionState)}
          >
            <Field label="activityIndex" value={snapshot.accelerometer.activityIndex} />
            <Field label="activityDropPercent" value={`${snapshot.accelerometer.activityDropPercent}%`} />
            <Field label="motionState" value={snapshot.accelerometer.motionState} />
          </ModuleCard>
          <ModuleCard
            icon={BellRing}
            title="實體求助按鍵"
            subtitle="GPIO interrupt → help_event"
            explanation={moduleExplanations.help}
            tone={snapshot.helpEvent.active ? "danger" : "ok"}
          >
            <Field label="helpEvent.active" value={String(snapshot.helpEvent.active)} />
            <Field label="helpEvent.source" value={snapshot.helpEvent.source} />
            <Field label="createdAt" value={snapshot.helpEvent.createdAt ? compactTime(snapshot.helpEvent.createdAt) : "standby"} />
          </ModuleCard>
          <ModuleCard
            icon={ShieldAlert}
            title="佩戴與訊號品質"
            subtitle="PPG + SpO2 + motion + delay"
            explanation={moduleExplanations.signal}
            tone={statusTone(snapshot.signal.dataQuality)}
          >
            <Field label="signalStatus" value={snapshot.signal.signalStatus} />
            <Field label="signalQuality" value={snapshot.signal.signalQuality.toFixed(2)} />
            <Field label="dataQuality" value={snapshot.signal.dataQuality} />
          </ModuleCard>
          <ModuleCard
            icon={Bluetooth}
            title="BLE 低功耗通訊"
            subtitle="GATT notify / write + ACK"
            explanation={moduleExplanations.ble}
            tone={bleConnected ? "info" : "warn"}
          >
            <Field label="payloadSizeKb" value={`${snapshot.ble.payloadSizeKb} KB`} />
            <Field label="packetType" value={snapshot.ble.packetType} />
            <Field label="lastSyncTime" value={compactTime(snapshot.ble.lastSyncTime)} />
            <Field label="connectionState" value={bleConnected ? "connected" : "disconnected"} />
          </ModuleCard>
          <ModuleCard
            icon={RefreshCcw}
            title="本地暫存與時間同步"
            subtitle="Local buffer + pending upload queue"
            explanation={moduleExplanations.sync}
            tone={snapshot.sync.bufferedPacketCount ? "warn" : "ok"}
          >
            <Field label="bufferedPacketCount" value={snapshot.sync.bufferedPacketCount} />
            <Field label="packetDelay" value={`${snapshot.sync.packetDelay} ms`} />
            <Field label="lastSyncTime" value={compactTime(snapshot.sync.lastSyncTime)} />
          </ModuleCard>
          <ModuleCard
            icon={CheckCircle2}
            title="震動 / LED 狀態提示"
            subtitle="MCU feedback output"
            explanation={moduleExplanations.feedback}
            tone={statusTone(snapshot.feedback.acknowledgementStatus)}
          >
            <Field label="acknowledgementStatus" value={snapshot.feedback.acknowledgementStatus} />
            <Field label="helpCue" value={feedbackCue.helpCue} />
            <Field label="ledState" value={feedbackCue.ledState} />
            <Field label="vibrationPattern" value={feedbackCue.vibrationPattern} />
          </ModuleCard>
        </div>
      </section>

      <section className="wearable-section">
        <header className="wearable-section-title">
          <span>2</span>
          <div>
            <strong>資料流視覺化</strong>
            <p>硬體模組不互相直連；資料經 MCU、Firmware Aggregator、BLE、Gateway、後端與照護端逐層處理。</p>
          </div>
        </header>
        <div className="wearable-flow-track">
          {flowNodes.map((node, index) => (
            <FlowNode key={`${node.title}-${index}`} step={index + 1} {...node} />
          ))}
        </div>
      </section>

      <PacketReliabilityDemo />

      <section className="wearable-section">
        <header className="wearable-section-title">
          <span>4</span>
          <div>
            <strong>從感測器到照護決策：不是單點警報，而是多因子風險矩陣</strong>
            <p>系統會先確認資料可信度，再把求助事件、生理摘要、活動下降、資料延遲與回應狀態合併判斷。</p>
          </div>
        </header>
        <div className="decision-logic-grid">
          {decisionLogicItems.map((item) => (
            <article key={item.title}>
              <code>{item.code}</code>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wearable-demo-grid">
        <section className="wearable-section">
          <header className="wearable-section-title">
            <span>5</span>
            <div>
              <strong>Demo 控制面板</strong>
              <p>每個按鈕都會改變資料狀態、封包、ACK、buffer 或風險分數。</p>
            </div>
          </header>
          <div className="wearable-control-grid">
            <button type="button" onClick={simulateNormal} disabled={isRunning}>
              <CheckCircle2 size={16} />
              正常返家恢復
            </button>
            <button type="button" onClick={simulateRecoveryFatigue} disabled={isRunning}>
              <RefreshCcw size={16} />
              洗腎後疲倦但無立即危險
            </button>
            <button type="button" onClick={simulatePhysiologicalAnomaly} disabled={isRunning}>
              <HeartPulse size={16} />
              生理數值異常
            </button>
            <button type="button" onClick={simulatePoorSignal} disabled={isRunning}>
              <Watch size={16} />
              訊號品質不良
            </button>
            <button type="button" onClick={simulateHighMotion} disabled={isRunning}>
              <Activity size={16} />
              高動作干擾
            </button>
            <button type="button" onClick={simulateActivityDrop} disabled={isRunning}>
              <AlertTriangle size={16} />
              進階：活動驟降 + 心率偏高
            </button>
            <button type="button" className="danger" onClick={simulateHelpButton} disabled={isRunning}>
              <BellRing size={16} />
              使用者主動求助
            </button>
            <button type="button" onClick={simulateBleDisconnect} disabled={isRunning}>
              <WifiOff size={16} />
              模擬 BLE 斷線
            </button>
            <button type="button" onClick={simulateBleRestore} disabled={isRunning}>
              <Bluetooth size={16} />
              模擬 BLE 恢復並補傳
            </button>
            <button type="button" onClick={simulateServerAck} disabled={isRunning}>
              <ServerCog size={16} />
              模擬後端收到 server_ack
            </button>
          </div>
          <div className="wearable-api-list" aria-label="mock API routes">
            {Object.values(mockWearableApiRoutes).map((route) => (
              <code key={route}>{route}</code>
            ))}
          </div>
        </section>

        <section className="wearable-section">
          <header className="wearable-section-title">
            <span>6</span>
            <div>
              <strong>照護端風險結果</strong>
              <p>風險結果由本地 mock backend 呼叫 riskEngine 計算，不在 UI 硬寫。</p>
            </div>
          </header>
          <div className={`care-result-card tone-${riskTone(risk.level)}`}>
            <div className="care-result-score">
              <span>riskScore</span>
              <strong>{risk.score}</strong>
              <b>0-100 分</b>
            </div>
            <div className="risk-output-panel">
              <dl className="risk-output-grid">
                <div>
                  <dt>riskLevel</dt>
                  <dd>{risk.level}</dd>
                </div>
                <div>
                  <dt>dataConfidence</dt>
                  <dd>{risk.dataConfidence}</dd>
                </div>
                <div>
                  <dt>recommendedAction</dt>
                  <dd>{risk.recommendedAction}</dd>
                </div>
                <div>
                  <dt>requireHumanCheck</dt>
                  <dd>{String(risk.requireHumanCheck)}</dd>
                </div>
              </dl>
              <div className="reason-code-strip" aria-label="reasonCodes">
                <span>reasonCodes</span>
                <div>
                  {risk.reasonCodes.map((code) => (
                    <code key={code}>{code}</code>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {snapshot.helpEvent.active || risk.level === "critical" ? (
            <article className="critical-alert-card">
              <BellRing size={18} />
              <div>
                <strong>紅色警報卡：需照護端人工確認</strong>
                <p>此為風險提示與照護協作事件，不是醫療診斷結論。</p>
              </div>
            </article>
          ) : null}
          {dataQualityNeedsRetry ? (
            <p className="invalid-quality-warning">
              目前生命徵象資料品質不足，系統僅能提示重新佩戴或人工確認，不應直接判斷生理異常。
            </p>
          ) : null}
          {snapshot.signal.signalStatus === "high_motion" ? (
            <p className="motion-warning">動作干擾，建議重新量測或等待穩定。</p>
          ) : null}
          {backendResponse?.staleData ? (
            <p className="motion-warning">已補傳，但非即時資料；僅進歷史紀錄，不觸發即時高風險警報。</p>
          ) : null}
          <ul className="risk-reason-feed">
            {risk.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <div className="critical-event-list">
            <header>
              <strong>critical event timeline</strong>
              <button type="button" onClick={acknowledgeFirstEvent} disabled={!criticalEvents.some((event) => event.status === "open")}>
                ACK first open event
              </button>
            </header>
            {criticalEvents.length ? (
              criticalEvents.map((event) => (
                <article key={event.id}>
                  <span>{compactTime(event.createdAt)}</span>
                  <b>{event.title}</b>
                  <small>{event.status}｜{event.message}</small>
                </article>
              ))
            ) : (
              <p>目前沒有 open critical event。</p>
            )}
          </div>
        </section>
      </section>

      <section className="wearable-section packet-log-section">
        <header className="wearable-section-title">
          <span>log</span>
          <div>
            <strong>封包 / ACK / 後端事件紀錄</strong>
            <p>{safetyCopy}</p>
          </div>
        </header>
        <div className="packet-log-grid">
          <article>
            <strong>latest packet</strong>
            <pre>{latestPacket ? JSON.stringify({
              packetId: latestPacket.packetId,
              sequence: latestPacket.sequence,
              packetType: latestPacket.packetType,
              timestamp: latestPacket.createdAt,
              deviceId: latestPacket.deviceId,
              batteryLevel: latestPacket.batteryLevel,
              payloadSizeKb: latestPacket.payloadSizeKb,
              checksum: latestPacket.checksum
            }, null, 2) : "No packet yet"}</pre>
          </article>
          <article>
            <strong>event log</strong>
            <ol>
              {packetLog.map((item, index) => (
                <li key={`${item.id}-${index}`} className={`tone-${item.tone}`}>
                  <span>{item.time}</span>
                  <b>{item.title}</b>
                  <small>{item.detail}</small>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>
    </section>
  );
}
