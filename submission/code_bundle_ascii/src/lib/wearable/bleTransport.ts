import type { AcknowledgementStatus } from "../../types/wearable";
import type { WearablePacket } from "./packetBuilder";

export interface BleTransportResult {
  ok: boolean;
  acknowledgementStatus: AcknowledgementStatus;
  packetId: string;
  retryCount: number;
  error?: string;
}

function packetPriority(packet: WearablePacket) {
  if (packet.packetType === "help_event") return 0;
  if (packet.packetType === "signal_status" || packet.packetType === "quality_update") return 1;
  if (packet.packetType === "vital_summary") return 2;
  if (packet.packetType === "buffered_batch") return 3;
  return 4;
}

export class SimulatedBleTransport {
  private buffer: WearablePacket[] = [];
  private connected = true;
  private unstableMode = false;

  setConnected(value: boolean) {
    this.connected = value;
  }

  setUnstableMode(value: boolean) {
    this.unstableMode = value;
  }

  isConnected() {
    return this.connected;
  }

  getBufferedPacketCount() {
    return this.buffer.length;
  }

  async send(packet: WearablePacket): Promise<BleTransportResult> {
    if (!this.connected) {
      this.buffer.push(packet);
      this.buffer.sort((a, b) => packetPriority(a) - packetPriority(b));
      return {
        ok: false,
        acknowledgementStatus: "retrying",
        packetId: packet.packetId,
        retryCount: 0,
        error: "BLE disconnected, packet buffered locally"
      };
    }

    if (this.unstableMode && Math.random() < 0.35) {
      this.buffer.push(packet);
      this.buffer.sort((a, b) => packetPriority(a) - packetPriority(b));
      return {
        ok: false,
        acknowledgementStatus: "retrying",
        packetId: packet.packetId,
        retryCount: 1,
        error: "Simulated packet loss, packet buffered for retry"
      };
    }

    return {
      ok: true,
      acknowledgementStatus: "gateway_ack",
      packetId: packet.packetId,
      retryCount: 0
    };
  }

  async flushBufferedPackets(): Promise<WearablePacket[]> {
    if (!this.connected) return [];

    const packets = [...this.buffer].sort((a, b) => packetPriority(a) - packetPriority(b));
    this.buffer = [];
    return packets;
  }
}
