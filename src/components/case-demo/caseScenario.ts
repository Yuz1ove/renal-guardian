export type RiskLevel = "low" | "medium" | "high" | "critical";
export type DataQuality = "good" | "fair" | "poor" | "invalid";
export type PatientResponseState = "normal" | "pending" | "no_response" | "help_pressed" | "resolved";
export type BleStatus = "idle" | "transmitting" | "acknowledged" | "retrying";
export type GatewayStatus = "idle" | "receiving" | "uploading" | "acked";
export type BackendStatus = "idle" | "processing" | "alerting" | "resolved";
export type EventStatus = "none" | "active" | "resolved";
export type FlowNodeStatus =
  | "idle"
  | "collecting"
  | "transmitting"
  | "processing"
  | "alerting"
  | "acknowledged"
  | "resolved";

export type FlowNodeId =
  | "patient"
  | "wearable"
  | "gateway"
  | "backend"
  | "riskEngine"
  | "dashboard"
  | "notification"
  | "arrival";

export type CareResponseStageId =
  | "anomaly_received"
  | "risk_scored"
  | "dashboard_alert"
  | "safety_check"
  | "no_response_or_help"
  | "notify_team"
  | "dispatch_started"
  | "arrived"
  | "resolved_record";

export type CodeLogTone = "normal" | "sync" | "risk" | "critical";

export interface RuntimeLogEntry {
  id: string;
  stepId: string;
  stepTitle: string;
  text: string;
  tone: CodeLogTone;
}

export interface CaseStep {
  id: string;
  title: string;
  description: string;
  durationMs: number;
  patientState: {
    locationState: string;
    posture: string;
    responseState: PatientResponseState;
  };
  wearable: {
    hr: number | null;
    spo2: number | null;
    activityIndex: number;
    activityDropPercent: number;
    motionState: string;
    signalQuality: number;
    dataQuality: DataQuality;
    packetType: string;
    acknowledgementStatus: string;
    helpEventActive: boolean;
    lastSyncTime: string;
  };
  transport: {
    bleStatus: BleStatus;
    gatewayStatus: GatewayStatus;
    backendStatus: BackendStatus;
  };
  risk: {
    score: number;
    level: RiskLevel;
    reasons: string[];
    recommendedAction: string;
  };
  careFlow: {
    currentStage: string;
    eventStatus: EventStatus;
  };
  flowStatuses: Record<FlowNodeId, FlowNodeStatus>;
  activeFlowSegments: number[];
  codeLogs: string[];
  alertTitle: string;
  alertBody: string;
  ackSequence?: string[];
}

export interface CareResponseStage {
  id: CareResponseStageId;
  label: string;
  detail: string;
}

export const riskLevelLabels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

export const riskLevelZhLabels: Record<RiskLevel, string> = {
  low: "低風險",
  medium: "中度風險",
  high: "高風險",
  critical: "最高優先"
};

export const dataQualityLabels: Record<DataQuality, string> = {
  good: "良好",
  fair: "可用",
  poor: "偏低",
  invalid: "無效"
};

export const motionStateLabels: Record<string, string> = {
  normal: "正常活動",
  rest: "休息中",
  no_motion: "長時間未動作"
};

export const responseStateLabels: Record<PatientResponseState, string> = {
  normal: "狀態穩定",
  pending: "等待回應",
  no_response: "未回應",
  help_pressed: "已按下求助",
  resolved: "已到場確認"
};

export const acknowledgementLabels: Record<string, string> = {
  local_received: "本地確認",
  gateway_ack: "Gateway ACK",
  server_ack: "Server ACK",
  none: "尚未確認"
};

export const flowStatusLabels: Record<FlowNodeStatus, string> = {
  idle: "idle",
  collecting: "collecting",
  transmitting: "transmitting",
  processing: "processing",
  alerting: "alerting",
  acknowledged: "acknowledged",
  resolved: "resolved"
};

