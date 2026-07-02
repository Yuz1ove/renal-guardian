import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { levelMeta } from "../../data/renalDemoData";

export function RiskFlowLine({ points, level = "stable", delay = 0 }) {
  const dotRef = useRef();
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), [points]);
  const linePoints = useMemo(() => curve.getPoints(42), [curve]);
  const color = levelMeta[level]?.color ?? "#2f8f86";

  useFrame(({ clock }) => {
    if (!dotRef.current) return;
    const t = (clock.elapsedTime * 0.22 + delay) % 1;
    dotRef.current.position.copy(curve.getPoint(t));
  });

  return (
    <group>
      <Line points={linePoints} color={color} lineWidth={2} transparent opacity={0.62} />
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.052, 14, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}
