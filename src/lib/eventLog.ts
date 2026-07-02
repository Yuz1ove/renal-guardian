import type { EventLogItem, RiskLevel } from "../types";

let sequence = 0;

export function createEvent(title: string, detail: string, level: RiskLevel = "stable"): EventLogItem {
  sequence += 1;
  return {
    id: `EV-${Date.now()}-${sequence}`,
    timestamp: new Date().toISOString(),
    title,
    detail,
    level
  };
}

export function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(timestamp));
}
