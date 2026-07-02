import { Environment, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useCareStore } from "../../store/careStore";
import { BedsideCallModel } from "./BedsideCallModel";
import { CareOfficeModel } from "./CareOfficeModel";
import { DataPulseLine } from "./DataPulseLine";
import { WearableModel } from "./WearableModel";

function SceneContent() {
  const patients = useCareStore((state) => state.patients);
  const wearable = useCareStore((state) => state.wearablePacket);
  const bedside = useCareStore((state) => state.bedsidePacket);
  const riskResults = useCareStore((state) => state.riskResults);
  const activePatientId = useCareStore((state) => state.activePatientId);
  const setActiveView = useCareStore((state) => state.setActiveView);
  const triggerBedsideCall = useCareStore((state) => state.triggerBedsideCall);
  const risk = riskResults[activePatientId];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2.35, 5.7]} fov={42} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[3.5, 5, 3.5]} intensity={2.6} castShadow />
      <pointLight position={[-3, 1.5, 2.6]} intensity={1.7} color="#9fe4d9" />
      <mesh position={[0, -0.76, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.25, 96]} />
        <meshStandardMaterial color="#dbe8e5" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.78, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 1.2]} />
        <meshStandardMaterial color="#eef6f3" roughness={0.88} />
      </mesh>
      <WearableModel packet={wearable} level={risk.level} onSelect={() => setActiveView("wearable")} />
      <BedsideCallModel packet={bedside} level={risk.level} onSelect={() => triggerBedsideCall(false)} />
      <CareOfficeModel patients={patients} riskResults={riskResults} onSelect={() => setActiveView("dashboard")} />
      <DataPulseLine start={[-1.18, 0.2, 0.28]} end={[-0.66, 0.34, 0.32]} level={risk.level} />
      <DataPulseLine start={[0.28, 0.23, 0.28]} end={[1.22, 0.42, 0.08]} level={risk.level} offset={0.42} />
      <Text position={[0, 0.96, -0.3]} fontSize={0.105} color="#17343d" anchorX="center">
        device packet → API → risk engine → caregiver dashboard
      </Text>
      <Environment preset="city" />
      <OrbitControls
        target={[0, -0.12, 0]}
        enableDamping
        minDistance={3.4}
        maxDistance={7.4}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}

export function ThreeCareScene() {
  return (
    <div className="three-wrap">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
      <div className="scene-overlay">
        <div>
          <span>腎安展示原型</span>
          <strong>洗腎返家恢復期照護協作系統</strong>
        </div>
      </div>
      <div className="step-cards" aria-label="三個展示區塊">
        <button onClick={() => useCareStore.getState().setActiveView("wearable")}>
          <span>1</span>
          手環監測
        </button>
        <button onClick={() => useCareStore.getState().triggerBedsideCall(false)}>
          <span>2</span>
          床邊呼叫
        </button>
        <button onClick={() => useCareStore.getState().setActiveView("dashboard")}>
          <span>3</span>
          照護團隊處理
        </button>
      </div>
    </div>
  );
}
