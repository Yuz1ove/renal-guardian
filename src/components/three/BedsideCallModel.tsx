import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { BedsideCallPacket, RiskLevel } from "../../types";

const levelColor: Record<RiskLevel, string> = {
  stable: "#2f8f86",
  attention: "#d6a441",
  warning: "#df7d2e",
  critical: "#c94b4b"
};

export function BedsideCallModel({
  packet,
  level,
  onSelect
}: {
  packet: BedsideCallPacket;
  level: RiskLevel;
  onSelect: () => void;
}) {
  const buttonRef = useRef<THREE.Mesh>(null);
  const color = packet.deviceOnline ? levelColor[level] : "#8a99a0";

  useFrame(({ clock }) => {
    if (!buttonRef.current) return;
    const material = buttonRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = packet.buttonPressed || level === "critical" ? 1.2 + Math.sin(clock.elapsedTime * 7) * 0.45 : 0.35;
  });

  return (
    <group
      position={[-0.25, 0, -0.05]}
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
      <mesh position={[-0.3, -0.52, 0]}>
        <boxGeometry args={[1.8, 0.3, 1.05]} />
        <meshStandardMaterial color="#fbfdfc" roughness={0.62} />
      </mesh>
      <mesh position={[0.35, -0.28, -0.05]}>
        <boxGeometry args={[0.64, 0.18, 0.52]} />
        <meshStandardMaterial color="#dcefeb" roughness={0.55} />
      </mesh>
      <mesh position={[-0.8, -0.16, 0.25]}>
        <boxGeometry args={[0.68, 0.5, 0.46]} />
        <meshStandardMaterial color="#f6faf9" roughness={0.45} />
      </mesh>
      <mesh position={[-0.8, 0.18, 0.25]}>
        <boxGeometry args={[0.52, 0.18, 0.33]} />
        <meshStandardMaterial color="#17343d" roughness={0.36} />
      </mesh>
      <mesh ref={buttonRef} position={[-0.8, 0.16, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 36]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-0.52, 0.34, 0.27]}>
        <sphereGeometry args={[0.045, 20, 12]} />
        <meshStandardMaterial color={packet.deviceOnline ? "#2f8f86" : "#c94b4b"} emissive={packet.deviceOnline ? "#2f8f86" : "#c94b4b"} />
      </mesh>
      <Text position={[-0.8, -0.18, 0.55]} fontSize={0.08} color="#17343d" anchorX="center">
        {packet.longPressEmergency ? "緊急求助" : packet.buttonPressed ? "一般協助" : "待命"}
      </Text>
      <Text position={[-0.25, -0.92, 0.28]} fontSize={0.12} color="#1f5f5a" anchorX="center">
        B 床邊呼叫與夜間提醒
      </Text>
    </group>
  );
}
