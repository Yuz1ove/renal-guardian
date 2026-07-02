import { ContactShadows, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { BraceletModel } from "./BraceletModel";
import { BedCallButtonModel } from "./BedCallButtonModel";
import { CaregiverDashboardModel } from "./CaregiverDashboardModel";
import { RiskFlowLine } from "./RiskFlowLine";

function Scene({
  patient,
  patients,
  activeAlertId,
  eventStatus,
  isStreaming,
  onSelectDevice,
  onEmergencyCall,
  onSelectPatient
}) {
  const controlsRef = useRef();
  const emergencyMode = patient.level === "critical" && eventStatus !== "已完成";

  return (
    <>
      <PerspectiveCamera makeDefault position={[0.25, 1.92, 5.95]} fov={39} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[3.8, 4.6, 3.5]} intensity={2.5} castShadow />
      <pointLight position={[-2.5, 1.4, 2.2]} intensity={1.2} color="#9fe4d9" />
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.1, 72]} />
        <meshStandardMaterial color="#d9e8e5" roughness={0.88} />
      </mesh>
      <BraceletModel
        position={[-1.78, 0.08, 0.08]}
        heartRate={patient.heartRate}
        spo2={patient.spo2}
        battery={patient.battery}
        signal={patient.signal}
        riskLevel={patient.level}
        isStreaming={isStreaming}
        onSelect={() => onSelectDevice("bracelet")}
      />
      <BedCallButtonModel
        position={[-0.03, -0.04, 0.08]}
        room={patient.room}
        pressed={patient.callPressed}
        signal={patient.signal}
        emergencyMode={emergencyMode}
        onEmergencyCall={onEmergencyCall}
      />
      <CaregiverDashboardModel
        position={[1.86, 0.1, 0.0]}
        patients={patients}
        selectedPatientId={patient.id}
        activeAlertId={activeAlertId}
        onSelectPatient={onSelectPatient}
      />
      <RiskFlowLine points={[[-1.0, 0.24, 0.3], [-0.64, 0.62, 0.3], [-0.34, 0.27, 0.24]]} level={patient.level} />
      <RiskFlowLine points={[[0.56, 0.24, 0.28], [1.02, 0.62, 0.24], [1.38, 0.34, 0.2]]} level={patient.level} delay={0.38} />
      <Text position={[0, 0.98, 0.08]} fontSize={0.088} color="#17343d" anchorX="center">
        device packet → API → risk engine → caregiver dashboard
      </Text>
      <ContactShadows position={[0, -0.88, 0]} opacity={0.28} scale={7} blur={1.8} far={2.8} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        autoRotate
        autoRotateSpeed={0.12}
        enableDamping
        dampingFactor={0.07}
        target={[0, -0.06, 0]}
        minDistance={3.35}
        maxDistance={7.3}
        maxPolarAngle={Math.PI / 2.02}
      />
    </>
  );
}

export function ModelScene(props) {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
