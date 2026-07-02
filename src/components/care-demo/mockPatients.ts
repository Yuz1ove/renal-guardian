import { buildWorkflowViewModel } from "../../domain/buildWorkflowViewModel";
import { mockCareCases } from "../../data/mockCareCases";
import { calculateRisk, type PatientSignals, type RiskResult } from "./riskEngine";

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

function legacyId(patientId: string) {
  return patientId.toLowerCase().replace("-", "");
}

function signalsFromCareCase(careCase: (typeof mockCareCases)[number]): PatientSignals {
  const symptoms = new Set(careCase.helpEvent?.symptoms ?? []);
  const report = careCase.caregiverReport ?? "";

  return {
    heartRate: careCase.telemetry.hr ?? 0,
    spo2: careCase.telemetry.spo2 ?? 0,
    activityDropPercent: careCase.telemetry.activityDropPercent ?? 0,
    hoursAfterDialysis: careCase.recoveryContext?.afterDialysisHours ?? 0,
    reportsDizziness: symptoms.has("頭暈") || report.includes("頭暈"),
    reportsColdSweat: symptoms.has("冒冷汗") || report.includes("冒冷汗"),
    bedsideHelpEvent: Boolean(careCase.helpEvent?.active)
  };
}

function queueSummaryFromCase(careCase: (typeof mockCareCases)[number]) {
  if (careCase.helpEvent?.active) {
    return `HR ${careCase.telemetry.hr} / SpO2 ${careCase.telemetry.spo2} / 求助事件`;
  }

  if ((careCase.telemetry.activityDropPercent ?? 0) >= 20) return "活動量下降";
  return "生命徵象穩定";
}

export const mockPatients: MockPatient[] = mockCareCases.map((careCase) => {
  const workflow = buildWorkflowViewModel(careCase);

  return {
    id: legacyId(careCase.patientId),
    displayId: careCase.patientId,
    name: careCase.displayName,
    room: careCase.recoveryContext ? `返家 ${careCase.recoveryContext.afterDialysisHours} 小時` : "返家恢復期",
    statusAction: workflow.assignment.label,
    queueSummary: queueSummaryFromCase(careCase),
    signals: signalsFromCareCase(careCase)
  };
});

export function patientsWithRisk(patients: MockPatient[] = mockPatients): PatientWithRisk[] {
  return patients.map((patient) => ({
    ...patient,
    risk: calculateRisk(patient.signals)
  }));
}
