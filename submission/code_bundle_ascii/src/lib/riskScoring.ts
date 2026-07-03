import type { BedsideCallPacket, Patient, RiskLevel, RiskResult, WearablePacket } from "../types";

const actionMap: Record<RiskLevel, string[]> = {
  stable: ["持續觀察", "維持一般返家休息紀錄"],
  attention: ["請家屬確認患者精神與活動狀態", "30 分鐘後再次檢查生命徵象"],
  warning: ["建議居服員或家屬主動聯繫", "確認是否有頭暈、冒冷汗、虛弱、跌倒風險"],
  critical: ["優先聯繫照護者", "若有跌倒、意識異常或持續不適，建議照護人員依既有流程確認", "必要時由照護人員協助聯絡相關單位"]
};

function levelFromScore(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "warning";
  if (score >= 25) return "attention";
  return "stable";
}

function hoursAfterDialysis(patient: Patient, now: Date) {
  const endedAt = new Date(patient.lastDialysisEndTime);
  return Math.max(0, (now.getTime() - endedAt.getTime()) / 36e5);
}

export function calculateRiskResult(
  patient: Patient,
  wearable: WearablePacket,
  bedside: BedsideCallPacket,
  now = new Date()
): RiskResult {
  let score = 0;
  const reasons: string[] = [];
  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(`${reason} +${points}`);
  };

  const hours = hoursAfterDialysis(patient, now);
  if (patient.dialysisDay && hours <= 6) add(15, "透析後 0-6 小時返家恢復期");
  else if (patient.dialysisDay && hours <= 12) add(8, "透析後 6-12 小時仍需觀察");

  if (wearable.heartRate > patient.baselineHeartRate + 20) add(12, "心率高於個人基準 20 bpm");
  if (wearable.heartRate < 55) add(15, "心率低於 55 bpm");
  if (wearable.systolicBP !== null && wearable.systolicBP < 90) add(20, "外部血壓計同步資料低於觀察門檻");
  if (wearable.activityIndex < 30) add(12, "活動指數低於 30");
  if (wearable.posture === "lying" && wearable.activityIndex < 35) add(10, "長時間躺臥且活動偏低");
  if (wearable.fallDetected) add(35, "手環偵測到跌倒事件");
  if (wearable.sosPressed) add(40, "手環 SOS 長按求助");
  if (bedside.longPressEmergency) add(45, "床邊呼叫器長按高優先求助");
  if (bedside.noResponseMinutes > 10) add(20, "呼叫後超過 10 分鐘未回應");
  if (!bedside.deviceOnline || wearable.signalQuality < 20) add(10, "裝置離線或訊號品質過低");
  if (bedside.battery < 15 || wearable.battery < 15) add(5, "裝置電量低於 15%");

  const boundedScore = Math.min(100, Math.round(score));
  const level = levelFromScore(boundedScore);

  return {
    patientId: patient.id,
    score: boundedScore,
    level,
    reasons: reasons.length ? reasons : ["目前未觸發風險加分規則"],
    recommendedActions: actionMap[level],
    updatedAt: now.toISOString()
  };
}

export function priorityFromRisk(level: RiskLevel) {
  if (level === "critical") return "urgent";
  if (level === "warning") return "high";
  if (level === "attention") return "medium";
  return "low";
}

export function sortWeight(level: RiskLevel) {
  return { critical: 4, warning: 3, attention: 2, stable: 1 }[level];
}
