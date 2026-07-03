import type { WristbandCapability, WristbandModule } from "../domain/careWorkflowTypes";

export const mvpWristbandModules: WristbandModule[] = [
  {
    id: "ppg-hr",
    name: "PPG 心率感測模組",
    hardwareConcept: "green LED + photodiode optical sensor",
    purpose: "取得 HR / pulse trend。",
    required: true,
    dataFields: ["hr", "pulseSignalQuality", "lastSyncTime"],
    caveat: "PPG 受佩戴鬆緊、動作、皮膚接觸與末梢循環影響，僅作為趨勢與照護提醒資料。"
  },
  {
    id: "spo2-red-ir",
    name: "紅光 / 紅外光 SpO2 感測模組",
    hardwareConcept: "red LED + infrared LED + photodiode",
    purpose: "取得 SpO2 trend。",
    required: true,
    dataFields: ["spo2", "spo2SignalQuality", "lastSyncTime"],
    caveat: "手腕式 SpO2 可能受動作、佩戴位置與訊號品質影響，系統需標示資料品質，不作為診斷依據。"
  },
  {
    id: "accelerometer-3axis",
    name: "三軸加速度計",
    hardwareConcept: "3-axis accelerometer",
    purpose: "估算活動量、活動量下降、長時間低活動狀態。",
    required: true,
    dataFields: ["activityIndex", "activityDropPercent", "motionState", "inactiveDuration"],
    caveat: "活動量下降是行為與恢復狀態的輔助訊號，不等同於病情判定。"
  },
  {
    id: "physical-sos",
    name: "實體求助按鍵",
    hardwareConcept: "physical tactile SOS button",
    purpose: "讓患者主動觸發居家求助事件。",
    required: true,
    dataFields: ["helpEvent.active", "helpEvent.source", "helpEvent.createdAt", "helpEvent.priority"],
    caveat: "求助事件代表使用者主動回報，需要照護人員確認。"
  },
  {
    id: "signal-quality",
    name: "佩戴狀態與訊號品質判斷",
    hardwareConcept: "PPG signal quality, contact-quality algorithm, simplified contact detection",
    purpose: "標記資料品質，例如 normal / weak / offline。",
    required: true,
    dataFields: ["signalStatus", "signalQuality", "dataQuality"],
    caveat: "訊號品質差時，系統應降低信心並提示補測或人工確認，不應直接做高風險判定。"
  },
  {
    id: "ble-low-data",
    name: "BLE 低功耗通訊模組",
    hardwareConcept: "BLE SoC / MCU",
    purpose: "透過手機、平板、床邊 gateway 或居家 hub 傳送低資料量 telemetry packet。",
    required: true,
    dataFields: ["payloadSizeKb", "packetType", "lastSyncTime", "gatewayStatus"],
    caveat: "MVP 預設手環不直接連雲端，而是透過手機或居家 gateway 轉送資料。"
  },
  {
    id: "local-buffer-time-sync",
    name: "本地暫存與時間同步",
    hardwareConcept: "small flash buffer + RTC / gateway time sync",
    purpose: "網路不穩時暫存最近 telemetry，恢復連線後補送。",
    required: true,
    dataFields: ["bufferedPacketCount", "lastSyncTime", "packetDelay"],
    caveat: "延遲資料應標示時間戳，避免被誤認為即時狀態。"
  }
];

export const renalRecoveryWristbandCapability: WristbandCapability = {
  deviceClass: "lowDataRecoveryWristband",
  builtInModules: mvpWristbandModules,
  connectivity: {
    primary: "BLE",
    gatewayRequired: true,
    gatewayDescription: "透過手機、平板、床邊 gateway 或居家 hub 轉送低資料量封包。",
    offlineBuffer: true
  },
  feedbackOutputs: [
    {
      id: "haptic-led",
      name: "震動 / LED 狀態提示",
      purpose: "讓患者知道資料已送出、求助事件已建立、照護團隊已接收。",
      caveat: "回饋提示只代表系統收到事件，不代表醫療處置已完成。"
    }
  ],
  dataPolicy: {
    samplingMode: "periodic-plus-event",
    lowDataPayloadKb: 0.8,
    personallyIdentifiableDataMinimized: true
  },
  limitations: [
    "非診斷用途，僅作為照護協作與風險提醒展示。",
    "不宣稱連續血壓量測、醫療級 ECG 診斷、血糖量測或透析機數據直接讀取。",
    "資料品質有限時需標示信心並建議照護人員確認。"
  ]
};
