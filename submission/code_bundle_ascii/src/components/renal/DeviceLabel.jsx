import { Text } from "@react-three/drei";

export function DeviceLabel({ position, title, lines = [], align = "left" }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[1.38, 0.18 + lines.length * 0.15, 0.018]} />
        <meshStandardMaterial color="#ffffff" roughness={0.55} transparent opacity={0.94} />
      </mesh>
      <Text position={[-0.62, 0.06, 0.02]} fontSize={0.075} color="#17343d" anchorX={align}>
        {title}
      </Text>
      {lines.map((line, index) => (
        <Text key={line} position={[-0.62, -0.09 - index * 0.14, 0.02]} fontSize={0.058} color="#2f756f" anchorX={align}>
          {line}
        </Text>
      ))}
    </group>
  );
}
