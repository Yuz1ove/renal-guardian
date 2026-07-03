import type {
  CareCase,
  DataQuality,
  RiskConfidence,
  RiskLevel,
  RiskReason,
  RiskResult
} from "./careWorkflowTypes";

export const riskLevelLabel: Record<RiskLevel, string> = {
  stable: "Stable",
  watch: "Watch",
  warning: "Warning",
  critical: "Critical"
};

export const riskLevelZhLabel: Record<RiskLevel, string> = {
  stable: "穩定",
  watch: "觀察",
  warning: "中度風險",
  critical: "最高照護協作優先級"
};

export const riskActionByLevel: Record<RiskLevel, string> = {
  stable: "例行觀察，持續記錄返家恢復期狀態。",
  watch: "排入觀察隊列，建議照護人員確認趨勢與資料品質。",
  warning: "30 分鐘內追蹤，建議照護人員確認多項返家恢復期風險訊號。",
  critical: "已進入最高照護協作優先級，建議照護人員確認並同步照護團隊。"
};

export const riskLevelWeight: Record<RiskLevel, number> = {
  stable: 1,
  watch: 2,
  warning: 3,
  critical: 4
};

export const riskCategoryCaps: Record<RiskReason["category"], number> = {
  physiological: 35,
  activityRecovery: 30,
  helpEvent: 45,
  dataQuality: 10
};

export const riskSafetyCopy = "本系統為照護協作與風險提醒展示，不作為診斷、治療或緊急醫療決策依據。";

export function mapRiskLevel(score: number): RiskLevel {
  const normalized = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  if (normalized >= 90) return "critical";
  if (normalized >= 70) return "warning";
  if (normalized >= 40) return "watch";
  return "stable";
}

export const levelFromScore = mapRiskLevel;

function severityFromPoints(points: number): RiskLevel {
  if (points >= 35) return "critical";
  if (points >= 20) return "warning";
  if (points >= 8) return "watch";
  return "stable";
}

function clampCategory(points: number, cap: number) {
  return Math.min(points, cap);
}

