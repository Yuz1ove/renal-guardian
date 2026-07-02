import type {
  AccelerometerReading,
  DataQuality,
  PpgReading,
  SignalAssessment,
  SignalStatus,
  Spo2Reading,
  SyncState
} from "../../types/wearable";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function assessSignalQuality(params: {
  ppg: PpgReading;
  spo2: Spo2Reading;
  accelerometer: AccelerometerReading;
  sync: SyncState;
}): SignalAssessment {
  const { ppg, spo2, accelerometer, sync } = params;

  let quality = (ppg.pulseSignalQuality + spo2.spo2SignalQuality) / 2;
  let status: SignalStatus = "normal";

  if (accelerometer.motionState === "high_motion") {
    quality -= 0.25;
    status = "high_motion";
  }

  if (ppg.pulseSignalQuality < 0.35 && spo2.spo2SignalQuality < 0.35) {
    quality -= 0.3;
    status = ppg.pulseSignalQuality < 0.2 && spo2.spo2SignalQuality < 0.2 ? "sensor_blocked" : "loose_wear";
  }

  if (sync.packetDelay > 60_000) {
    quality -= 0.2;
    status = "stale_data";
  }

  const now = Date.now();
  const lastSyncMs = new Date(sync.lastSyncTime).getTime();
  if (Number.isFinite(lastSyncMs) && now - lastSyncMs > 120_000) {
    quality -= 0.3;
    status = "offline";
  }

  quality = clamp01(quality);

  let dataQuality: DataQuality = "good";
  if (quality < 0.75) dataQuality = "fair";
  if (quality < 0.5) dataQuality = "poor";
  if (quality < 0.25) dataQuality = "invalid";

  return {
    signalStatus: status,
    signalQuality: Number(quality.toFixed(2)),
    dataQuality
  };
}
