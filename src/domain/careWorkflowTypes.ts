export type RiskLevel = "stable" | "watch" | "warning" | "critical";

export type RiskConfidence = "high" | "medium" | "low";

export type DataQuality = "good" | "limited" | "insufficient";

export type WorkflowStage =
  | "patient"
  | "wristband"
  | "telemetry"
  | "helpEvent"
  | "packet"
  | "riskEngine"
  | "triage"
  | "queue"
  | "assignment"
  | "feedback";

export type CareActionType =
  | "routineObservation"
  | "watchQueue"
  | "followUp30Min"
  | "assignedCaregiver"
  | "escalate";

export interface WristbandCapability {
  deviceClass: "lowDataRecoveryWristband";
  builtInModules: WristbandModule[];
  connectivity: WristbandConnectivity;
  feedbackOutputs: WristbandFeedbackOutput[];
  dataPolicy: WristbandDataPolicy;
  limitations: string[];
}

export interface WristbandModule {
  id: string;
  name: string;
  hardwareConcept: string;
  purpose: string;
  required: boolean;
  dataFields: string[];
  caveat?: string;
}

export interface WristbandConnectivity {
  primary: "BLE";
  gatewayRequired: boolean;
  gatewayDescription: string;
  offlineBuffer: boolean;
}

export interface WristbandFeedbackOutput {
  id: string;
  name: string;
  purpose: string;
  caveat?: string;
}

export interface WristbandDataPolicy {
  samplingMode: "periodic-plus-event";
  lowDataPayloadKb: number;
  personallyIdentifiableDataMinimized: boolean;
}

export interface TelemetrySnapshot {
  hr: number | null;
  spo2: number | null;
  activityDropPercent: number | null;
  payloadSizeKb: number;
  signalStatus: "normal" | "weak" | "offline";
  lastSyncTime: string;
}

export interface HelpEvent {
  active: boolean;
  source: "wristband" | "bedside" | "homeGateway";
  symptoms: string[];
  priority: "normal" | "urgent";
  createdAt: string;
}

export interface RecoveryContext {
  afterDialysisHours: number;
  homeRecovery: boolean;
}

export interface CareCase {
  patientId: string;
  displayName: string;
  telemetry: TelemetrySnapshot;
  helpEvent?: HelpEvent;
  caregiverReport?: string;
  recoveryContext?: RecoveryContext;
}

export interface RiskReason {
  id: string;
  category: "physiological" | "activityRecovery" | "helpEvent" | "dataQuality";
  label: string;
  points: number;
  severity: RiskLevel;
}

export interface RiskResult {
  rawScore: number;
  score: number;
  level: RiskLevel;
  confidence: RiskConfidence;
  dataQuality: DataQuality;
  reasons: RiskReason[];
  capped: boolean;
  dataQualityNotes: string[];
  safetyCopy: string;
}

export interface CareAssignment {
  actionType: CareActionType;
  label: string;
  description: string;
  assigned: boolean;
  notifyFamily: boolean;
  notifyCareTeam: boolean;
  stateUpdated: boolean;
}

export interface TimelineItem {
  id: string;
  time: string;
  stage: WorkflowStage;
  title: string;
  description: string;
  status: "done" | "active" | "pending";
}

export interface DashboardCard {
  id: string;
  label: string;
  value: string;
  helper?: string;
}

export interface WorkflowViewModel {
  case: CareCase;
  risk: RiskResult;
  assignment: CareAssignment;
  timeline: TimelineItem[];
  activeStages: WorkflowStage[];
  dashboardCards: DashboardCard[];
  wristbandCapability: WristbandCapability;
}