function isInRange(value: number | null, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function addReason(
  reasons: RiskReason[],
  id: string,
  category: RiskReason["category"],
  label: string,
  points: number,
  severity = severityFromPoints(points)
) {
  if (points <= 0 || reasons.some((reason) => reason.id === id)) return;
  reasons.push({ id, category, label, points, severity });
}

function symptomClusterMatches(careCase: CareCase) {
  const text = [
    ...(careCase.helpEvent?.symptoms ?? []),
    careCase.caregiverReport ?? ""
  ].join("、");
  const keywords = ["頭暈", "冒冷汗", "虛弱", "疲倦", "站立不穩"];
  return keywords.filter((keyword) => text.includes(keyword));
}

function validateTelemetry(careCase: CareCase) {
  const notes: string[] = [];
  const { telemetry } = careCase;

  const valid = {
    hr: isInRange(telemetry.hr, 30, 220),
    spo2: isInRange(telemetry.spo2, 70, 100),
    activityDropPercent: isInRange(telemetry.activityDropPercent, 0, 100),
    payloadSizeKb: Number.isFinite(telemetry.payloadSizeKb) && telemetry.payloadSizeKb >= 0,
    lastSyncTime: hasText(telemetry.lastSyncTime)
  };

  if (!valid.hr) notes.push("HR 缺失或超出合理範圍，資料需確認。");
  if (!valid.spo2) notes.push("SpO2 缺失或超出合理範圍，資料需確認。");
  if (!valid.activityDropPercent) notes.push("活動量下降比例缺失或超出合理範圍，資料需確認。");
  if (!valid.payloadSizeKb) notes.push("payloadSizeKb 不可小於 0，封包資料需確認。");
  if (!valid.lastSyncTime) notes.push("缺少最後回傳時間，需確認封包時間戳。");

  if (telemetry.signalStatus === "weak") {
    notes.push("弱訊號回傳，建議照護人員確認或補測。");
  }

  if (telemetry.signalStatus === "offline") {
    notes.push("裝置離線或未完成回傳，僅能進行有限風險提醒。");
  }

  return { valid, notes };
}

function deriveQuality(
  careCase: CareCase,
  validation: ReturnType<typeof validateTelemetry>
): { dataQuality: DataQuality; confidence: RiskConfidence } {
  const hasMissingRequired =
    !validation.valid.hr ||
    !validation.valid.spo2 ||
    !validation.valid.activityDropPercent ||
    !validation.valid.payloadSizeKb;

  if (careCase.telemetry.signalStatus === "offline" || hasMissingRequired) {
    return { dataQuality: "insufficient", confidence: "low" };
  }

  if (careCase.telemetry.signalStatus === "weak" || !validation.valid.lastSyncTime) {
    return { dataQuality: "limited", confidence: "medium" };
  }

  return { dataQuality: "good", confidence: "high" };
}

function scorePhysiological(careCase: CareCase, valid: ReturnType<typeof validateTelemetry>["valid"]) {
  const reasons: RiskReason[] = [];
  let points = 0;
  const { hr, spo2 } = careCase.telemetry;

  if (valid.hr && typeof hr === "number") {
    if (hr < 50) {
      points += 20;
      addReason(reasons, "hr-below-50", "physiological", `HR ${hr}，低於觀察門檻`, 20, "warning");
    } else if (hr <= 55) {
      points += 15;
      addReason(reasons, "hr-50-55", "physiological", `HR ${hr}，低於觀察門檻`, 15, "warning");
    } else if (hr <= 60) {
      points += 8;
      addReason(reasons, "hr-56-60", "physiological", `HR ${hr}，接近觀察門檻`, 8, "watch");
    }
  }

  if (valid.spo2 && typeof spo2 === "number") {
    if (spo2 < 90) {
      points += 25;
      addReason(reasons, "spo2-below-90", "physiological", `SpO2 ${spo2}%，低於觀察門檻`, 25, "warning");
    } else if (spo2 <= 93) {
      points += 15;
      addReason(reasons, "spo2-90-93", "physiological", `SpO2 ${spo2}%，低於觀察門檻`, 15, "warning");
    } else if (spo2 <= 95) {
      points += 5;
      addReason(reasons, "spo2-94-95", "physiological", `SpO2 ${spo2}%，列入觀察區間`, 5, "watch");
    }
  }

  return { score: clampCategory(points, riskCategoryCaps.physiological), reasons };
}

function scoreActivityRecovery(careCase: CareCase, valid: ReturnType<typeof validateTelemetry>["valid"]) {
  const reasons: RiskReason[] = [];
  let points = 0;
  const { activityDropPercent } = careCase.telemetry;

  if (valid.activityDropPercent && typeof activityDropPercent === "number") {
    if (activityDropPercent >= 30) {
      points += 20;
      addReason(reasons, "activity-drop-30", "activityRecovery", `活動量下降 ${activityDropPercent}%`, 20, "warning");
    } else if (activityDropPercent >= 20) {
      points += 12;
      addReason(reasons, "activity-drop-20", "activityRecovery", `活動量下降 ${activityDropPercent}%`, 12, "watch");
    } else if (activityDropPercent >= 10) {
      points += 5;
      addReason(reasons, "activity-drop-10", "activityRecovery", `活動量下降 ${activityDropPercent}%`, 5, "stable");
    }
  }

  const recoveryContext = careCase.recoveryContext;
  if (recoveryContext?.homeRecovery && recoveryContext.afterDialysisHours <= 6) {
    points += 10;
    addReason(
      reasons,
      "early-home-recovery",
      "activityRecovery",
      `透析後 ${recoveryContext.afterDialysisHours} 小時返家恢復期`,
      10,
      "watch"
    );
  }

  return { score: clampCategory(points, riskCategoryCaps.activityRecovery), reasons };
}

function scoreHelpEvent(careCase: CareCase) {
  const reasons: RiskReason[] = [];
  let points = 0;
  const helpEvent = careCase.helpEvent;

  if (helpEvent?.active) {
    if (helpEvent.priority === "urgent") {
      points += 35;
      addReason(reasons, "urgent-help-event", "helpEvent", "urgent 求助事件，需要照護人員確認", 35, "critical");
    } else {
      points += 20;
      addReason(reasons, "normal-help-event", "helpEvent", "非緊急求助 / 照護回報事件", 20, "warning");
    }
  }

  const matchedSymptoms = symptomClusterMatches(careCase);
  if (matchedSymptoms.length > 0) {
    points += 10;
    addReason(
      reasons,
      "symptom-cluster",
      "helpEvent",
      `${matchedSymptoms.join(" / ")}症狀 cluster`,
      10,
      "watch"
    );
  }

  return { score: clampCategory(points, riskCategoryCaps.helpEvent), reasons };
}

function scoreDataQuality(careCase: CareCase) {
  const reasons: RiskReason[] = [];
  let points = 0;

  if (careCase.telemetry.signalStatus === "weak") {
    points += 5;
    addReason(reasons, "weak-signal", "dataQuality", "弱訊號回傳，需人工確認", 5, "stable");
  } else if (careCase.telemetry.signalStatus === "offline") {
    points += 10;
    addReason(reasons, "offline-signal", "dataQuality", "裝置離線，資料品質不足", 10, "watch");
  }

  return { score: clampCategory(points, riskCategoryCaps.dataQuality), reasons };
}

export function calculateRisk(careCase: CareCase): RiskResult {
  const validation = validateTelemetry(careCase);
  const quality = deriveQuality(careCase, validation);
  const physiological = scorePhysiological(careCase, validation.valid);
  const activityRecovery = scoreActivityRecovery(careCase, validation.valid);
  const helpEvent = scoreHelpEvent(careCase);
  const dataQuality = scoreDataQuality(careCase);
  const rawScore =
    physiological.score +
    activityRecovery.score +
    helpEvent.score +
    dataQuality.score;
  const score = Math.min(rawScore, 100);
  const reasons = [
    ...physiological.reasons,
    ...activityRecovery.reasons,
    ...helpEvent.reasons,
    ...dataQuality.reasons
  ];

  if (reasons.length === 0) {
    reasons.push({
      id: "no-risk-rule",
      category: "physiological",
      label: "目前未觸發風險加分規則",
      points: 0,
      severity: "stable"
    });
  }

  return {
    rawScore,
    score,
    level: mapRiskLevel(score),
    confidence: quality.confidence,
    dataQuality: quality.dataQuality,
    reasons,
    capped: rawScore > 100,
    dataQualityNotes: validation.notes,
    safetyCopy: riskSafetyCopy
  };
}

export function sortRiskResults(a: RiskResult, b: RiskResult) {
  if (b.score !== a.score) return b.score - a.score;
  return riskLevelWeight[b.level] - riskLevelWeight[a.level];
}
