import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { DeviceLabel } from "./DeviceLabel";

export function BedCallButtonModel({
  room = "A-203",
  pressed = false,
  signal = 62,
  emergencyMode = false,
  position = [0, 0, 0],
  onEmergencyCall
}) {
  const [hovered, setHovered] = useState(false);
  const [buttonDown, setButtonDown] = useState(false);
  const buttonRef = useRef();
  const pulseRef = useRef();
  const packetRef = useRef();
  const warningColor = emergencyMode || pressed ? "#c94b4b" : "#2f8f86";
  const weakSignal = signal < 40;

  useFrame(({ clock }) => {
    if (buttonRef.current) {
      const y = buttonDown ? 0.105 : 0.16;
      buttonRef.current.position.y += (y - buttonRef.current.position.y) * 0.24;
      buttonRef.current.scale.setScalar(hovered ? 1.04 : 1);
      buttonRef.current.material.emissiveIntensity = emergencyMode ? 1.2 + Math.sin(clock.elapsedTime * 8) * 0.55 : 0.42;
    }
    if (pulseRef.current) {
      const wave = ((clock.elapsedTime * 1.25) % 1) + 0.3;
      pulseRef.current.scale.set(wave, wave, wave);
      pulseRef.current.material.opacity = emergencyMode || pressed ? Math.max(0, 0.42 - wave * 0.22) : 0;
    }
    if (packetRef.current) {
      packetRef.current.visible = weakSignal;
      const x = ((clock.elapsedTime * 0.22) % 1) * 0.7;
      packetRef.current.position.set(0.54 + x, 0.16, 0.16);
    }
  });

  function triggerCall(event) {
    event.stopPropagation();
    setButtonDown(true);
    window.setTimeout(() => setButtonDown(false), 180);
    onEmergencyCall?.();
  }

  return (
    <group
      position={position}
      onClick={triggerCall}
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
      <mesh position={[0, 0.02, 0.14]} onClick={triggerCall}>
        <boxGeometry args={[1.32, 0.72, 1.06]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <RoundedBox args={[1.16, 0.28, 0.92]} radius={0.11} smoothness={5} position={[0, -0.16, 0]}>
        <meshStandardMaterial color="#f9fcfb" roughness={0.52} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.18, 0.22]} radius={0.045} smoothness={4} position={[0, 0.14, -0.32]}>
        <meshStandardMaterial color="#17343d" roughness={0.34} />
      </RoundedBox>
      <Text position={[-0.27, 0.18, -0.2]} fontSize={0.052} color="#9fe4d9" anchorX="left">
        {pressed || emergencyMode ? "已送出求助" : weakSignal ? "弱訊號模式" : "CALL READY"}
      </Text>
      <Text position={[-0.27, 0.08, -0.2]} fontSize={0.045} color="#e5f7f4" anchorX="left">
        ROOM {room}
      </Text>
      <mesh ref={buttonRef} position={[0, 0.16, 0.08]} rotation={[Math.PI / 2, 0, 0]} onClick={triggerCall}>
        <cylinderGeometry args={[0.25, 0.28, 0.13, 36]} />
        <meshStandardMaterial color="#c94b4b" roughness={0.38} emissive="#c94b4b" emissiveIntensity={0.42} />
      </mesh>
      <mesh ref={pulseRef} position={[0, 0.18, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.012, 8, 54]} />
        <meshBasicMaterial color="#c94b4b" transparent opacity={0.24} />
      </mesh>
      <mesh position={[0.47, -0.02, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.035, 12]} />
        <meshStandardMaterial color="#7b8b90" roughness={0.7} />
      </mesh>
      <mesh position={[0.35, -0.02, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.035, 12]} />
        <meshStandardMaterial color="#7b8b90" roughness={0.7} />
      </mesh>
      <mesh position={[0.23, -0.02, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.035, 12]} />
        <meshStandardMaterial color="#7b8b90" roughness={0.7} />
      </mesh>
      <mesh position={[-0.42, -0.08, -0.42]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.026, 0.026, 0.46, 10]} />
        <meshStandardMaterial color="#607077" roughness={0.66} />
      </mesh>
      <mesh position={[-0.57, -0.08, -0.52]}>
        <boxGeometry args={[0.22, 0.06, 0.1]} />
        <meshStandardMaterial color="#dce8e5" roughness={0.55} />
      </mesh>
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.035, 12, 8]} />
        <meshStandardMaterial color="#d6a441" emissive="#d6a441" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0.43, 0.22, -0.16]}>
        <sphereGeometry args={[0.035, 12, 8]} />
        <meshStandardMaterial color={warningColor} emissive={warningColor} emissiveIntensity={emergencyMode ? 1.2 : 0.45} />
      </mesh>
      <DeviceLabel position={[-0.74, -0.54, 0.62]} title="床邊緊急求助盒" lines={["一鍵呼叫", "床邊固定", "聲光提醒", "斷網備援訊號"]} />
    </group>
  );
}
