export type RiskLevel = "stable" | "attention" | "warning" | "critical";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "acknowledged" | "resolved";
export type Posture = "lying" | "sitting" | "standing" | "walking";
export type ActiveView = "summary" | "wearable" | "bedside" | "dashboard" | "tech";
export type DemoScenario = "stable" | "weak" | "emergency";

export interface Patient {
  id: string;
  name: string;
  age: number;
  dialysisDay: boolean;
  lastDialysisEndTime: string;
  baselineHeartRate: number;
  baselineSystolicBP: number;
  caregiverName: string;
  room: string;
}

export interface WearablePacket {
  deviceId: string;
  patientId: string;
  timestamp: string;
  heartRate: number;
  systolicBP: number | null;
  diastolicBP: number | null;
  activityIndex: number;
  posture: Posture;
  fallDetected: boolean;
  sosPressed: boolean;
  battery: number;
  signalQuality: number;
}

export interface BedsideCallPacket {
  deviceId: string;
  patientId: string;
  timestamp: string;
  buttonPressed: boolean;
  longPressEmergency: boolean;
  noResponseMinutes: number;
  deviceOnline: boolean;
  battery: number;
}

export interface RiskResult {
  patientId: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
  recommendedActions: string[];
  updatedAt: string;
}

export interface CaregiverTask {
  id: string;
  patientId: string;
  priority: TaskPriority;
  title: string;
  reason: string;
  status: TaskStatus;
  createdAt: string;
}

export interface EventLogItem {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  level: RiskLevel;
}

export interface DeviceDefinition {
  id: string;
  patientId: string;
  type: "wearable" | "bedside" | "gateway" | "dashboard";
  label: string;
  location: string;
}
