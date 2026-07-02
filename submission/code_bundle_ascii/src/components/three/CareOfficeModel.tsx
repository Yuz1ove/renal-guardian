import { Text } from "@react-three/drei";
import type { Patient, RiskResult } from "../../types";

const levelColor = {
  stable: "#2f8f86",
  attention: "#d6a441",
  warning: "#df7d2e",
  critical: "#c94b4b"
};

export function CareOfficeModel({
  patients,
  riskResults,
  onSelect
}: {
  patients: Patient[];
  riskResults: Record<string, RiskResult>;
  onSelect: () => void;
}) {
  const sorted = [...patients].sort((a, b) => riskResults[b.id].score - riskResults[a.id].score).slice(0, 4);

  return (
    <group
      position={[1.82, 0.16, -0.12]}
      rotation={[0, -0.16, 0]}
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
      <mesh position={[0, -0.12, -0.04]}>
        <boxGeometry args={[1.95, 1.42, 0.12]} />
        <meshStandardMaterial color="#17343d" roughness={0.38} />
      </mesh>
      <mesh position={[0, -0.96, -0.05]}>
        <boxGeometry args={[0.18, 0.58, 0.14]} />
        <meshStandardMaterial color="#51636a" roughness={0.5} />
      </mesh>
      <Text position={[-0.78, 0.42, 0.05]} fontSize={0.105} color="#9fe4d9" anchorX="left">
        居服員辦公室看板
      </Text>
      {sorted.map((patient, index) => {
        const risk = riskResults[patient.id];
        const y = 0.14 - index * 0.25;
        return (
          <group key={patient.id} position={[0, y, 0.03]}>
            <mesh>
              <boxGeometry args={[1.66, 0.18, 0.03]} />
              <meshStandardMaterial color={index === 0 ? "#eef7f4" : "#dbe8e5"} roughness={0.5} />
            </mesh>
            <Text position={[-0.72, -0.035, 0.04]} fontSize={0.07} color="#17343d" anchorX="left">
              {patient.name}
            </Text>
            <Text position={[0.35, -0.035, 0.04]} fontSize={0.07} color="#17343d" anchorX="left">
              {risk.score}
            </Text>
            <mesh position={[0.69, 0, 0.05]}>
              <boxGeometry args={[0.14, 0.12, 0.035]} />
              <meshStandardMaterial color={levelColor[risk.level]} emissive={levelColor[risk.level]} emissiveIntensity={0.35} />
            </mesh>
          </group>
        );
      })}
      <Text position={[0, -0.95, 0.08]} fontSize={0.12} color="#1f5f5a" anchorX="center">
        C 風險排序與通報建議
      </Text>
    </group>
  );
}
