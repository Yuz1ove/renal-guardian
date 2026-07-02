export type ModuleTone = "stable" | "sync" | "warning" | "critical";
export type DiagramKind = "bracelet" | "bedside" | "dashboard";

export interface AnnotationPosition {
  markerX: number;
  markerY: number;
  cardX: number;
  cardY: number;
  lineEndX: number;
  lineEndY: number;
}

export interface DeviceModule {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  fields: string[];
  description: string;
  riskImpact?: string;
  tone: ModuleTone;
  position: AnnotationPosition;
}

export interface FlowStep {
  id: string;
  label: string;
  detail: string;
}

export interface RiskMappingRow {
  source: string;
  trigger: string;
  delta: string;
  reason: string;
}

export const braceletModules: DeviceModule[] = [
  {
    id: "glass",
    index: 1,
    title: "強化玻璃 / 觸控螢幕",
    subtitle: "Tempered glass / touch cover",
    fields: ["touchState", "screenWakeState"],
    description: "最上層保護面板，讓患者可以看見 ACK 狀態並操作簡單確認。",
    riskImpact: "不直接加分；影響患者能否看到確認回饋。",
    tone: "stable",
    position: { markerX: 41, markerY: 31, cardX: 3, cardY: 8, lineEndX: 30, lineEndY: 8 }
  },
  {
    id: "oled",
    index: 2,
    title: "OLED 顯示面板",
    subtitle: "OLED display panel",
    fields: ["displayState", "acknowledgementStatus"],
    description: "顯示求助送出、等待確認、已接收等低文字量狀態。",
    riskImpact: "不直接加分；協助降低患者不確定感。",
    tone: "stable",
    position: { markerX: 41, markerY: 38, cardX: 3, cardY: 21, lineEndX: 30, lineEndY: 21 }
  },
  {
    id: "pcb",
    index: 3,
    title: "MCU / 本地風險預處理",
    subtitle: "Main PCB / microcontroller",
    fields: ["eventId", "patientId", "source", "riskPreprocessState"],
    description: "彙整感測、按鍵與通訊事件，將硬體訊號轉成後端可辨識的事件封包。",
    riskImpact: "間接影響；所有可計分事件都由此封裝。",
    tone: "sync",
    position: { markerX: 45, markerY: 48, cardX: 3, cardY: 34, lineEndX: 30, lineEndY: 34 }
  },
  {
    id: "ble",
    index: 4,
    title: "BLE 低功耗通訊模組",
    subtitle: "Bluetooth low energy module",
    fields: ["payloadSizeKb", "packetType", "lastSyncTime"],
    description: "以低資料量封包把手環資料送往手機、床邊呼叫器或 Gateway。",
    riskImpact: "影響資料延遲與可用性，弱網時會被列入資料品質。",
    tone: "sync",
    position: { markerX: 61, markerY: 48, cardX: 74, cardY: 8, lineEndX: 70, lineEndY: 8 }
  },
  {
    id: "buffer",
    index: 5,
    title: "本地暫存 / 時間同步",
    subtitle: "Local buffer / time sync",
    fields: ["bufferedPacketCount", "packetDelay", "lastSyncTime"],
    description: "弱網時暫存緊急封包與時間戳，恢復連線後補送。",
    riskImpact: "會影響資料品質與補包延遲原因。",
    tone: "sync",
    position: { markerX: 58, markerY: 55, cardX: 74, cardY: 21, lineEndX: 70, lineEndY: 21 }
  },
  {
    id: "battery",
    index: 6,
    title: "鋰電池",
    subtitle: "Lithium battery pack",
    fields: ["batteryLevel", "chargingState", "lowPowerMode"],
    description: "下層大面積電池提供手環運作，低電量時提醒照護端留意資料中斷風險。",
    riskImpact: "不直接加分；低電量會降低監測可靠度。",
    tone: "warning",
    position: { markerX: 58, markerY: 64, cardX: 74, cardY: 34, lineEndX: 70, lineEndY: 34 }
  },
  {
    id: "feedback",
    index: 7,
    title: "震動馬達 / LED 提示",
    subtitle: "Vibration motor / LED feedback",
    fields: ["acknowledgementStatus"],
    description: "送出求助或收到確認時以震動與 LED 提醒患者。",
    riskImpact: "不直接加分；回饋狀態可協助確認事件閉環。",
    tone: "stable",
    position: { markerX: 63, markerY: 62, cardX: 74, cardY: 58, lineEndX: 70, lineEndY: 58 }
  },
  {
    id: "accelerometer",
    index: 8,
    title: "三軸加速度計",
    subtitle: "3-axis accelerometer",
    fields: ["activityIndex", "activityDropPercent", "motionState"],
    description: "判斷活動量下降、長時間不動與疑似跌倒等返家恢復期異常。",
    riskImpact: "會影響活動量與恢復趨勢風險分數。",
    tone: "warning",
    position: { markerX: 61, markerY: 71, cardX: 74, cardY: 72, lineEndX: 70, lineEndY: 72 }
  },
  {
    id: "ppg",
    index: 9,
    title: "PPG 心率感測模組",
    subtitle: "Photoplethysmography heart-rate sensor",
    fields: ["hr", "pulseSignalQuality", "lastSyncTime"],
    description: "貼近皮膚的光學心率感測器，持續監測心率與訊號品質。",
    riskImpact: "會影響生理訊號風險分數。",
    tone: "stable",
    position: { markerX: 45, markerY: 78, cardX: 3, cardY: 58, lineEndX: 30, lineEndY: 58 }
  },
  {
    id: "spo2",
    index: 10,
    title: "SpO2 紅光 / 紅外光感測模組",
    subtitle: "Red / infrared oxygen sensor",
    fields: ["spo2", "spo2SignalQuality", "lastSyncTime"],
    description: "以紅光與紅外光讀取血氧趨勢，協助判斷呼吸不適或循環異常。",
    riskImpact: "會影響生理訊號風險分數。",
    tone: "warning",
    position: { markerX: 52, markerY: 79, cardX: 3, cardY: 72, lineEndX: 30, lineEndY: 72 }
  },
  {
    id: "help-button",
    index: 11,
    title: "實體按鍵 / 求助鍵",
    subtitle: "Tactile emergency button",
    fields: ["helpEvent.active", "helpEvent.source", "helpEvent.createdAt"],
    description: "側邊凸起按鍵讓患者在不舒服或無法操作手機時主動求助。",
    riskImpact: "會直接觸發求助事件風險加分。",
    tone: "critical",
    position: { markerX: 71, markerY: 48, cardX: 74, cardY: 86, lineEndX: 70, lineEndY: 86 }
  },
  {
    id: "shell",
    index: 12,
    title: "佩戴狀態與訊號品質",
    subtitle: "Waterproof gasket / enclosure",
    fields: ["signalStatus", "signalQuality", "dataQuality"],
    description: "外殼與密封圈保護內部電子件，底部接觸面也用來判斷佩戴與訊號可靠度。",
    riskImpact: "會影響資料品質與佩戴狀態判斷。",
    tone: "sync",
    position: { markerX: 30, markerY: 50, cardX: 3, cardY: 86, lineEndX: 30, lineEndY: 86 }
  }
];

