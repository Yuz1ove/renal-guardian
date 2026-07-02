import type { Vector3Tuple } from "three";

export type DemoMode = "overview" | "wearable" | "bedside" | "team";

export interface ScenePreset {
  id: DemoMode;
  label: string;
  eyebrow: string;
  cameraPosition: Vector3Tuple;
  target: Vector3Tuple;
  description: string;
}

export const scenePresets: Record<DemoMode, ScenePreset> = {
  overview: {
    id: "overview",
    label: "串接總覽",
    eyebrow: "Overview",
    cameraPosition: [0, 1.72, 5.05],
    target: [0, 0.1, 0],
    description: "手環資料 + 呼叫器事件 → API → risk engine → caregiver dashboard"
  },
  wearable: {
    id: "wearable",
    label: "手環監測",
    eyebrow: "Step 1",
    cameraPosition: [-1.7, 1.35, 4.1],
    target: [-1.25, 0.05, 0.12],
    description: "聚焦 HR、SpO2、活動量與低血壓趨勢，送出低資料量 packet"
  },
  bedside: {
    id: "bedside",
    label: "床邊求助",
    eyebrow: "Step 2",
    cameraPosition: [0.05, 1.3, 3.55],
    target: [0, -0.02, 0.1],
    description: "一鍵求助、夜間虛弱與回報頭暈事件送往照護端"
  },
  team: {
    id: "team",
    label: "照護團隊處理",
    eyebrow: "Step 3",
    cameraPosition: [1.62, 1.36, 4.1],
    target: [1.18, 0.12, 0],
    description: "照護端 dashboard 顯示風險分數、待確認名單與處置建議"
  }
};
