import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RiskLevel, WearablePacket } from "../../types";

const levelColor: Record<RiskLevel, string> = {
  stable: "#2f8f86",
  attention: "#d6a441",
  warning: "#df7d2e",
  critical: "#c94b4b"
};

export function WearableModel({
  packet,
  level,
  onSelect
}: {
  packet: WearablePacket;
  level: RiskLevel;
  onSelect: () => void;
}) {
  const lightRef = useRef<THREE.Mesh>(null);
  const color = levelColor[level];

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const material = lightRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = level === "critical" ? 1.4 + Math.sin(clock.elapsedTime * 8) * 0.5 : 0.75;
  });

  return (
    <group
      position={[-1.75, 0.12, 0.12]}
      rotation={[0.02, 0.18, -0.02]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <mesh position={[0, -0.07, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.105, 18, 80]} />
        <meshStandardMaterial color="#2b3f47" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.02, 0.04]}>
        <boxGeometry args={[1.18, 0.9, 0.18]} />
        <meshStandardMaterial color="#15272f" roughness={0.45} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.02, 0.15]}>
        <boxGeometry args={[0.96, 0.68, 0.035]} />
        <meshStandardMaterial color="#ecf8f6" roughness={0.24} />
      </mesh>
      <Text position={[-0.36, 0.23, 0.19]} fontSize={0.105} color="#17343d" anchorX="left">
        HR {packet.heartRate}
      </Text>
      <Text position={[-0.36, 0.05, 0.19]} fontSize={0.085} color="#17343d" anchorX="left">
        活動 {packet.activityIndex}
      </Text>
      <Text position={[-0.36, -0.12, 0.19]} fontSize={0.08} color={packet.sosPressed ? "#c94b4b" : "#2f8f86"} anchorX="left">
        {packet.sosPressed ? "SOS 已送出" : "SOS 待命"}
      </Text>
      <Text position={[-0.36, -0.28, 0.19]} fontSize={0.075} color="#5f737b" anchorX="left">
        SIG {packet.signalQuality}% BAT {packet.battery}%
      </Text>
      <mesh ref={lightRef} position={[0.45, -0.27, 0.21]}>
        <sphereGeometry args={[0.06, 24, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, -0.74, 0.08]} fontSize={0.12} color="#1f5f5a" anchorX="center">
        A 手環監測與求助
      </Text>
    </group>
  );
}
