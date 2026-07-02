import type { BedsideCallPacket, DemoScenario, WearablePacket } from "../types";

function wave(min: number, max: number, tick: number, phase = 0) {
  const ratio = (Math.sin(tick * 0.85 + phase) + 1) / 2;
  return Math.round(min + (max - min) * ratio);
}

export function simulateWearablePacket(
  previous: WearablePacket,
  scenario: DemoScenario,
  tick: number
): WearablePacket {
  const timestamp = new Date().toISOString();

  if (scenario === "stable") {
    return {
      ...previous,
      timestamp,
      heartRate: wave(72, 95, tick),
      systolicBP: wave(108, 122, tick, 1.5),
      diastolicBP: wave(68, 78, tick, 2.2),
      activityIndex: wave(50, 85, tick, 0.6),
      posture: tick % 4 === 0 ? "walking" : tick % 3 === 0 ? "standing" : "sitting",
      fallDetected: false,
      sosPressed: false,
      battery: Math.max(75, previous.battery - (tick % 10 === 0 ? 1 : 0)),
      signalQuality: wave(88, 98, tick, 0.2)
    };
  }

  if (scenario === "weak") {
    return {
      ...previous,
      timestamp,
      heartRate: wave(96, 108, tick),
      systolicBP: wave(92, 104, tick, 1),
      diastolicBP: wave(58, 67, tick, 1.4),
      activityIndex: wave(18, 34, tick, 0.4),
      posture: "lying",
      fallDetected: false,
      sosPressed: false,
      battery: Math.max(44, previous.battery - (tick % 8 === 0 ? 1 : 0)),
      signalQuality: wave(70, 91, tick, 1.7)
    };
  }

  return {
    ...previous,
    timestamp,
    heartRate: tick % 2 === 0 ? 118 : 52,
    systolicBP: 84,
    diastolicBP: 56,
    activityIndex: 8,
    posture: "lying",
    fallDetected: true,
    sosPressed: true,
    battery: Math.max(18, previous.battery - 1),
    signalQuality: wave(54, 72, tick, 0.9)
  };
}

export function simulateBedsidePacket(
  previous: BedsideCallPacket,
  scenario: DemoScenario,
  tick: number
): BedsideCallPacket {
  const timestamp = new Date().toISOString();

  if (scenario === "stable") {
    return {
      ...previous,
      timestamp,
      buttonPressed: false,
      longPressEmergency: false,
      noResponseMinutes: 0,
      deviceOnline: true,
      battery: Math.max(82, previous.battery - (tick % 12 === 0 ? 1 : 0))
    };
  }

  if (scenario === "weak") {
    return {
      ...previous,
      timestamp,
      buttonPressed: false,
      longPressEmergency: false,
      noResponseMinutes: tick % 3 === 0 ? 6 : 4,
      deviceOnline: true,
      battery: Math.max(50, previous.battery - (tick % 8 === 0 ? 1 : 0))
    };
  }

  return {
    ...previous,
    timestamp,
    buttonPressed: true,
    longPressEmergency: true,
    noResponseMinutes: 12,
    deviceOnline: true,
    battery: Math.max(21, previous.battery - 1)
  };
}
