import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { RiskLevel } from "../../types";

const colorMap: Record<RiskLevel, string> = {
  stable: "#2f8f86",
  attention: "#d6a441",
  warning: "#df7d2e",
  critical: "#c94b4b"
};

export function DataPulseLine({
  start,
  end,
  level,
  offset = 0
}: {
  start: [number, number, number];
  end: [number, number, number];
  level: RiskLevel;
  offset?: number;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const midpoint = new THREE.Vector3(
      (start[0] + end[0]) / 2,
      Math.max(start[1], end[1]) + 0.55,
      (start[2] + end[2]) / 2
    );
    return new THREE.CatmullRomCurve3([new THREE.Vector3(...start), midpoint, new THREE.Vector3(...end)]);
  }, [end, start]);
  const points = useMemo(() => curve.getPoints(36), [curve]);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * 0.28 + offset) % 1;
    pulseRef.current?.position.copy(curve.getPoint(t));
  });

  return (
    <group>
      <Line points={points} color={colorMap[level]} lineWidth={2} transparent opacity={0.55} />
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.055, 24, 16]} />
        <meshStandardMaterial color={colorMap[level]} emissive={colorMap[level]} emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}
