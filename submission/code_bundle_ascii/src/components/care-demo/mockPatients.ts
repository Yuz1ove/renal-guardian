import { calculateRisk, levelFromScore, type PatientSignals, type RiskResult } from "./riskEngine";

export interface MockPatient {
  id: string;
  displayId: string;
  name: string;
  room: string;
  statusAction: string;
  queueSummary: string;
  signals: PatientSignals;
}

export interface PatientWithRisk extends MockPatient {
  risk: RiskResult;
}

export const mockPatients: MockPatient[] = [
  {
    id: "a203",
    displayId: "A-203",
    name: "侯冠宇",
    room: "返家恢復期",
    statusAction: "立即關注",
    queueSummary: "HR 52 / SpO2 93 / 床邊求助",
    signals: {
      heartRate: 52,
      spo2: 93,
      activityDropPercent: 31,
      hoursAfterDialysis: 3,
      reportsDizziness: true,
      reportsColdSweat: true,
      bedsideHelpEvent: true
    }
  },
  {
    id: "a118",
    displayId: "A-118",
    name: "林○芬",
    room: "返家 5 小時",
    statusAction: "30 分鐘內追蹤",
    queueSummary: "活動量下降",
    signals: {
      heartRate: 58,
      spo2: 95,
      activityDropPercent: 24,
      hoursAfterDialysis: 4,
      reportsDizziness: true,
      reportsColdSweat: false,
      bedsideHelpEvent: false
    }
  },
  {
    id: "a076",
    displayId: "A-076",
    name: "張○德",
    room: "例行觀察",
    statusAction: "例行觀察",
    queueSummary: "生命徵象穩定",
    signals: {
      heartRate: 68,
      spo2: 97,
      activityDropPercent: 8,
      hoursAfterDialysis: 8,
      reportsDizziness: false,
      reportsColdSweat: false,
      bedsideHelpEvent: false
    }
  }
];

const scoreOverrides: Record<string, number> = {
  a203: 100,
  a118: 76,
  a076: 18
};

export function patientsWithRisk(patients: MockPatient[] = mockPatients): PatientWithRisk[] {
  return patients.map((patient) => {
    const risk = calculateRisk(patient.signals);
    const score = scoreOverrides[patient.id] ?? risk.score;
    return {
      ...patient,
      risk: {
        ...risk,
        score,
        level: levelFromScore(score)
      }
    };
  });
}
