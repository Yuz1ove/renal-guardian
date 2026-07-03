import type { CareCase, RiskLevel } from "../../domain/careWorkflowTypes";
import {
  calculateRisk as calculateCareCaseRisk,
  levelFromScore,
  riskActionByLevel
} from "../../domain/riskScoring";

export type { RiskLevel };

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

function careCaseFromSignals(signals: PatientSignals): CareCase {
  return {
    patientId: "demo",
    displayName: "demo",
    telemetry: {
      hr: signals.heartRate,
      spo2: signals.spo2,
      activityDropPercent: signals.activityDropPercent,
      payloadSizeKb: 0.8,
      signalStatus: "normal",
      lastSyncTime: "17:00:00"
    },
    helpEvent: signals.bedsideHelpEvent
      ? {
          active: true,
          source: "bedside",
          symptoms: [
            ...(signals.reportsDizziness ? ["頭暈"] : []),
            ...(signals.reportsColdSweat ? ["冒冷汗"] : [])
          ],
          priority: "urgent",
          createdAt: "17:00:00"
        }
      : undefined,
    caregiverReport: [
      signals.reportsDizziness ? "頭暈" : "",
      signals.reportsColdSweat ? "冒冷汗" : ""
    ]
      .filter(Boolean)
      .join("、"),
    recoveryContext: {
      afterDialysisHours: signals.hoursAfterDialysis,
      homeRecovery: true
    }
  };
}

export { levelFromScore };

export function calculateRisk(signals: PatientSignals): RiskResult {
  const risk = calculateCareCaseRisk(careCaseFromSignals(signals));

  return {
    score: risk.score,
    level: risk.level,
    reasons: risk.reasons.map((reason) => `${reason.label} +${reason.points}`),
    recommendedAction: riskActionByLevel[risk.level]
  };
}
