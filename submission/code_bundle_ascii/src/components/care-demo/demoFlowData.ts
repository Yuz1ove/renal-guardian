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
    title: "三端串接總覽",
    body: "手環資料與床邊求助事件被轉成低資料量封包，經 API 與規則式風險引擎整理後，同步到照護端 dashboard。",
    chips: ["手環資料", "床邊求助事件", "API / risk engine", "照護端 dashboard"]
  },
  wearable: {
    title: "手環低資料量監測",
    body: "手環只回傳必要生命徵象、活動下降、電量與訊號狀態，讓返家恢復期即使網路不穩也能把重點資料送出。",
    chips: ["HR / SpO2", "活動量", "0.8 KB payload", "弱訊號仍回傳"]
  },
  bedside: {
    title: "床邊求助事件",
    body: "患者夜間虛弱、頭暈或冒冷汗時可一鍵求助，事件會直接進入風險加權，並推送照護端處理。",
    chips: ["一鍵求助", "回報頭暈", "事件送出", "床邊求助 +40"]
  },
  team: {
    title: "照護端風險分流",
    body: "照護端依照風險分數、原因與事件狀態排序個案，顯示建議動作並協助分派照護人員處理 A-203。",
    chips: ["Critical 置頂", "照護隊列", "建議動作", "已分派照護人員"]
  }
};

export const scoreBreakdownFooter = "最終分數上限封頂為 100";
