import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { bedsideHelpEvent, caregiverActions, wearablePacket } from "./demoFlowData";
import { DeviceScene } from "./DeviceScene";
import type { DemoMode } from "./scenePresets";
import type { PatientWithRisk } from "./mockPatients";

interface SceneCanvasProps {
  mode: DemoMode;
  patients: PatientWithRisk[];
  activePatientId: string;
  bedsideEventActive: boolean;
  acknowledged: boolean;
  assigned: boolean;
  onModeChange: (mode: DemoMode) => void;
}

export function SceneCanvas(props: SceneCanvasProps) {
  const activePatient = props.patients.find((patient) => patient.id === props.activePatientId) ?? props.patients[0];

  return (
    <div className={`care-scene-frame mode-${props.mode}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 1.9, 5.4], fov: 38, near: 0.1, far: 80 }}
      >
        <Suspense fallback={null}>
          <DeviceScene {...props} />
        </Suspense>
      </Canvas>
      <div className="scene-flow-overlay" aria-label="資料流展示">
        <article className={props.mode === "wearable" ? "is-active" : ""}>
          <span>01 手環監測</span>
          <strong>低資料量封包</strong>
          <p>HR {wearablePacket.hr} / SpO2 {wearablePacket.spo2}% / 活動量 -{wearablePacket.activityDrop}%</p>
          <em>{wearablePacket.payloadSize} / signal {wearablePacket.signal}</em>
        </article>
        <article className={props.mode === "bedside" ? "is-active is-alert" : props.bedsideEventActive ? "is-alert" : ""}>
          <span>02 床邊求助</span>
          <strong>{bedsideHelpEvent.userAction}</strong>
          <p>{bedsideHelpEvent.symptom}，事件送出</p>
          <em>{bedsideHelpEvent.priority}</em>
        </article>
        <article className={props.mode === "team" ? "is-active" : ""}>
          <span>03 照護端</span>
          <strong>{activePatient.displayId} / {activePatient.risk.score} 分</strong>
          <p>{props.assigned ? "已分派照護人員" : caregiverActions.slice(0, 3).join(" / ")}</p>
          <em>care queue</em>
        </article>
      </div>
    </div>
  );
}
