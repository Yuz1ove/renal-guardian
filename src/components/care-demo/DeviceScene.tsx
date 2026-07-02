import { Html, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { PatientWithRisk } from "./mockPatients";
import { type DemoMode, scenePresets } from "./scenePresets";

interface DeviceSceneProps {
  mode: DemoMode;
  patients: PatientWithRisk[];
  activePatientId: string;
  bedsideEventActive: boolean;
  acknowledged: boolean;
  onModeChange: (mode: DemoMode) => void;
}

const modulePositions = {
  wearable: [-1.75, 0.08, 0.1] as const,
  bedside: [0, 0.02, 0.1] as const,
  team: [1.75, 0.12, 0] as const
};

function SceneLabel({
  position,
  title,
  lines,
  active = false
}: {
  position: [number, number, number];
  title: string;
  lines: string[];
  active?: boolean;
}) {
  return (
    <Html position={position} transform={false} center zIndexRange={[20, 10]} className={active ? "scene-label is-active" : "scene-label"}>
      <strong>{title}</strong>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </Html>
  );
}

function PacketLabel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} transform={false} center zIndexRange={[15, 5]} className="packet-label">
      {text}
    </Html>
  );
}

function CameraRig({ mode }: { mode: DemoMode }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const preset = scenePresets[mode];
    desiredPosition.set(...preset.cameraPosition);
    target.set(...preset.target);
    camera.position.lerp(desiredPosition, 0.08);
    controlsRef.current?.target.lerp(target, 0.12);
    controlsRef.current?.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={2.9}
      maxDistance={5.8}
      minPolarAngle={0.68}
      maxPolarAngle={1.34}
      minAzimuthAngle={-0.78}
      maxAzimuthAngle={0.78}
      enablePan={false}
      target={[0, 0.08, 0]}
    />
  );
}

function WearableModule({
  patient,
  active,
  onSelect
}: {
  patient: PatientWithRisk;
  active: boolean;
  onSelect: () => void;
}) {
  const ledRef = useRef<THREE.Mesh>(null);
  const packetRef = useRef<THREE.Mesh>(null);
  const color = patient.risk.level === "critical" ? "#c95656" : "#2f8f86";

  useFrame(({ clock }) => {
    if (ledRef.current) {
      const material = ledRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = active ? 1.2 + Math.sin(clock.elapsedTime * 6) * 0.24 : 0.62;
    }
    if (packetRef.current) {
      const t = (clock.elapsedTime * 0.42) % 1;
      packetRef.current.position.set(-1.12 + t * 0.65, 0.52 + Math.sin(clock.elapsedTime * 5) * 0.025, 0.32);
    }
  });

  return (
    <group position={modulePositions.wearable} onClick={onSelect}>
      <mesh position={[0, -0.1, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.54, 0.07, 12, 48, Math.PI * 1.72]} />
        <meshStandardMaterial color="#213943" roughness={0.72} />
      </mesh>
      <RoundedBox args={[0.82, 0.64, 0.2]} radius={0.09} smoothness={5} position={[0, 0.04, 0.05]}>
        <meshStandardMaterial color="#102730" roughness={0.42} metalness={0.1} />
      </RoundedBox>
      <RoundedBox args={[0.66, 0.46, 0.035]} radius={0.045} smoothness={4} position={[0, 0.05, 0.17]}>
        <meshStandardMaterial color="#f1fbf8" roughness={0.32} />
      </RoundedBox>
      <mesh ref={ledRef} position={[0.31, -0.19, 0.2]}>
        <sphereGeometry args={[0.05, 22, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.72} />
      </mesh>
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.04, 16, 10]} />
        <meshStandardMaterial color="#ef6f86" emissive="#ef6f86" emissiveIntensity={1.3} />
      </mesh>
      <SceneLabel
        active={active}
        position={[0, 0.92, 0.44]}
        title="手環監測"
        lines={[`HR ${patient.signals.heartRate}`, `SpO2 ${patient.signals.spo2}%`, `活動量 ${patient.signals.activityDropPercent}%`, "電量 78%", "訊號 weak"]}
      />
      {active ? <PacketLabel position={[0.58, 0.54, 0.38]} text="device packet → API" /> : null}
    </group>
  );
}

function BedsideModule({
  active,
  alert,
  onSelect
}: {
  active: boolean;
  alert: boolean;
  onSelect: () => void;
}) {
  const buttonRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!buttonRef.current) return;
    const material = buttonRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = alert ? 1.25 + Math.sin(clock.elapsedTime * 7) * 0.32 : 0.55;
  });

  return (
    <group position={modulePositions.bedside} onClick={onSelect}>
      <RoundedBox args={[1.12, 0.3, 0.82]} radius={0.08} smoothness={5} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#fbfdfc" roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[0.78, 0.2, 0.24]} radius={0.045} smoothness={4} position={[0, 0.03, -0.26]}>
        <meshStandardMaterial color="#17343d" roughness={0.4} />
      </RoundedBox>
      <mesh ref={buttonRef} position={[0, 0.04, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.12, 40]} />
        <meshStandardMaterial color="#c95656" emissive="#c95656" emissiveIntensity={0.62} roughness={0.38} />
      </mesh>
      <mesh position={[0.4, -0.05, 0.29]}>
        <boxGeometry args={[0.24, 0.05, 0.08]} />
        <meshStandardMaterial color="#607077" roughness={0.68} />
      </mesh>
      <mesh position={[0.43, 0.17, -0.16]}>
        <sphereGeometry args={[0.045, 20, 12]} />
        <meshStandardMaterial color={alert ? "#c95656" : "#2f8f86"} emissive={alert ? "#c95656" : "#2f8f86"} emissiveIntensity={0.75} />
      </mesh>
      <SceneLabel
        active={active}
        position={[0, 0.84, 0.48]}
        title="床邊求助"
        lines={[alert ? "一鍵求助已送出" : "一鍵求助待命", "夜間虛弱", "回報頭暈"]}
      />
      {active ? <PacketLabel position={[0.55, 0.43, 0.36]} text="呼叫訊號送出" /> : null}
    </group>
  );
}

