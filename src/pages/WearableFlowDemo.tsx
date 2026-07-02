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
  tone: Tone;
}

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
  tone,
  children
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
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
    </article>
  );
}

function FlowNode({
  icon: Icon,
  title,
  status,
  helper,
  tone
}: {
  icon: LucideIcon;
  title: string;
  status: string;
  helper: string;
  tone: Tone;
}) {
  return (
    <article className={`wearable-flow-node tone-${tone}`}>
      <span aria-hidden="true">
        <Icon size={18} />
      </span>
      <strong>{title}</strong>
      <b>{status}</b>
      <small>{helper}</small>
    </article>
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
      "模擬正常資料",
      prepareSnapshot(patientId, {}, "vital_summary", "idle"),
      "vital_summary"
    );
  }

  async function simulateLooseWear() {
    await runScenario(
      "模擬佩戴鬆脫",
      prepareSnapshot(
        patientId,
        {
          ppg: { hr: null, pulseSignalQuality: 0.18, lastSyncTime: new Date().toISOString() },
          spo2: { spo2: null, spo2SignalQuality: 0.22, lastSyncTime: new Date().toISOString() }
        },
        "signal_status",
        "idle"
      ),
      "signal_status"
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
        "signal_status",
        "idle"
      ),
      "signal_status"
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

  const flowNodes: FlowNodeState[] = [
    {
      icon: Watch,
      title: "PPG / SpO2 / 加速度 / 求助鍵",
      status: `${snapshot.ppg.hr ?? "--"} bpm / ${snapshot.spo2.spo2 ?? "--"}%`,
      helper: `motion ${snapshot.accelerometer.motionState}`,
      tone: statusTone(snapshot.signal.dataQuality)
    },
    {
      icon: Cpu,
      title: "MCU Sensor Aggregator",
      status: "SensorSnapshot",
      helper: `q ${snapshot.signal.signalQuality}`,
      tone: statusTone(snapshot.signal.dataQuality)
    },
    {
      icon: ShieldAlert,
      title: "Signal Quality Engine",
      status: snapshot.signal.signalStatus,
      helper: snapshot.signal.dataQuality,
      tone: statusTone(snapshot.signal.signalStatus)
    },
    {
      icon: Database,
      title: "Packet Builder",
      status: snapshot.ble.packetType,
      helper: `${snapshot.ble.payloadSizeKb} KB / checksum`,
      tone: "info"
    },
    {
      icon: Bluetooth,
      title: "BLE Transport",
      status: bleConnected ? "connected" : "disconnected",
      helper: snapshot.feedback.acknowledgementStatus,
      tone: bleConnected ? statusTone(snapshot.feedback.acknowledgementStatus) : "warn"
    },
    {
      icon: Smartphone,
      title: "Gateway / Client",
      status: `${snapshot.sync.bufferedPacketCount} buffered`,
      helper: transportResult?.error ?? "pending upload queue ready",
      tone: snapshot.sync.bufferedPacketCount ? "warn" : "info"
    },
    {
      icon: ServerCog,
      title: "Backend Risk Engine",
      status: risk.level,
      helper: backendResponse?.message ?? mockWearableApiRoutes.ingest,
      tone: riskTone(risk.level)
    },
    {
      icon: RadioTower,
      title: "Care Dashboard",
      status: risk.requireHumanCheck ? "人工確認" : "例行監測",
      helper: `${criticalEvents.length} critical event(s)`,
      tone: risk.requireHumanCheck ? "danger" : "ok"
    }
  ];

  const dataQualityInvalid = snapshot.signal.dataQuality === "invalid";

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
          <ModuleCard icon={HeartPulse} title="PPG 心率模組" subtitle="I2C / SPI / ADC → MCU" tone={statusTone(snapshot.signal.dataQuality)}>
            <Field label="hr" value={`${snapshot.ppg.hr ?? "--"} bpm`} />
            <Field label="pulseSignalQuality" value={snapshot.ppg.pulseSignalQuality.toFixed(2)} />
            <Field label="lastSyncTime" value={compactTime(snapshot.ppg.lastSyncTime)} />
          </ModuleCard>
          <ModuleCard icon={Activity} title="紅光 / 紅外光 SpO2" subtitle="optical sensor → Sensor Aggregator" tone={statusTone(snapshot.signal.dataQuality)}>
            <Field label="spo2" value={`${snapshot.spo2.spo2 ?? "--"}%`} />
            <Field label="spo2SignalQuality" value={snapshot.spo2.spo2SignalQuality.toFixed(2)} />
            <Field label="lastSyncTime" value={compactTime(snapshot.spo2.lastSyncTime)} />
          </ModuleCard>
          <ModuleCard icon={Activity} title="三軸加速度計" subtitle="activity + quality gating" tone={statusTone(snapshot.accelerometer.motionState)}>
            <Field label="activityIndex" value={snapshot.accelerometer.activityIndex} />
            <Field label="activityDropPercent" value={`${snapshot.accelerometer.activityDropPercent}%`} />
            <Field label="motionState" value={snapshot.accelerometer.motionState} />
          </ModuleCard>
          <ModuleCard icon={BellRing} title="實體求助按鍵" subtitle="GPIO interrupt → help_event" tone={snapshot.helpEvent.active ? "danger" : "ok"}>
            <Field label="helpEvent.active" value={String(snapshot.helpEvent.active)} />
            <Field label="helpEvent.source" value={snapshot.helpEvent.source} />
            <Field label="createdAt" value={snapshot.helpEvent.createdAt ? compactTime(snapshot.helpEvent.createdAt) : "standby"} />
          </ModuleCard>
          <ModuleCard icon={ShieldAlert} title="佩戴與訊號品質" subtitle="PPG + SpO2 + motion + delay" tone={statusTone(snapshot.signal.dataQuality)}>
            <Field label="signalStatus" value={snapshot.signal.signalStatus} />
            <Field label="signalQuality" value={snapshot.signal.signalQuality.toFixed(2)} />
            <Field label="dataQuality" value={snapshot.signal.dataQuality} />
          </ModuleCard>
          <ModuleCard icon={Bluetooth} title="BLE 低功耗通訊" subtitle="GATT notify / write + ACK" tone={bleConnected ? "info" : "warn"}>
            <Field label="payloadSizeKb" value={`${snapshot.ble.payloadSizeKb} KB`} />
            <Field label="packetType" value={snapshot.ble.packetType} />
            <Field label="lastSyncTime" value={compactTime(snapshot.ble.lastSyncTime)} />
          </ModuleCard>
          <ModuleCard icon={RefreshCcw} title="本地暫存與時間同步" subtitle="Local buffer + pending upload queue" tone={snapshot.sync.bufferedPacketCount ? "warn" : "ok"}>
            <Field label="bufferedPacketCount" value={snapshot.sync.bufferedPacketCount} />
            <Field label="packetDelay" value={`${snapshot.sync.packetDelay} ms`} />
            <Field label="lastSyncTime" value={compactTime(snapshot.sync.lastSyncTime)} />
          </ModuleCard>
          <ModuleCard icon={CheckCircle2} title="震動 / LED 狀態提示" subtitle="MCU feedback output" tone={statusTone(snapshot.feedback.acknowledgementStatus)}>
            <Field label="acknowledgementStatus" value={snapshot.feedback.acknowledgementStatus} />
            <Field label="help cue" value={snapshot.helpEvent.active ? "3 次震動 / 人工確認" : "idle"} />
            <Field label="BLE state" value={bleConnected ? "connected" : "retrying"} />
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
            <FlowNode key={`${node.title}-${index}`} {...node} />
          ))}
        </div>
      </section>

      <section className="wearable-demo-grid">
        <section className="wearable-section">
          <header className="wearable-section-title">
            <span>3</span>
            <div>
              <strong>Demo 控制面板</strong>
              <p>每個按鈕都會改變資料狀態、封包、ACK、buffer 或風險分數。</p>
            </div>
          </header>
          <div className="wearable-control-grid">
            <button type="button" onClick={simulateNormal} disabled={isRunning}>
              <CheckCircle2 size={16} />
              模擬正常資料
            </button>
            <button type="button" onClick={simulateLooseWear} disabled={isRunning}>
              <Watch size={16} />
              模擬佩戴鬆脫
            </button>
            <button type="button" onClick={simulateHighMotion} disabled={isRunning}>
              <Activity size={16} />
              模擬高動作干擾
            </button>
            <button type="button" onClick={simulateActivityDrop} disabled={isRunning}>
              <AlertTriangle size={16} />
              模擬活動量驟降
            </button>
            <button type="button" className="danger" onClick={simulateHelpButton} disabled={isRunning}>
              <BellRing size={16} />
              模擬按下求助鍵
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
            <span>4</span>
            <div>
              <strong>照護端風險結果</strong>
              <p>風險結果由本地 mock backend 呼叫 riskEngine 計算，不在 UI 硬寫。</p>
            </div>
          </header>
          <div className={`care-result-card tone-${riskTone(risk.level)}`}>
            <div className="care-result-score">
              <span>risk score</span>
              <strong>{risk.score}</strong>
              <b>{risk.level}</b>
            </div>
            <div>
              <span>recommendedAction</span>
              <p>{risk.recommendedAction}</p>
              <em>{risk.requireHumanCheck ? "requireHumanCheck = true" : "requireHumanCheck = false"}</em>
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
          {dataQualityInvalid ? (
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
