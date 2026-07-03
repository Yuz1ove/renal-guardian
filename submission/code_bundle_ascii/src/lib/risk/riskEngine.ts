import type { SensorSnapshot } from "../../types/wearable";

export interface RiskResult {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  reasons: string[];
  reasonCodes: string[];
  recommendedAction: string;
  requireHumanCheck: boolean;
  dataConfidence: "high" | "medium" | "low";
}

function dataConfidenceFor(snapshot: SensorSnapshot): RiskResult["dataConfidence"] {
  if (
    snapshot.signal.dataQuality === "poor" ||
    snapshot.signal.dataQuality === "invalid" ||
    snapshot.signal.signalStatus === "offline" ||
    snapshot.sync.packetDelay > 60_000
  ) {
    return "low";
  }

  if (
    snapshot.signal.dataQuality === "fair" ||
    snapshot.signal.signalStatus === "high_motion" ||
    snapshot.signal.signalStatus === "stale_data"
  ) {
    return "medium";
  }

  return "high";
}

export function calculateRisk(snapshot: SensorSnapshot): RiskResult {
  let score = 0;
  const reasons: string[] = [];
  const reasonCodes: string[] = [];

  const dataConfidence = dataConfidenceFor(snapshot);
  const dataUsable = dataConfidence !== "low";

  if (snapshot.helpEvent.active) {
    score += 55;
    reasons.push("使用者已按下實體求助鍵");
    reasonCodes.push("HELP_EVENT_ACTIVE");
  }

  if (snapshot.accelerometer.motionState === "possible_fall") {
    score += 30;
    reasons.push("加速度資料顯示疑似跌倒或劇烈姿態變化，需人工確認");
    reasonCodes.push("POSSIBLE_FALL");
  }

  if (snapshot.accelerometer.motionState === "no_motion") {
    score += 15;
    reasons.push("偵測到長時間低活動或無動作狀態");
    reasonCodes.push("NO_MOTION");
  }

  if (snapshot.accelerometer.motionState === "high_motion") {
    score += 6;
    reasons.push("動作干擾使 PPG / SpO2 可信度下降，建議重新量測或等待穩定");
    reasonCodes.push("HIGH_MOTION");
  }

  if (snapshot.accelerometer.activityDropPercent >= 60) {
    score += 22;
    reasons.push("活動量相對個人基準明顯下降");
    reasonCodes.push("ACTIVITY_DROP");
  }

  let hasPhysiologyAnomaly = false;

  if (dataUsable && snapshot.ppg.hr !== null) {
    if (snapshot.ppg.hr >= 120) {
      score += 35;
      reasons.push("心率摘要偏高，需結合症狀與人工確認");
      reasonCodes.push("HR_ELEVATED");
      hasPhysiologyAnomaly = true;
    }

    if (snapshot.ppg.hr <= 45) {
      score += 35;
      reasons.push("心率摘要偏低，需結合症狀與人工確認");
      reasonCodes.push("HR_LOW");
      hasPhysiologyAnomaly = true;
    }
  }

  if (dataUsable && snapshot.spo2.spo2 !== null) {
    if (snapshot.spo2.spo2 < 92) {
      score += 40;
      reasons.push("血氧摘要偏低，但需確認佩戴與訊號品質");
      reasonCodes.push("SPO2_LOW");
      hasPhysiologyAnomaly = true;
    }
  }

  if (hasPhysiologyAnomaly && dataConfidence === "high") {
    score = Math.max(score, 60);
  }

  if (snapshot.signal.dataQuality === "poor") {
    score += 8;
    reasons.push("感測資料品質不佳，需重新佩戴或人工確認");
    reasonCodes.push("SIGNAL_POOR");
  }

  if (snapshot.signal.dataQuality === "invalid") {
    score += 5;
    reasons.push("生命徵象資料無效，系統不能做強判斷");
    reasonCodes.push("DATA_INVALID");
  }

  if (snapshot.sync.packetDelay > 60_000) {
    score += 6;
    reasons.push("資料延遲過高，可能不是即時狀態");
    reasonCodes.push("DATA_STALE");
  }

  score = Math.max(0, Math.min(100, score));
  if (snapshot.helpEvent.active) {
    score = Math.max(score, 85);
  }

  let level: RiskResult["level"] = "low";
  if (score >= 35) level = "medium";
  if (score >= 60) level = "high";
  if (score >= 80 || snapshot.helpEvent.active) level = "critical";

  let recommendedAction = "持續監測。";
  if (level === "medium") {
    recommendedAction = "提醒家屬或居服員確認。";
  }
  if (level === "high") {
    recommendedAction = "照護端主動聯絡使用者。";
  }
  if (level === "critical") {
    recommendedAction = "立即派案或通知緊急聯絡人。";
  }

  if (!reasons.length) {
    reasons.push("目前未觸發風險提示規則");
    reasonCodes.push("NO_ACTIVE_RULE");
  }

  return {
    score,
    level,
    reasons,
    reasonCodes,
    recommendedAction,
    requireHumanCheck: level === "high" || level === "critical",
    dataConfidence
  };
}
