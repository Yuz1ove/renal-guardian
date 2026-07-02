import type { DeviceDefinition } from "../types";

export const demoDevices: DeviceDefinition[] = [
  {
    id: "WR-001",
    patientId: "P001",
    type: "wearable",
    label: "腎安手環",
    location: "患者手腕"
  },
  {
    id: "BC-001",
    patientId: "P001",
    type: "bedside",
    label: "床邊呼叫器",
    location: "A-203 床頭櫃"
  },
  {
    id: "GW-A203",
    patientId: "P001",
    type: "gateway",
    label: "居家閘道器",
    location: "客廳"
  },
  {
    id: "CARE-DASH-01",
    patientId: "P001",
    type: "dashboard",
    label: "居服員辦公室看板",
    location: "照護站"
  }
];
