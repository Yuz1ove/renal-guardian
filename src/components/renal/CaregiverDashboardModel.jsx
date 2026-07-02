import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { levelMeta, sortByRisk } from "../../data/renalDemoData";
import { DeviceLabel } from "./DeviceLabel";

export function CaregiverDashboardModel({
  patients = [],
  selectedPatientId,
  activeAlertId,
  position = [0, 0, 0],
  onSelectPatient
}) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const badgeRef = useRef();
  const sortedPatients = sortByRisk(patients).slice(0, 4);

  useFrame(({ clock }) => {
    if (!badgeRef.current) return;
    const scale = activeAlertId ? 1 + Math.sin(clock.elapsedTime * 6) * 0.06 : 1;
    badgeRef.current.scale.setScalar(scale);
  });

  return (
    <group position={position} rotation={[0, -0.16, 0]}>
      <RoundedBox args={[1.78, 1.2, 0.1]} radius={0.04} smoothness={3} position={[0, 0.02, -0.05]}>
        <meshStandardMaterial color="#102730" roughness={0.42} />
      </RoundedBox>
      <RoundedBox args={[1.58, 0.94, 0.035]} radius={0.025} smoothness={3} position={[0, 0.06, 0.02]}>
        <meshStandardMaterial color="#17343d" roughness={0.48} />
      </RoundedBox>
      <mesh position={[0, -0.75, -0.07]}>
        <boxGeometry args={[0.18, 0.48, 0.12]} />
        <meshStandardMaterial color="#607077" roughness={0.55} />
      </mesh>
      <mesh position={[0, -1.02, -0.05]}>
        <boxGeometry args={[0.82, 0.08, 0.42]} />
        <meshStandardMaterial color="#dce8e5" roughness={0.5} />
      </mesh>
      <Text position={[-0.68, 0.44, 0.05]} fontSize={0.062} color="#9fe4d9" anchorX="left">
        居服員看板
      </Text>
      <Text position={[0.48, 0.44, 0.05]} fontSize={0.052} color={activeAlertId ? "#ffd6d6" : "#cde7e2"} anchorX="center">
        {activeAlertId ? "新事件" : "同步中"}
      </Text>
      {activeAlertId ? (
        <mesh ref={badgeRef} position={[0.74, 0.45, 0.062]}>
          <sphereGeometry args={[0.045, 14, 10]} />
          <meshStandardMaterial color="#c94b4b" emissive="#c94b4b" emissiveIntensity={1.3} />
        </mesh>
      ) : null}
      {sortedPatients.map((patient, index) => {
        const color = levelMeta[patient.level]?.color ?? "#2f8f86";
        const isActive = patient.id === activeAlertId || patient.id === selectedPatientId || hoveredRow === patient.id;
        const y = 0.25 - index * 0.2;
        return (
          <group
            key={patient.id}
            position={[0, y, 0.04]}
            onClick={(event) => {
              event.stopPropagation();
              onSelectPatient?.(patient);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHoveredRow(patient.id);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHoveredRow(null);
              document.body.style.cursor = "default";
            }}
          >
            <RoundedBox args={[1.42, 0.14, 0.025]} radius={0.018} smoothness={2}>
              <meshStandardMaterial color={isActive ? "#eef7f4" : "#d7e6e2"} roughness={0.5} />
            </RoundedBox>
            <Text position={[-0.63, -0.025, 0.035]} fontSize={0.045} color="#17343d" anchorX="left">
              {patient.name}
            </Text>
            <Text position={[-0.12, -0.025, 0.035]} fontSize={0.045} color="#17343d" anchorX="left">
              {patient.score}
            </Text>
            <Text position={[0.15, -0.025, 0.035]} fontSize={0.039} color="#17343d" anchorX="left">
              {levelMeta[patient.level].label}
            </Text>
            <mesh position={[0.58, 0, 0.04]}>
              <boxGeometry args={[0.18, 0.09, 0.026]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 0.85 : 0.22} />
            </mesh>
          </group>
        );
      })}
      <DeviceLabel position={[-0.78, -0.82, 0.58]} title="照護團隊後台" lines={["居服員看板", "風險排序", "事件派工", "已確認 / 已完成"]} />
    </group>
  );
}