export const bedsideModules: DeviceModule[] = [
  {
    id: "bedside-help",
    index: 1,
    title: "大型急救按鈕",
    subtitle: "Large SOS tactile button",
    fields: ["helpEvent.active", "helpEvent.source = bedside_button", "helpEvent.createdAt"],
    description: "中央大尺寸紅色按鈕，讓患者手抖、視力差或無法操作手機時仍能求助。",
    riskImpact: "會直接觸發求助事件，riskScore 至少 +35。",
    tone: "critical",
    position: { markerX: 39, markerY: 47, cardX: 3, cardY: 12, lineEndX: 30, lineEndY: 12 }
  },
  {
    id: "status-light",
    index: 2,
    title: "LED 狀態環",
    subtitle: "LED status ring",
    fields: ["ledState", "acknowledgementStatus"],
    description: "圍繞 SOS 按鈕顯示待確認、已送出、已接收等狀態。",
    riskImpact: "不直接加分；顯示事件確認狀態。",
    tone: "warning",
    position: { markerX: 62, markerY: 38, cardX: 74, cardY: 9, lineEndX: 70, lineEndY: 9 }
  },
  {
    id: "microphone",
    index: 3,
    title: "麥克風",
    subtitle: "Microphone module",
    fields: ["voiceSnippetStatus", "voiceSignalQuality"],
    description: "用於守望隊回撥或簡短語音確認，弱網時仍保留狀態欄位。",
    riskImpact: "不直接加分；語音品質會影響確認流程。",
    tone: "stable",
    position: { markerX: 39, markerY: 24, cardX: 3, cardY: 28, lineEndX: 30, lineEndY: 28 }
  },
  {
    id: "speaker",
    index: 4,
    title: "喇叭",
    subtitle: "Speaker driver",
    fields: ["speakerAckStatus", "acknowledgementStatus"],
    description: "播放確認提示、守望隊語音或簡短語音回饋。",
    riskImpact: "不直接加分；協助完成患者確認閉環。",
    tone: "stable",
    position: { markerX: 61, markerY: 24, cardX: 74, cardY: 28, lineEndX: 70, lineEndY: 28 }
  },
  {
    id: "bedside-pcb",
    index: 5,
    title: "主控 PCB / MCU",
    subtitle: "Main PCB / microcontroller",
    fields: ["eventId", "patientId", "helpEvent.createdAt", "ledState"],
    description: "將按鈕、語音、燈號與通訊狀態整理成事件封包。",
    riskImpact: "間接影響；所有床邊求助事件由此封裝。",
    tone: "sync",
    position: { markerX: 42, markerY: 65, cardX: 3, cardY: 60, lineEndX: 30, lineEndY: 60 }
  },
  {
    id: "bedside-network",
    index: 6,
    title: "BLE / Wi-Fi / LTE 備援通訊模組",
    subtitle: "Redundant communication module",
    fields: ["connectionPath", "packetRetryCount", "acknowledgementStatus"],
    description: "依現場網路切換傳輸方式，把求助事件送往 API。",
    riskImpact: "會影響封包延遲與資料品質原因。",
    tone: "sync",
    position: { markerX: 62, markerY: 64, cardX: 74, cardY: 60, lineEndX: 70, lineEndY: 60 }
  },
  {
    id: "bedside-buffer",
    index: 7,
    title: "本地暫存",
    subtitle: "Local packet cache",
    fields: ["bufferedPacketCount", "packetRetryCount", "helpEvent.createdAt"],
    description: "弱網時保留求助事件與最後狀態，恢復連線後補送。",
    riskImpact: "會影響補包延遲與可靠性標記。",
    tone: "sync",
    position: { markerX: 42, markerY: 78, cardX: 3, cardY: 77, lineEndX: 30, lineEndY: 77 }
  },
  {
    id: "bedside-battery",
    index: 8,
    title: "電池 / 插電狀態",
    subtitle: "Battery / power input",
    fields: ["batteryLevel", "powerSource"],
    description: "支援插電與備援電池，避免停電或插座鬆脫造成求助中斷。",
    riskImpact: "不直接加分；影響裝置可用性與資料可靠度。",
    tone: "warning",
    position: { markerX: 62, markerY: 78, cardX: 74, cardY: 77, lineEndX: 70, lineEndY: 77 }
  }
];