export const careResponseStages: CareResponseStage[] = [
  {
    id: "anomaly_received",
    label: "系統收到異常",
    detail: "活動與生命徵象偏離個人基準"
  },
  {
    id: "risk_scored",
    label: "產生風險分數",
    detail: "Risk Engine 完成規則加權"
  },
  {
    id: "dashboard_alert",
    label: "照護端警報",
    detail: "Dashboard 顯示橘紅警示"
  },
  {
    id: "safety_check",
    label: "安全確認",
    detail: "請患者透過手環或床邊設備回應"
  },
  {
    id: "no_response_or_help",
    label: "未回應或求助",
    detail: "事件升級為主動確認"
  },
  {
    id: "notify_team",
    label: "通知照護團隊",
    detail: "家屬、居服員與醫護同步收到"
  },
  {
    id: "dispatch_started",
    label: "人員出發",
    detail: "建立到場處置流程"
  },
  {
    id: "arrived",
    label: "人員到達",
    detail: "現場確認患者狀況"
  },
  {
    id: "resolved_record",
    label: "事件解除留痕",
    detail: "保存處置紀錄與稽核 log"
  }
];

const idleFlow: Record<FlowNodeId, FlowNodeStatus> = {
  patient: "idle",
  wearable: "idle",
  gateway: "idle",
  backend: "idle",
  riskEngine: "idle",
  dashboard: "idle",
  notification: "idle",
  arrival: "idle"
};

