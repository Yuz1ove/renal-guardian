import type { SensorSnapshot } from "../../types/wearable";

export interface RiskResult {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  reasons: string[];
  recommendedAction: string;
  requireHumanCheck: boolean;
}

export function calculateRisk(snapshot: SensorSnapshot): RiskResult {
  let score = 0;
  const reasons: string[] = [];

  const dataUsable = snapshot.signal.dataQuality !== "invalid";

  if (snapshot.helpEvent.active) {
    score += 45;
    reasons.push("使用者已按下實體求助鍵");
  }

  if (snapshot.accelerometer.motionState === "possible_fall") {
    score += 30;
    reasons.push("加速度資料顯示疑似跌倒或劇烈姿態變化，需人工確認");
  }

  if (snapshot.accelerometer.motionState === "no_motion") {
    score += 15;
    reasons.push("偵測到長時間低活動或無動作狀態");
  }

  if (snapshot.accelerometer.motionState === "high_motion") {
    score += 6;
    reasons.push("動作干擾使 PPG / SpO2 可信度下降，建議重新量測或等待穩定");
  }

  if (snapshot.accelerometer.activityDropPercent >= 60) {
    score += 15;
    reasons.push("活動量相對個人基準明顯下降");
  }

  if (dataUsable && snapshot.ppg.hr !== null) {
    if (snapshot.ppg.hr >= 120) {
      score += 20;
      reasons.push("心率摘要偏高，需結合症狀與人工確認");
    }

    if (snapshot.ppg.hr <= 45) {
      score += 20;
      reasons.push("心率摘要偏低，需結合症狀與人工確認");
    }
  }

  if (dataUsable && snapshot.spo2.spo2 !== null) {
    if (snapshot.spo2.spo2 < 92) {
      score += 25;
      reasons.push("血氧摘要偏低，但需確認佩戴與訊號品質");
    }
  }

  if (snapshot.signal.dataQuality === "poor") {
    score += 8;
    reasons.push("感測資料品質不佳，需重新佩戴或人工確認");
  }

  if (snapshot.signal.dataQuality === "invalid") {
    score += 5;
    reasons.push("生命徵象資料無效，系統不能做強判斷");
  }

  if (snapshot.sync.packetDelay > 60_000) {
    score += 6;
    reasons.push("資料延遲過高，可能不是即時狀態");
  }

  score = Math.max(0, Math.min(100, score));

  let level: RiskResult["level"] = "low";
  if (score >= 35) level = "medium";
  if (score >= 60) level = "high";
  if (score >= 80 || snapshot.helpEvent.active) level = "critical";

  let recommendedAction = "持續觀察，維持例行監測";
  if (level === "medium") {
    recommendedAction = "請照護端檢查趨勢，必要時發送安全確認";
  }
  if (level === "high") {
    recommendedAction = "請照護端主動確認使用者狀態，啟動按鍵式安全回覆流程";
  }
  if (level === "critical") {
    recommendedAction = "立即通知照護者，開啟紅色警報卡與人工確認流程";
  }

  if (!reasons.length) {
    reasons.push("目前未觸發風險提示規則");
  }

  return {
    score,
    level,
    reasons,
    recommendedAction,
    requireHumanCheck: level === "high" || level === "critical"
  };
}