export const dashboardModules: DeviceModule[] = [
  {
    id: "patient-list",
    index: 1,
    title: "使用者即時狀態列表",
    subtitle: "Live monitored patients",
    fields: ["匿名 ID", "riskLevel", "hr", "spo2", "motionState", "lastSyncTime", "locationState"],
    description: "讓守望隊快速掃描多位患者的生命徵象、活動狀態、同步時間與位置狀態。",
    tone: "stable",
    position: { markerX: 20, markerY: 36, cardX: 5, cardY: 5, lineEndX: 20, lineEndY: 18 }
  },
  {
    id: "alert-queue",
    index: 2,
    title: "警報佇列",
    subtitle: "Risk queue workflow",
    fields: ["高風險", "中風險", "待確認", "已處理"],
    description: "警報不是跳出來就結束，而是進入可追蹤的處理流程。",
    tone: "warning",
    position: { markerX: 49, markerY: 33, cardX: 38, cardY: 5, lineEndX: 50, lineEndY: 18 }
  },
  {
    id: "risk-card",
    index: 3,
    title: "單一個案風險評估卡",
    subtitle: "Risk score decision card",
    fields: ["riskScore", "riskLevel", "triggerReasons", "recommendedAction"],
    description: "彙整血氧下降、活動量下降、實體求助、弱網延遲補包與長時間未回覆等原因。",
    tone: "critical",
    position: { markerX: 73, markerY: 40, cardX: 70, cardY: 5, lineEndX: 73, lineEndY: 19 }
  },
  {
    id: "conversation",
    index: 4,
    title: "對話／確認狀態區",
    subtitle: "Low-data safety confirmation",
    fields: ["守望隊傳送確認", "患者按鍵回覆", "riskScoreDelta"],
    description: "不是一般聊天軟體，而是低資料量安全確認流程。",
    tone: "sync",
    position: { markerX: 29, markerY: 75, cardX: 5, cardY: 70, lineEndX: 20, lineEndY: 76 }
  },
  {
    id: "gps-panel",
    index: 5,
    title: "GPS／位置確認區",
    subtitle: "Location confidence panel",
    fields: ["最近位置", "定位精度", "通知家屬／醫護"],
    description: "以簡化地圖卡呈現最近位置與定位精度，協助判斷是否通知家屬或醫護。",
    tone: "sync",
    position: { markerX: 68, markerY: 76, cardX: 70, cardY: 68, lineEndX: 72, lineEndY: 76 }
  },
  {
    id: "response-flow",
    index: 6,
    title: "處置流程區",
    subtitle: "Care response checklist",
    fields: ["偵測異常", "發送確認", "患者回覆", "更新風險", "通知守望隊", "聯絡醫護／家屬"],
    description: "將偵測、確認、風險更新與通知流程拆成可稽核的步驟。",
    tone: "stable",
    position: { markerX: 48, markerY: 82, cardX: 38, cardY: 72, lineEndX: 50, lineEndY: 78 }
  }
];

