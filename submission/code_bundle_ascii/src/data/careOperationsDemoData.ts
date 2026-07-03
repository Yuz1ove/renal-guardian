import type { CareWorker, OperationsHelpEvent, PatientStatus } from "../types/careOperations";

export const operationsPatients: PatientStatus[] = [
  {
    patientId: "A-203",
    codeName: "侯○宇",
    hr: 118,
    spo2: 91,
    activityIndex: 18,
    activityDropPercent: 72,
    motionState: "low_motion",
    signalQuality: "weak",
    dataQuality: "partial",
    lastSyncTime: "2026-07-02T16:42:05+08:00",
    locationStatus: "住家客廳 / GPS confidence 82%",
    wearableStatus: "wearing",
    bedsideButtonStatus: "pressed",
    packetDelaySeconds: 14,
    bufferedPacketCount: 3,
    connectionPath: "LTE fallback",
    acknowledgementStatus: "pending",
    batteryLevel: 72,
    powerSource: "plugged",
    familyNotified: false,
    careWorkerDispatched: false
  },
  {
    patientId: "A-118",
    codeName: "林○芬",
    hr: 104,
    spo2: 94,
    activityIndex: 33,
    activityDropPercent: 48,
    motionState: "low_motion",
    signalQuality: "weak",
    dataQuality: "partial",
    lastSyncTime: "2026-07-02T16:39:30+08:00",
    locationStatus: "住家臥室 / gateway triangulation",
    wearableStatus: "wearing",
    bedsideButtonStatus: "idle",
    packetDelaySeconds: 7,
    bufferedPacketCount: 1,
    connectionPath: "BLE -> phone relay",
    acknowledgementStatus: "idle",
    batteryLevel: 54,
    powerSource: "battery",
    familyNotified: false,
    careWorkerDispatched: false
  },
  {
    patientId: "A-051",
    codeName: "鄭○美",
    hr: 126,
    spo2: 90,
    activityIndex: 21,
    activityDropPercent: 66,
    motionState: "low_motion",
    signalQuality: "good",
    dataQuality: "good",
    lastSyncTime: "2026-07-02T16:43:44+08:00",
    locationStatus: "住家廚房 / indoor beacon",
    wearableStatus: "wearing",
    bedsideButtonStatus: "idle",
    packetDelaySeconds: 3,
    bufferedPacketCount: 0,
    connectionPath: "Wi-Fi",
    acknowledgementStatus: "idle",
    batteryLevel: 81,
    powerSource: "battery",
    familyNotified: false,
    careWorkerDispatched: false
  },
  {
    patientId: "A-090",
    codeName: "黃○仁",
    hr: 84,
    spo2: 96,
    activityIndex: 42,
    activityDropPercent: 18,
    motionState: "normal",
    signalQuality: "offline",
    dataQuality: "insufficient",
    lastSyncTime: "2026-07-02T16:31:10+08:00",
    locationStatus: "住家玄關 / last known gateway",
    wearableStatus: "unknown",
    bedsideButtonStatus: "idle",
    packetDelaySeconds: 22,
    bufferedPacketCount: 5,
    connectionPath: "buffered offline",
    acknowledgementStatus: "retrying",
    batteryLevel: 34,
    powerSource: "backup_battery",
    familyNotified: false,
    careWorkerDispatched: false
  },
  {
    patientId: "A-076",
    codeName: "張○德",
    hr: 76,
    spo2: 97,
    activityIndex: 62,
    activityDropPercent: 8,
    motionState: "normal",
    signalQuality: "good",
    dataQuality: "good",
    lastSyncTime: "2026-07-02T16:45:12+08:00",
    locationStatus: "住家 / normal sync",
    wearableStatus: "wearing",
    bedsideButtonStatus: "idle",
    packetDelaySeconds: 1,
    bufferedPacketCount: 0,
    connectionPath: "Wi-Fi",
    acknowledgementStatus: "acknowledged",
    batteryLevel: 88,
    powerSource: "battery",
    familyNotified: false,
    careWorkerDispatched: false
  }
];

export const operationsHelpEvents: Record<string, OperationsHelpEvent> = {
  "A-203": {
    active: true,
    source: "bedside_button",
    createdAt: "2026-07-02T16:42:00+08:00"
  },
  "A-118": {
    active: true,
    source: "system_prediction",
    createdAt: "2026-07-02T16:39:32+08:00"
  },
  "A-051": {
    active: false,
    source: "system_prediction",
    createdAt: "2026-07-02T16:43:44+08:00"
  },
  "A-090": {
    active: false,
    source: "bracelet",
    createdAt: "2026-07-02T16:31:10+08:00"
  },
  "A-076": {
    active: false,
    source: "bracelet",
    createdAt: "2026-07-02T16:45:12+08:00"
  }
};

export const careWorkersSeed: CareWorker[] = [
  {
    workerId: "CW-07",
    name: "陳怡君",
    status: "available",
    distanceKm: 1.4,
    currentLoad: 1,
    assignedPatientIds: []
  },
  {
    workerId: "CW-12",
    name: "林柏宏",
    status: "available",
    distanceKm: 2.1,
    currentLoad: 0,
    assignedPatientIds: []
  },
  {
    workerId: "CW-03",
    name: "王雅婷",
    status: "busy",
    distanceKm: 0.8,
    currentLoad: 2,
    assignedPatientIds: ["A-051", "A-090"]
  }
];
