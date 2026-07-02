export type RiskLevel = "stable" | "watch" | "warning" | "critical";

export interface PatientSignals {
  heartRate: number;
  spo2: number;
  activityDropPercent: number;
  hoursAfterDialysis: number;
  reportsDizziness: boolean;
  reportsColdSweat: boolean;
  bedsideHelpEvent: boolean;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
  recommendedAction: string;
}

const actionByLevel: Record<RiskLevel, string> = {
  stable: "例行觀察，持續記錄返家恢復期狀態",
  watch: "電話確認患者精神、活動與家屬照護狀態",
  warning: "安排照護團隊主動確認，追蹤是否有頭暈或冒冷汗",
  critical: "立即關注並確認是否需要聯絡家屬／醫護人員"
};

export function levelFromScore(score: number): RiskLevel {
  if (score >= 90) return "critical";
  if (score >= 70) return "warning";
  if (score >= 40) return "watch";
  return "stable";
}

export function calculateRisk(signals: PatientSignals): RiskResult {
  let score = 0;
  const reasons: string[] = [];

  function add(points: number, reason: string) {
    score += points;
    reasons.push(`${reason} +${points}`);
  }

  if (signals.heartRate < 55) add(15, "HR 低於個人基準");
  if (signals.spo2 < 94) add(15, "SpO2 低於 94%");
  if (signals.activityDropPercent > 20) add(20, "活動量較透析前下降 20%");
  if (signals.hoursAfterDialysis <= 6) add(10, "透析後 6 小時內返家恢復期");
  if (signals.reportsDizziness) add(15, "使用者回報頭暈");
  if (signals.reportsColdSweat) add(15, "使用者回報冒冷汗");
  if (signals.bedsideHelpEvent) add(40, "床邊求助事件");

  const boundedScore = Math.min(100, score);
  const level = levelFromScore(boundedScore);

  return {
    score: boundedScore,
    level,
    reasons: reasons.length ? reasons : ["目前未觸發風險加分規則"],
    recommendedAction: actionByLevel[level]
  };
}