export const braceletPacketExample = {
  deviceId: "bracelet-A102",
  hr: 96,
  spo2: 93,
  motionState: "low_activity",
  helpEvent: {
    active: true,
    source: "physical_button"
  },
  signalQuality: "weak",
  packetType: "emergency_minimal",
  payloadSizeKb: 1.8
};

export const dataFlowSteps: FlowStep[] = [
  { id: "sensor", label: "手環感測資料", detail: "hr / spo2 / activityIndex / motionState / helpEvent" },
  { id: "packet", label: "低資料量封包", detail: "payloadSizeKb / packetType / bufferedPacketCount" },
  { id: "gateway", label: "手機 / 床邊呼叫器 / Gateway", detail: "weakNetworkMode / packetDelay / lastSyncTime" },
  { id: "api", label: "API 接收", detail: "eventId / patientId / source / createdAt" },
  { id: "engine", label: "風險評估引擎", detail: "riskScore / riskLevel / reasons[]" },
  { id: "dashboard", label: "守望隊後台", detail: "alertQueue / assignedCareWorker / acknowledgementStatus" },
  { id: "notify", label: "患者確認 / 家屬通知", detail: "voiceChannel / buttonReply / notificationStatus" }
];

export const riskMappingRows: RiskMappingRow[] = [
  { source: "血氧 SpO2", trigger: "低於 94%", delta: "+15", reason: "可能有呼吸不適或循環異常" },
  { source: "心率 HR", trigger: "高於 110 或低於 50", delta: "+10", reason: "可能出現心血管異常" },
  { source: "活動量", trigger: "較平常下降 60%", delta: "+10", reason: "可能虛弱、暈眩或長時間未移動" },
  { source: "求助按鍵", trigger: "被按下", delta: "+30", reason: "患者主動求助，優先級最高" },
  { source: "長時間未回覆", trigger: "超過 3 分鐘", delta: "+20", reason: "可能無法自行回應" },
  { source: "訊號弱但有補包", trigger: "封包延遲超過 60 秒", delta: "+5", reason: "需要標記資料可靠性風險" }
];
