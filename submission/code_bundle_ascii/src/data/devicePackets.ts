import type { BedsideCallPacket, WearablePacket } from "../types";

export const initialWearablePacket: WearablePacket = {
  deviceId: "WR-001",
  patientId: "P001",
  timestamp: "2026-06-29T21:12:00+08:00",
  heartRate: 84,
  systolicBP: 112,
  diastolicBP: 72,
  activityIndex: 74,
  posture: "sitting",
  fallDetected: false,
  sosPressed: false,
  battery: 87,
  signalQuality: 94
};

export const initialBedsidePacket: BedsideCallPacket = {
  deviceId: "BC-001",
  patientId: "P001",
  timestamp: "2026-06-29T21:12:00+08:00",
  buttonPressed: false,
  longPressEmergency: false,
  noResponseMinutes: 0,
  deviceOnline: true,
  battery: 92
};

export function toLowBandwidthWearableJson(packet: WearablePacket) {
  return {
    type: "wearable",
    deviceId: packet.deviceId,
    patientId: packet.patientId,
    ts: new Date(packet.timestamp).getTime(),
    hr: packet.heartRate,
    bp:
      packet.systolicBP && packet.diastolicBP
        ? `${packet.systolicBP}/${packet.diastolicBP}`
        : null,
    act: packet.activityIndex,
    posture: packet.posture,
    fall: packet.fallDetected,
    sos: packet.sosPressed,
    bat: packet.battery,
    sig: packet.signalQuality
  };
}
