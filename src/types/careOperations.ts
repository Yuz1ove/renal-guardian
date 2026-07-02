export type OperationRiskLevel = "stable" | "watch" | "warning" | "critical";

export type AlertStatus =
  | "pending"
  | "assigned"
  | "contacting"
  | "acknowledged"
  | "on_the_way"
  | "arrived"
  | "resolved"
  | "no_response";

export type AlertSource = "bracelet" | "bedside_button" | "system_prediction" | "phone_reply" | "caregiver_operation";

export type WorkerStatus = "available" | "busy" | "off_duty";

export type DeliveryStatus = "pending" | "sent" | "retrying" | "acknowledged" | "failed" | "delivered" | "delayed";
export type AcknowledgementStatus = "idle" | "pending" | "sent" | "acknowledged" | "failed" | "retrying";
export type ConnectionPath = "BLE -> phone relay" | "Wi-Fi" | "LTE fallback" | "buffered offline";
export type CareDemoState =
  | "idle"
  | "monitoring"
  | "anomalyDetected"
  | "bedsideHelpPressed"
  | "alertQueued"
  | "caregiverReviewing"
  | "patientAckWaiting"
  | "patientAcknowledged"
  | "escalationPending"
  | "familyNotified"
  | "homeCareWorkerDispatched"
  | "emergencyEscalated"
  | "resolved";

export type CareWorkflowAction =
  | "assignCareWorker"
  | "contactPatient"
  | "sendLowDataConfirmation"
  | "notifyFamily"
  | "escalateEmergency"
  | "markOnTheWay"
  | "markArrived"
  | "resolveCase"
  | "noResponseTimeout";

export interface PatientStatus {
  patientId: string;
  codeName: string;
  hr: number;
  spo2: number;
  activityIndex: number;
  activityDropPercent: number;
  motionState: "normal" | "low_motion" | "no_motion" | "fall_suspected";
  signalQuality: "good" | "weak" | "offline";
  dataQuality: "good" | "partial" | "insufficient";
  lastSyncTime: string;
  locationStatus: string;
  wearableStatus: "wearing" | "not_wearing" | "unknown";
  bedsideButtonStatus: "idle" | "pressed";
  packetDelaySeconds: number;
  bufferedPacketCount: number;
  connectionPath: ConnectionPath;
  acknowledgementStatus: AcknowledgementStatus;
  batteryLevel: number;
  powerSource: "battery" | "plugged" | "backup_battery";
  familyNotified: boolean;
  careWorkerDispatched: boolean;
}

export interface OperationsHelpEvent {
  active: boolean;
  source: AlertSource;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReplyState {
  replyCode?: 1 | 2 | 3 | 4 | 5;
  noResponseTimeout?: boolean;
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: OperationRiskLevel;
  reasons: string[];
  matrix: {
    physiologicalRisk: number;
    activityRisk: number;
    helpEventRisk: number;
    communicationRisk: number;
    totalScore: number;
    level: OperationRiskLevel;
  };
  communicationStrategy: string;
  recommendedAction: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: "device" | "system" | "care_worker" | "patient" | "family";
  event: string;
  decision: string;
  actor: string;
  statusChange?: string;
}

export interface AlertCase {
  eventId: string;
  patientId: string;
  source: AlertSource;
  riskScore: number;
  riskLevel: OperationRiskLevel;
  status: AlertStatus;
  priority: "normal" | "high" | "urgent";
  assignedCareWorkerId?: string;
  createdAt: string;
  updatedAt: string;
  patientStatus: PatientStatus;
  helpEvent: OperationsHelpEvent;
  riskAssessment: RiskAssessment;
  timeline: AuditLogEntry[];
  slaSecondsRemaining: number;
  workflowState: CareDemoState;
  lowDataPacket?: WeakNetworkPacket;
}

export interface CareWorker {
  workerId: string;
  name: string;
  status: WorkerStatus;
  distanceKm: number;
  currentLoad: number;
  assignedPatientIds: string[];
}

export interface CareAction {
  actionType: CareWorkflowAction;
  actor: string;
  patientId: string;
  eventId: string;
  timestamp: string;
  note: string;
}

export interface WeakNetworkPacket {
  packetId: string;
  eventId: string;
  type: string;
  patientId: string;
  replyCode?: number;
  packetSizeKb: number;
  payloadSizeKb: number;
  networkMode: "normal" | "weak" | "fallback";
  connectionPath: ConnectionPath;
  retryCount: number;
  bufferedPacketCount: number;
  acknowledgementStatus: AcknowledgementStatus;
  priority: "normal" | "critical";
  deliveryStatus: DeliveryStatus;
  timestamp: string;
  lastSyncTime: string;
  payload: Record<string, unknown>;
}

export type GeneratedCareEventKind =
  | "spo2_drop"
  | "hr_abnormal"
  | "activity_drop"
  | "bedside_pressed"
  | "signal_poor"
  | "packet_delay"
  | "no_response"
  | "patient_safe"
  | "worker_arrived";