export const caseScenario: CaseStep[] = [
  {
    id: "case-start",
    title: "Step 0：案例開始",
    description:
      "患者剛完成透析返家，初期狀態穩定。系統持續追蹤手環生命徵象、活動量、訊號品質與同步狀態。",
    durationMs: 4200,
    patientState: {
      locationState: "返家中",
      posture: "坐著休息",
      responseState: "normal"
    },
    wearable: {
      hr: 86,
      spo2: 97,
      activityIndex: 42,
      activityDropPercent: 0,
      motionState: "normal",
      signalQuality: 0.92,
      dataQuality: "good",
      packetType: "vital_summary",
      acknowledgementStatus: "server_ack",
      helpEventActive: false,
      lastSyncTime: "14:05:08"
    },
    transport: {
      bleStatus: "acknowledged",
      gatewayStatus: "acked",
      backendStatus: "processing"
    },
    risk: {
      score: 8,
      level: "low",
      reasons: ["透析返家初期持續監測", "生命徵象位於安全區間"],
      recommendedAction: "持續背景監測，不需主動介入。"
    },
    careFlow: {
      currentStage: "monitoring",
      eventStatus: "none"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "collecting",
      wearable: "collecting",
      gateway: "acknowledged",
      backend: "processing",
      riskEngine: "processing",
      dashboard: "acknowledged"
    },
    activeFlowSegments: [0, 1, 2, 3, 4],
    codeLogs: [
      "[Wearable] collectSensorSnapshot()",
      "[SignalQuality] signalQuality = 0.92",
      "[PacketBuilder] packetType = vital_summary",
      "[BLE] sending packet...",
      "[Gateway] ACK received",
      "[RiskEngine] riskLevel = low"
    ],
    alertTitle: "低風險背景監測",
    alertBody: "照護端保留紀錄與同步狀態，尚未產生警報。"
  },
  {
    id: "activity-drop",
    title: "Step 1：患者返家後活動量下降",
    description: "返家休息後，活動量開始下降。系統先不直接判定危險，而是記錄趨勢並等待更多訊號。",
    durationMs: 4400,
    patientState: {
      locationState: "家中休息",
      posture: "躺下休息",
      responseState: "normal"
    },
    wearable: {
      hr: 94,
      spo2: 96,
      activityIndex: 20,
      activityDropPercent: 45,
      motionState: "rest",
      signalQuality: 0.88,
      dataQuality: "good",
      packetType: "vital_summary",
      acknowledgementStatus: "server_ack",
      helpEventActive: false,
      lastSyncTime: "14:18:22"
    },
    transport: {
      bleStatus: "transmitting",
      gatewayStatus: "uploading",
      backendStatus: "processing"
    },
    risk: {
      score: 24,
      level: "low",
      reasons: ["活動量下降 45%", "未合併長時間無動作或求助事件"],
      recommendedAction: "紀錄活動下降趨勢，持續等待更多訊號。"
    },
    careFlow: {
      currentStage: "trend_logged",
      eventStatus: "none"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "collecting",
      wearable: "collecting",
      gateway: "transmitting",
      backend: "processing",
      riskEngine: "processing",
      dashboard: "acknowledged"
    },
    activeFlowSegments: [0, 1, 2, 3, 4],
    codeLogs: [
      "[Wearable] collectSensorSnapshot()",
      "[PacketBuilder] packetType = vital_summary",
      "[RiskEngine] score +8: activity drop trend recorded",
      "[RiskEngine] riskLevel remains low",
      "[CareFlow] no alert triggered"
    ],
    alertTitle: "活動下降趨勢",
    alertBody: "系統標記趨勢，但仍等待是否出現無動作、回應失敗或求助事件。"
  },
  {
    id: "no-motion",
    title: "Step 2：長時間低活動與狀態異常",
    description: "系統偵測到患者活動量明顯低於個人基準，且一段時間沒有明顯動作，風險分數開始上升。",
    durationMs: 4600,
    patientState: {
      locationState: "異常狀態",
      posture: "長時間未移動",
      responseState: "normal"
    },
    wearable: {
      hr: 108,
      spo2: 94,
      activityIndex: 8,
      activityDropPercent: 72,
      motionState: "no_motion",
      signalQuality: 0.82,
      dataQuality: "good",
      packetType: "vital_summary",
      acknowledgementStatus: "server_ack",
      helpEventActive: false,
      lastSyncTime: "14:32:41"
    },
    transport: {
      bleStatus: "transmitting",
      gatewayStatus: "uploading",
      backendStatus: "processing"
    },
    risk: {
      score: 52,
      level: "medium",
      reasons: ["活動量下降超過 60%", "motionState = no_motion", "心率較基準升高"],
      recommendedAction: "建議發送安全確認。"
    },
    careFlow: {
      currentStage: "risk_scored",
      eventStatus: "none"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "collecting",
      wearable: "collecting",
      gateway: "transmitting",
      backend: "processing",
      riskEngine: "processing",
      dashboard: "acknowledged"
    },
    activeFlowSegments: [0, 1, 2, 3, 4, 5],
    codeLogs: [
      "[RiskEngine] +15 activityDropPercent >= 60",
      "[RiskEngine] +15 no_motion detected",
      "[RiskEngine] riskLevel = medium",
      "[CareFlow] safety check recommended"
    ],
    alertTitle: "建議安全確認",
    alertBody: "照護端提示可發送安全確認，避免活動下降被誤判或延遲處理。"
  },
  {
    id: "safety-check",
    title: "Step 3：系統發出安全確認",
    description: "照護端系統自動發送安全確認，請患者透過手環震動、手機或床邊設備回應。",
    durationMs: 4800,
    patientState: {
      locationState: "等待確認",
      posture: "躺下休息",
      responseState: "pending"
    },
    wearable: {
      hr: 110,
      spo2: 94,
      activityIndex: 7,
      activityDropPercent: 74,
      motionState: "no_motion",
      signalQuality: 0.8,
      dataQuality: "good",
      packetType: "safety_check",
      acknowledgementStatus: "local_received",
      helpEventActive: false,
      lastSyncTime: "14:34:03"
    },
    transport: {
      bleStatus: "acknowledged",
      gatewayStatus: "acked",
      backendStatus: "alerting"
    },
    risk: {
      score: 58,
      level: "medium",
      reasons: ["中度風險達安全確認門檻", "患者回應狀態 pending"],
      recommendedAction: "等待患者於 30 秒內回應安全確認。"
    },
    careFlow: {
      currentStage: "safety_check",
      eventStatus: "none"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "alerting",
      wearable: "alerting",
      gateway: "acknowledged",
      backend: "alerting",
      riskEngine: "acknowledged",
      dashboard: "alerting"
    },
    activeFlowSegments: [4, 3, 2, 1, 0],
    codeLogs: [
      "[CareFlow] careAction = safety_check_sent",
      "[Dashboard] safety confirmation card pushed",
      "[Wearable] vibration pattern = check_in",
      "[Gateway] acknowledgementStatus = local_received",
      "[CareFlow] patientResponse = pending"
    ],
    alertTitle: "等待患者回應",
    alertBody: "安全確認已送出，手環震動與床邊設備同步提示。"
  },
  {
    id: "timeout",
    title: "Step 4：患者未回應，風險升高",
    description: "患者未在時間內回應安全確認，系統將事件升級，提醒照護端主動確認。",
    durationMs: 4300,
    patientState: {
      locationState: "異常狀態",
      posture: "疑似不適",
      responseState: "no_response"
    },
    wearable: {
      hr: 118,
      spo2: 92,
      activityIndex: 4,
      activityDropPercent: 81,
      motionState: "no_motion",
      signalQuality: 0.76,
      dataQuality: "fair",
      packetType: "vital_summary",
      acknowledgementStatus: "server_ack",
      helpEventActive: false,
      lastSyncTime: "14:37:35"
    },
    transport: {
      bleStatus: "transmitting",
      gatewayStatus: "uploading",
      backendStatus: "alerting"
    },
    risk: {
      score: 74,
      level: "high",
      reasons: ["安全確認逾時", "活動下降 81%", "SpO2 下降至 92%"],
      recommendedAction: "照護端主動確認，必要時通知家屬或照護人員。"
    },
    careFlow: {
      currentStage: "dashboard_alert",
      eventStatus: "active"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "alerting",
      wearable: "collecting",
      gateway: "transmitting",
      backend: "alerting",
      riskEngine: "alerting",
      dashboard: "alerting"
    },
    activeFlowSegments: [0, 1, 2, 3, 4, 5],
    codeLogs: [
      "[CareFlow] safety check timeout",
      "[RiskEngine] +12 no patient response",
      "[RiskEngine] riskLevel = high",
      "[Dashboard] high risk alert displayed"
    ],
    alertTitle: "高風險主動確認",
    alertBody: "患者未回應安全確認，照護端升級為橘紅警示。"
  },
  {
    id: "help-button",
    title: "Step 5：患者按下實體求助鍵",
    description: "患者按下手環實體求助鍵。求助事件優先於一般生命徵象封包，系統立即建立 critical event。",
    durationMs: 4300,
    patientState: {
      locationState: "異常狀態",
      posture: "疑似不適",
      responseState: "help_pressed"
    },
    wearable: {
      hr: 121,
      spo2: 91,
      activityIndex: 3,
      activityDropPercent: 83,
      motionState: "no_motion",
      signalQuality: 0.78,
      dataQuality: "fair",
      packetType: "help_event",
      acknowledgementStatus: "local_received",
      helpEventActive: true,
      lastSyncTime: "14:38:02"
    },
    transport: {
      bleStatus: "transmitting",
      gatewayStatus: "receiving",
      backendStatus: "alerting"
    },
    risk: {
      score: 95,
      level: "critical",
      reasons: ["實體求助鍵", "長時間低活動", "未回應安全確認"],
      recommendedAction: "立即建立 critical event，通知照護端與醫護人員。"
    },
    careFlow: {
      currentStage: "no_response_or_help",
      eventStatus: "active"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "alerting",
      wearable: "alerting",
      gateway: "transmitting",
      backend: "alerting",
      riskEngine: "alerting",
      dashboard: "alerting"
    },
    activeFlowSegments: [0, 1, 2, 3, 4, 5],
    codeLogs: [
      "[GPIO] bracelet help button pressed",
      "[PacketBuilder] create packetType = help_event",
      "[BLE] priority queue enabled",
      "[Gateway] help_event ACK received",
      "[Backend] createCriticalEvent()",
      "[RiskEngine] riskLevel = critical",
      "[Dashboard] push red alert card"
    ],
    alertTitle: "Critical 求助事件",
    alertBody: "求助鍵封包已進入 priority queue，照護端出現紅色事件卡。"
  },
  {
    id: "ack-cascade",
    title: "Step 6：BLE / Gateway / Server ACK 流程",
    description: "求助事件會依序取得本地確認、Gateway 確認與後端確認，讓患者知道求助訊號沒有遺失。",
    durationMs: 5000,
    patientState: {
      locationState: "等待確認",
      posture: "疑似不適",
      responseState: "help_pressed"
    },
    wearable: {
      hr: 120,
      spo2: 91,
      activityIndex: 3,
      activityDropPercent: 83,
      motionState: "no_motion",
      signalQuality: 0.79,
      dataQuality: "fair",
      packetType: "help_event",
      acknowledgementStatus: "local_received",
      helpEventActive: true,
      lastSyncTime: "14:38:08"
    },
    transport: {
      bleStatus: "acknowledged",
      gatewayStatus: "receiving",
      backendStatus: "alerting"
    },
    risk: {
      score: 95,
      level: "critical",
      reasons: ["help_event 已送達", "ACK 鏈正在回傳", "critical event 保持 active"],
      recommendedAction: "確認 ACK 完整回傳，維持 critical 處置。"
    },
    careFlow: {
      currentStage: "no_response_or_help",
      eventStatus: "active"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "alerting",
      wearable: "acknowledged",
      gateway: "acknowledged",
      backend: "alerting",
      riskEngine: "alerting",
      dashboard: "alerting"
    },
    activeFlowSegments: [1, 2, 3, 4],
    codeLogs: [
      "[Wearable] acknowledgementStatus = local_received",
      "[Gateway] ACK packetId received",
      "[Wearable] acknowledgementStatus = gateway_ack",
      "[Backend] server_ack returned",
      "[Wearable] acknowledgementStatus = server_ack"
    ],
    alertTitle: "求助 ACK 已回傳",
    alertBody: "患者端以震動與 LED 狀態確認訊號沒有遺失。",
    ackSequence: ["local_received", "gateway_ack", "server_ack"]
  },
  {
    id: "dispatch",
    title: "Step 7：照護端啟動處置流程",
    description: "照護端收到 critical event 後，系統建立事件紀錄，並啟動聯絡與到場處置流程。",
    durationMs: 4600,
    patientState: {
      locationState: "等待到場",
      posture: "疑似不適",
      responseState: "help_pressed"
    },
    wearable: {
      hr: 116,
      spo2: 92,
      activityIndex: 5,
      activityDropPercent: 78,
      motionState: "no_motion",
      signalQuality: 0.84,
      dataQuality: "fair",
      packetType: "help_event",
      acknowledgementStatus: "server_ack",
      helpEventActive: true,
      lastSyncTime: "14:39:24"
    },
    transport: {
      bleStatus: "acknowledged",
      gatewayStatus: "acked",
      backendStatus: "alerting"
    },
    risk: {
      score: 95,
      level: "critical",
      reasons: ["實體求助鍵", "長時間低活動", "未回應安全確認"],
      recommendedAction: "立即聯絡家屬 / 居服員 / 醫護人員，安排到場確認。"
    },
    careFlow: {
      currentStage: "dispatch_started",
      eventStatus: "active"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "alerting",
      wearable: "acknowledged",
      gateway: "acknowledged",
      backend: "alerting",
      riskEngine: "alerting",
      dashboard: "alerting",
      notification: "transmitting",
      arrival: "processing"
    },
    activeFlowSegments: [4, 5, 6],
    codeLogs: [
      "[EventStore] eventStatus = active",
      "[Notification] caregiver notified",
      "[Notification] medical staff notified",
      "[CareFlow] dispatch_started"
    ],
    alertTitle: "照護處置已啟動",
    alertBody: "事件卡顯示 critical、原因與建議處置，通知正在送達照護團隊。"
  },
  {
    id: "arrival-resolved",
    title: "Step 8：醫護人員或照護人員到達",
    description: "醫護人員或照護人員到達現場，確認患者狀況後，事件被標記為已處理。",
    durationMs: 4800,
    patientState: {
      locationState: "醫護到達",
      posture: "現場確認中",
      responseState: "resolved"
    },
    wearable: {
      hr: 98,
      spo2: 95,
      activityIndex: 18,
      activityDropPercent: 42,
      motionState: "rest",
      signalQuality: 0.9,
      dataQuality: "good",
      packetType: "care_response_update",
      acknowledgementStatus: "server_ack",
      helpEventActive: false,
      lastSyncTime: "14:48:10"
    },
    transport: {
      bleStatus: "acknowledged",
      gatewayStatus: "acked",
      backendStatus: "resolved"
    },
    risk: {
      score: 38,
      level: "medium",
      reasons: ["現場人員已確認", "生命徵象回穩", "事件保留紀錄"],
      recommendedAction: "事件標記為 resolved，後續追蹤恢復趨勢。"
    },
    careFlow: {
      currentStage: "resolved_record",
      eventStatus: "resolved"
    },
    flowStatuses: {
      ...idleFlow,
      patient: "resolved",
      wearable: "acknowledged",
      gateway: "acknowledged",
      backend: "resolved",
      riskEngine: "resolved",
      dashboard: "resolved",
      notification: "acknowledged",
      arrival: "resolved"
    },
    activeFlowSegments: [6],
    codeLogs: [
      "[CareTeam] arrived at patient location",
      "[Dashboard] event marked as resolved",
      "[EventStore] resolvedAt = currentTime",
      "[RiskEngine] riskLevel downgraded after human confirmation",
      "[AuditLog] care response record saved"
    ],
    alertTitle: "事件已處理",
    alertBody: "紅色警報改為已處理，系統保留完整處置紀錄。"
  }
];

