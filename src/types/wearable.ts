export type MotionState =
  | "rest"
  | "normal"
  | "high_motion"
  | "possible_fall"
  | "no_motion";

export type SignalStatus =
  | "normal"
  | "loose_wear"
  | "sensor_blocked"
  | "high_motion"
  | "offline"
  | "stale_data";

export type DataQuality = "good" | "fair" | "poor" | "invalid";

export type PacketType =
  | "vital_summary"
  | "help_event"
  | "signal_status"
  | "ack"
  | "buffered_batch"
  | "heartbeat";

export type AcknowledgementStatus =
  | "idle"
  | "local_received"
  | "gateway_ack"
  | "server_ack"
  | "retrying"
  | "failed";

export interface PpgReading {
  hr: number | null;
  pulseSignalQuality: number;
  lastSyncTime: string;
}

export interface Spo2Reading {
  spo2: number | null;
  spo2SignalQuality: number;
  lastSyncTime: string;
}

export interface AccelerometerReading {
  activityIndex: number;
  activityDropPercent: number;
  motionState: MotionState;
}

export interface HelpEvent {
  active: boolean;
  source: "bracelet_button" | "bedside_button" | "caregiver_panel";
  createdAt: string | null;
}

export interface SignalAssessment {
  signalStatus: SignalStatus;
  signalQuality: number;
  dataQuality: DataQuality;
}

export interface BleTransportState {
  payloadSizeKb: number;
  packetType: PacketType;
  lastSyncTime: string;
}

export interface SyncState {
  bufferedPacketCount: number;
  lastSyncTime: string;
  packetDelay: number;
}

export interface WearableFeedbackState {
  acknowledgementStatus: AcknowledgementStatus;
}

export interface SensorSnapshot {
  patientId: string;
  deviceId: string;
  timestamp: string;
  ppg: PpgReading;
  spo2: Spo2Reading;
  accelerometer: AccelerometerReading;
  helpEvent: HelpEvent;
  signal: SignalAssessment;
  ble: BleTransportState;
  sync: SyncState;
  feedback: WearableFeedbackState;
}
