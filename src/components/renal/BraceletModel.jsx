import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { levelMeta } from "../../data/renalDemoData";
import { DeviceLabel } from "./DeviceLabel";

export function BraceletModel({
  heartRate = 52,
  spo2 = 93,
  battery = 81,
  signal = 62,
  riskLevel = "stable",
  isStreaming = false,
  position = [0, 0, 0],
  onSelect
}) {
  const [hovered, setHovered] = useState(false);
  const moduleRef = useRef();
  const ledRef = useRef();
  const packetRef = useRef();
  const color = levelMeta[riskLevel]?.color ?? levelMeta.stable.color;
  const strapMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#17343d", roughness: 0.72, metalness: 0.04 }), []);

  useFrame(({ clock }) => {
    const pulse = riskLevel === "critical" ? 1 + Math.sin(clock.elapsedTime * 7) * 0.035 : 1;
    const hoverScale = hovered ? 1.035 : 1;
    moduleRef.current?.scale.setScalar(pulse * hoverScale);
    if (ledRef.current) {
      const material = ledRef.current.material;
      material.emissiveIntensity = riskLevel === "critical" ? 1.5 + Math.sin(clock.elapsedTime * 8) * 0.65 : 0.85;
    }
    if (packetRef.current) {
      packetRef.current.visible = isStreaming;
      const x = ((clock.elapsedTime * 0.48) % 1) * 0.95;
      packetRef.current.position.set(0.78 + x, 0.24 + Math.sin(clock.elapsedTime * 5) * 0.035, 0.2);
    }
  });

  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <group scale={hovered ? 1.025 : 1}>
        <mesh position={[0, -0.08, -0.08]} rotation={[Math.PI / 2, 0, 0]} material={strapMaterial}>
          <torusGeometry args={[0.78, 0.09, 10, 44, Math.PI * 1.72]} />
        </mesh>
        <RoundedBox ref={moduleRef} args={[0.9, 0.68, 0.24]} radius={0.105} smoothness={5} position={[0, 0.02, 0.1]}>
          <meshStandardMaterial color="#102730" roughness={0.45} metalness={0.12} />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.48, 0.035]} radius={0.045} smoothness={4} position={[0, 0.04, 0.245]}>
          <meshStandardMaterial color="#071b22" roughness={0.28} />
        </RoundedBox>
        <Text position={[-0.28, 0.18, 0.27]} fontSize={0.065} color="#9fe4d9" anchorX="left">
          {riskLevel === "critical" ? "立即關注" : `HR ${heartRate}`}
        </Text>
        <Text position={[-0.28, 0.04, 0.27]} fontSize={0.054} color="#e9fbf7" anchorX="left">
          SpO2 {spo2}
        </Text>
        <Text position={[-0.28, -0.09, 0.27]} fontSize={0.047} color="#b8d7d2" anchorX="left">
          BAT {battery}%  SIG {signal}%
        </Text>
        <mesh ref={ledRef} position={[0.35, -0.2, 0.27]}>
          <sphereGeometry args={[0.046, 18, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.52, 0.05, 0.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 18]} />
          <meshStandardMaterial color="#c94b4b" roughness={0.4} emissive="#7c2525" emissiveIntensity={0.25} />
        </mesh>
        <group position={[0, -0.02, -0.06]}>
          <mesh position={[-0.12, 0, -0.12]}>
            <sphereGeometry args={[0.05, 14, 10]} />
            <meshStandardMaterial color="#9fe4d9" emissive="#2f8f86" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0.12, 0, -0.12]}>
            <sphereGeometry args={[0.05, 14, 10]} />
            <meshStandardMaterial color="#9fe4d9" emissive="#2f8f86" emissiveIntensity={0.25} />
          </mesh>
        </group>
        <mesh ref={packetRef}>
          <sphereGeometry args={[0.04, 14, 10]} />
          <meshStandardMaterial color="#6bd7cc" emissive="#6bd7cc" emissiveIntensity={1.25} />
        </mesh>
      </group>
      <DeviceLabel position={[-0.88, -0.5, 0.62]} title="洗腎返家監測手環" lines={["心率監測", "血氧 / 活動量", "低訊號封包", "SOS 輔助按鍵"]} />
    </group>
  );
}