export function getCareStageIndex(currentStage: string) {
  if (currentStage === "monitoring" || currentStage === "trend_logged") return -1;
  if (currentStage === "dashboard_alert") return 2;
  if (currentStage === "safety_check") return 3;
  if (currentStage === "no_response_or_help") return 4;
  if (currentStage === "dispatch_started") return 6;
  if (currentStage === "resolved_record") return 8;
  return careResponseStages.findIndex((stage) => stage.id === currentStage);
}

export function getLogTone(text: string): CodeLogTone {
  const lower = text.toLowerCase();
  if (
    lower.includes("critical") ||
    lower.includes("help") ||
    lower.includes("timeout") ||
    lower.includes("red alert") ||
    lower.includes("no patient response")
  ) {
    return "critical";
  }
  if (lower.includes("ack") || lower.includes("server_ack") || lower.includes("gateway") || lower.includes("local_received")) {
    return "sync";
  }
  if (lower.includes("riskengine") || lower.includes("score") || lower.includes("+")) {
    return "risk";
  }
  return "normal";
}

export function createRuntimeLogs(step: CaseStep, sessionId: number): RuntimeLogEntry[] {
  return step.codeLogs.map((text, index) => ({
    id: `${sessionId}-${step.id}-${index}`,
    stepId: step.id,
    stepTitle: step.title,
    text,
    tone: getLogTone(text)
  }));
}