function TeamDashboardModule({
  patients,
  active,
  acknowledged,
  onSelect
}: {
  patients: PatientWithRisk[];
  active: boolean;
  acknowledged: boolean;
  onSelect: () => void;
}) {
  return (
    <group position={modulePositions.team} rotation={[0, -0.08, 0]} onClick={onSelect}>
      <RoundedBox args={[1.56, 1.12, 0.12]} radius={0.04} smoothness={4} position={[0, 0.08, -0.04]}>
        <meshStandardMaterial color="#102730" roughness={0.42} />
      </RoundedBox>
      <RoundedBox args={[1.34, 0.86, 0.04]} radius={0.025} smoothness={3} position={[0, 0.08, 0.04]}>
        <meshStandardMaterial color="#17343d" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, -0.72, -0.05]}>
        <boxGeometry args={[0.16, 0.42, 0.12]} />
        <meshStandardMaterial color="#607077" roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.96, -0.03]}>
        <boxGeometry args={[0.72, 0.08, 0.32]} />
        <meshStandardMaterial color="#dce8e5" roughness={0.55} />
      </mesh>
      {patients.map((patient, index) => {
        const y = 0.3 - index * 0.24;
        const width = Math.max(0.18, patient.risk.score / 100) * 0.62;
        return (
          <group key={patient.id} position={[0, y, 0.075]}>
            <mesh>
              <boxGeometry args={[1.1, 0.14, 0.025]} />
              <meshStandardMaterial color={index === 0 ? "#eef7f4" : "#d7e6e2"} roughness={0.52} />
            </mesh>
            <mesh position={[-0.18 + width / 2, -0.045, 0.022]}>
              <boxGeometry args={[width, 0.035, 0.02]} />
              <meshStandardMaterial color={index === 0 ? "#c95656" : "#2f8f86"} emissive={index === 0 ? "#c95656" : "#2f8f86"} emissiveIntensity={0.28} />
            </mesh>
          </group>
        );
      })}
      <SceneLabel
        active={active}
        position={[0, 0.98, 0.44]}
        title="照護端"
        lines={["風險分數", "原因", "處置建議", acknowledged ? "已分派照護人員" : "A-203 立即關注"]}
      />
    </group>
  );
}

function FlowLines({ level }: { level: string }) {
  const color = level === "critical" ? "#ef6f86" : "#d86b80";
  return (
    <>
      <Line points={[[-1.15, 0.34, 0.3], [-0.68, 0.62, 0.28], [-0.28, 0.28, 0.22]]} color={color} lineWidth={2.4} transparent opacity={0.72} />
      <Line points={[[0.48, 0.27, 0.22], [0.92, 0.6, 0.18], [1.28, 0.34, 0.12]]} color={color} lineWidth={2.4} transparent opacity={0.72} />
    </>
  );
}

export function DeviceScene({ mode, patients, activePatientId, bedsideEventActive, acknowledged, onModeChange }: DeviceSceneProps) {
  const activePatient = patients.find((patient) => patient.id === activePatientId) ?? patients[0];
  const floorGeometry = useMemo(() => new THREE.CircleGeometry(1, 64), []);

  return (
    <>
      <color attach="background" args={["#f7fbfa"]} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[3.5, 4.6, 3.2]} intensity={2.2} castShadow />
      <pointLight position={[-2.4, 1.6, 2.4]} intensity={1.2} color="#9fe4d9" />
      <mesh position={[0, -0.62, 0.04]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.95, 0.9, 1]} geometry={floorGeometry} receiveShadow>
        <meshStandardMaterial color="#edf4f2" roughness={0.92} transparent opacity={0.58} />
      </mesh>
      <group scale={1.35} position={[0, -0.03, 0]}>
        <WearableModule patient={activePatient} active={mode === "wearable"} onSelect={() => onModeChange("wearable")} />
        <BedsideModule active={mode === "bedside"} alert={bedsideEventActive} onSelect={() => onModeChange("bedside")} />
        <TeamDashboardModule patients={patients} active={mode === "team"} acknowledged={acknowledged} onSelect={() => onModeChange("team")} />
        <FlowLines level={activePatient.risk.level} />
      </group>
      {mode === "overview" ? <PacketLabel position={[0, 1.38, 0.12]} text="手環資料 + 床邊求助事件 → API → risk engine → caregiver dashboard" /> : null}
      <CameraRig mode={mode} />
    </>
  );
}
