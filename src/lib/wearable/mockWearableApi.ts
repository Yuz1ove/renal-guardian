import type { AcknowledgementStatus, SensorSnapshot } from "../../types/wearable";
import { calculateRisk, type RiskResult } from "../risk/riskEngine";
import {
  validateWearablePacketChecksum,
  type WearablePacket
} from "./packetBuilder";

export const mockWearableApiRoutes = {
  ingest: "POST /api/wearable/ingest",
  latestRisk: "GET /api/patients/:patientId/latest-risk",
  criticalEvents: "GET /api/events/critical",
  acknowledgeEvent: "POST /api/events/:eventId/ack"
} as const;

export interface CriticalEventRecord {
  id: string;
  packetId: string;
  patientId: string;
  createdAt: string;
  title: string;
  message: string;
  status: "open" | "acknowledged";
  staleData: boolean;
}

export interface WearableIngestResponse {
  ok: boolean;
  acknowledgementStatus: AcknowledgementStatus;
  packetId: string;
  serverReceivedAt: string;
  risk: RiskResult;
  packetDelay: number;
  staleData: boolean;
  duplicate: boolean;
  checksumValid: boolean;
  criticalEvent?: CriticalEventRecord;
  message: string;
}

function defaultSnapshot(packet: WearablePacket): SensorSnapshot {
  return {
    patientId: packet.patientId,
    deviceId: packet.deviceId,
    timestamp: packet.createdAt,
    ppg: {
      hr: null,
      pulseSignalQuality: 0,
      lastSyncTime: packet.createdAt
    },
    spo2: {
      spo2: null,
      spo2SignalQuality: 0,
      lastSyncTime: packet.createdAt
    },
    accelerometer: {
      activityIndex: 0,
      activityDropPercent: 0,
      motionState: "normal"
    },
    helpEvent: {
      active: false,
      source: "bracelet_button",
      createdAt: null
    },
    signal: {
      signalStatus: "normal",
      signalQuality: 1,
      dataQuality: "good"
    },
    ble: {
      payloadSizeKb: packet.payloadSizeKb,
      packetType: packet.packetType,
      lastSyncTime: packet.createdAt
    },
    sync: {
      bufferedPacketCount: 0,
      lastSyncTime: packet.createdAt,
      packetDelay: 0
    },
    feedback: {
      acknowledgementStatus: "gateway_ack"
    }
  };
}

function mergeSnapshot(packet: WearablePacket, previous?: SensorSnapshot): SensorSnapshot {
  const fallback = previous ?? defaultSnapshot(packet);
  const payload = packet.payload;

  return {
    patientId: payload.patientId ?? packet.patientId,
    deviceId: payload.deviceId ?? packet.deviceId,
    timestamp: payload.timestamp ?? packet.createdAt,
    ppg: payload.ppg ?? fallback.ppg,
    spo2: payload.spo2 ?? fallback.spo2,
    accelerometer: payload.accelerometer ?? fallback.accelerometer,
    helpEvent: payload.helpEvent ?? fallback.helpEvent,
    signal: payload.signal ?? fallback.signal,
    ble: {
      ...(payload.ble ?? fallback.ble),
      payloadSizeKb: packet.payloadSizeKb,
      packetType: packet.packetType,
      lastSyncTime: packet.createdAt
    },
    sync: payload.sync ?? fallback.sync,
    feedback: payload.feedback ?? fallback.feedback
  };
}

export class MockWearableBackendApi {
  private seenPacketIds = new Set<string>();
  private latestSnapshots = new Map<string, SensorSnapshot>();
  private latestRisk = new Map<string, RiskResult>();
  private criticalEvents: CriticalEventRecord[] = [];

  ingestWearablePacket(packet: WearablePacket): WearableIngestResponse {
    const serverReceivedAt = new Date().toISOString();
    const previous = this.latestSnapshots.get(packet.patientId);
    const snapshot = mergeSnapshot(packet, previous);
    const checksumValid = validateWearablePacketChecksum(packet);
    const duplicate = this.seenPacketIds.has(packet.packetId);
    const packetCreatedAt = new Date(packet.createdAt).getTime();
    const receivedAt = new Date(serverReceivedAt).getTime();
    const packetDelay = Number.isFinite(packetCreatedAt)
      ? Math.max(0, receivedAt - packetCreatedAt + snapshot.sync.packetDelay)
      : snapshot.sync.packetDelay;
    const staleData =
      packet.packetType === "buffered_batch" ||
      snapshot.signal.signalStatus === "stale_data" ||
      packetDelay > 60_000;

    const completeSnapshot: SensorSnapshot = {
      ...snapshot,
      sync: {
        ...snapshot.sync,
        packetDelay,
        lastSyncTime: serverReceivedAt
      },
      feedback: {
        acknowledgementStatus: checksumValid ? "server_ack" : "failed"
      }
    };
    const risk = calculateRisk(completeSnapshot);

    if (!checksumValid) {
      return {
        ok: false,
        acknowledgementStatus: "failed",
        packetId: packet.packetId,
        serverReceivedAt,
        risk,
        packetDelay,
        staleData,
        duplicate,
        checksumValid,
        message: "checksum mismatch, packet rejected"
      };
    }

    if (!duplicate) {
      this.seenPacketIds.add(packet.packetId);
      this.latestSnapshots.set(packet.patientId, completeSnapshot);
      this.latestRisk.set(packet.patientId, risk);
    }

    let criticalEvent: CriticalEventRecord | undefined;
    const shouldCreateCriticalEvent =
      !duplicate &&
      !staleData &&
      (packet.packetType === "help_event" || risk.level === "critical");

    if (shouldCreateCriticalEvent) {
      criticalEvent = {
        id: `evt-${packet.packetId}`,
        packetId: packet.packetId,
        patientId: packet.patientId,
        createdAt: serverReceivedAt,
        title: packet.packetType === "help_event" ? "手環實體求助鍵事件" : "高風險提示事件",
        message:
          packet.packetType === "help_event"
            ? "使用者已按下實體求助鍵，照護端需人工確認安全狀態。"
            : "系統產生高風險提示，需照護端人工確認。",
        status: "open",
        staleData
      };
      this.criticalEvents = [criticalEvent, ...this.criticalEvents].slice(0, 8);
    }

    return {
      ok: true,
      acknowledgementStatus: "server_ack",
      packetId: packet.packetId,
      serverReceivedAt,
      risk,
      packetDelay,
      staleData,
      duplicate,
      checksumValid,
      criticalEvent,
      message: duplicate
        ? "duplicate packet ignored, previous risk result preserved"
        : staleData
          ? "server_ack, buffered data stored as historical record"
          : "server_ack, latest risk updated"
    };
  }

  getLatestRisk(patientId: string) {
    return this.latestRisk.get(patientId);
  }

  getCriticalEvents() {
    return this.criticalEvents;
  }

  acknowledgeEvent(eventId: string) {
    this.criticalEvents = this.criticalEvents.map((event) =>
      event.id === eventId ? { ...event, status: "acknowledged" } : event
    );
    return this.criticalEvents.find((event) => event.id === eventId);
  }
}