export function buildLogsThroughStep(stepIndex: number, sessionId: number) {
  return caseScenario
    .slice(0, stepIndex + 1)
    .flatMap((step) => createRuntimeLogs(step, sessionId));
}

export function buildPacketSummary(step: CaseStep) {
  return {
    packetType: step.wearable.packetType,
    patientId: "demo-patient-001",
    deviceId: "shen-an-band-001",
    riskLevel: step.risk.level,
    acknowledgementStatus: step.wearable.acknowledgementStatus,
    dataQuality: step.wearable.dataQuality,
    signalQuality: step.wearable.signalQuality,
    helpEvent: {
      active: step.wearable.helpEventActive,
      source: step.wearable.helpEventActive ? "bracelet_button" : "none"
    }
  };
}

export function deriveRuntimeStep(step: CaseStep, progress: number): CaseStep {
  if (!step.ackSequence?.length) return step;

  const ackIndex = Math.min(step.ackSequence.length - 1, Math.floor(progress * step.ackSequence.length));
  const acknowledgementStatus = step.ackSequence[ackIndex] ?? step.wearable.acknowledgementStatus;
  const gatewayStatus: GatewayStatus = acknowledgementStatus === "local_received" ? "receiving" : "acked";
  const backendStatus: BackendStatus = acknowledgementStatus === "server_ack" ? "alerting" : "processing";

  return {
    ...step,
    wearable: {
      ...step.wearable,
      acknowledgementStatus
    },
    transport: {
      ...step.transport,
      gatewayStatus,
      backendStatus
    },
    flowStatuses: {
      ...step.flowStatuses,
      gateway: acknowledgementStatus === "local_received" ? "transmitting" : "acknowledged",
      backend: acknowledgementStatus === "server_ack" ? "alerting" : "processing"
    }
  };
}
