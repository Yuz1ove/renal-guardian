import type { PacketType, SensorSnapshot } from "../../types/wearable";

export interface WearablePacket {
  packetId: string;
  sequence: number;
  patientId: string;
  deviceId: string;
  packetType: PacketType;
  createdAt: string;
  payloadSizeKb: number;
  checksum: string;
  payload: Partial<SensorSnapshot>;
}

let sequenceCounter = 0;

function createPacketId(deviceId: string): string {
  sequenceCounter += 1;
  return `${deviceId}-${Date.now()}-${sequenceCounter}`;
}

function roughSizeKb(data: unknown): number {
  const bytes = new Blob([JSON.stringify(data)]).size;
  return Number((bytes / 1024).toFixed(2));
}

export function simpleChecksum(input: unknown): string {
  const text = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function validateWearablePacketChecksum(packet: WearablePacket): boolean {
  return packet.checksum === simpleChecksum(packet.payload);
}

export function buildWearablePacket(
  snapshot: SensorSnapshot,
  packetType: PacketType
): WearablePacket {
  const payload: Partial<SensorSnapshot> =
    packetType === "help_event"
      ? {
          patientId: snapshot.patientId,
          deviceId: snapshot.deviceId,
          timestamp: snapshot.timestamp,
          helpEvent: snapshot.helpEvent,
          signal: snapshot.signal,
          sync: snapshot.sync,
          feedback: snapshot.feedback
        }
      : {
          patientId: snapshot.patientId,
          deviceId: snapshot.deviceId,
          timestamp: snapshot.timestamp,
          ppg: snapshot.ppg,
          spo2: snapshot.spo2,
          accelerometer: snapshot.accelerometer,
          signal: snapshot.signal,
          sync: snapshot.sync
        };

  const packet: WearablePacket = {
    packetId: createPacketId(snapshot.deviceId),
    sequence: sequenceCounter,
    patientId: snapshot.patientId,
    deviceId: snapshot.deviceId,
    packetType,
    createdAt: new Date().toISOString(),
    payloadSizeKb: roughSizeKb(payload),
    checksum: "",
    payload
  };

  packet.checksum = simpleChecksum(packet.payload);

  return packet;
}
