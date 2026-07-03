import type { DemoMode } from "./scenePresets";

export const wearablePacket = {
  patientId: "A-203",
  hr: 52,
  spo2: 93,
  activityDrop: 31,
  battery: 78,
  signal: "weak",
  payloadSize: "0.8 KB",
  lastSeen: "17:08:42"
};

export const packetMetaByPatientId: Record<string, { payloadSize: string; signal: string; lastSeen: string }> = {
  a203: {
    payloadSize: "0.8 KB",
    signal: "弱訊號",
    lastSeen: "17:08:42"
  },
  a118: {
    payloadSize: "0.7 KB",
    signal: "可用",
    lastSeen: "17:14:08"
  },
  a076: {
    payloadSize: "0.6 KB",
    signal: "穩定",
    lastSeen: "17:20:31"
  }
};

export const bedsideHelpEvent = {
  eventType: "bedside_help",
  symptom: "頭暈、冒冷汗",
  userAction: "一鍵求助",
  priority: "urgent",
  createdAt: "17:09:12"
};

export const caregiverActions = ["立即關注", "通知家屬", "通知居服員", "需要時聯絡醫療團隊"];

export const modeNarratives: Record<DemoMode, { title: string; body: string; chips: string[] }> = {
  overview: {
    title: "串接總覽",
    body: "手環資料與床邊求助事件被轉成低資料量封包，經 API 與規則式風險引擎整理後，同步到照護隊列與回覆狀態。",
    chips: ["Data source", "Event source", "API / risk engine", "Feedback loop"]
  },
  wearable: {
    title: "手環低資料量監測",
    body: "手環只回傳必要趨勢、活動下降與訊號狀態，透過 BLE / gateway 送出低資料量 telemetry packet。",
    chips: ["HR trend", "SpO2 trend", "活動量", "0.8 KB payload", "signal quality"]
  },
  bedside: {
    title: "床邊求助事件",
    body: "患者虛弱、頭暈或冒冷汗時可主動求助，事件會以 event packet 進入風險引擎，並建議照護端確認。",
    chips: ["一鍵求助", "症狀回報", "event packet", "照護確認"]
  },
  team: {
    title: "照護團隊處理",
    body: "照護端依照風險分數、原因與事件狀態排序個案，顯示照護分級、分派狀態與回覆同步。",
    chips: ["最高優先級置頂", "照護隊列", "分派狀態", "狀態同步"]
  }
};

export const scoreBreakdownFooter = "最終分數上限封頂為 100";
