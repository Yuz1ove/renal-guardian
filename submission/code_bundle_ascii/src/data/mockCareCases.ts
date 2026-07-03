import type { CareCase } from "../domain/careWorkflowTypes";

export const mockCareCases: CareCase[] = [
  {
    patientId: "A-203",
    displayName: "侯○宇",
    telemetry: {
      hr: 52,
      spo2: 93,
      activityDropPercent: 31,
      payloadSizeKb: 0.8,
      signalStatus: "weak",
      lastSyncTime: "17:08:42"
    },
    helpEvent: {
      active: true,
      source: "wristband",
      symptoms: ["頭暈", "冒冷汗", "虛弱"],
      priority: "urgent",
      createdAt: "17:09:12"
    },
    caregiverReport: "使用者回報頭暈與虛弱，家屬補充冒冷汗，需照護端確認。",
    recoveryContext: {
      afterDialysisHours: 3,
      homeRecovery: true
    }
  },
  {
    patientId: "A-118",
    displayName: "林○芬",
    telemetry: {
      hr: 58,
      spo2: 95,
      activityDropPercent: 28,
      payloadSizeKb: 0.8,
      signalStatus: "weak",
      lastSyncTime: "17:14:08"
    },
    helpEvent: {
      active: true,
      source: "homeGateway",
      symptoms: ["疲倦", "站立不穩"],
      priority: "normal",
      createdAt: "17:14:20"
    },
    caregiverReport: "居服員回報疲倦與站立不穩，今日返家後活動量下降，建議 30 分鐘內追蹤。",
    recoveryContext: {
      afterDialysisHours: 4,
      homeRecovery: true
    }
  },
  {
    patientId: "A-076",
    displayName: "張○德",
    telemetry: {
      hr: 68,
      spo2: 97,
      activityDropPercent: 5,
      payloadSizeKb: 0.8,
      signalStatus: "normal",
      lastSyncTime: "17:20:31"
    },
    caregiverReport: "返家後可正常對話，維持例行觀察與下一輪同步。",
    recoveryContext: {
      afterDialysisHours: 8,
      homeRecovery: true
    }
  }
];

export function getCareCaseById(patientId: string) {
  return mockCareCases.find((careCase) => careCase.patientId === patientId);
}
