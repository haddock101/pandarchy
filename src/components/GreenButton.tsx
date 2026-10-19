import { useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { IMPULSE_LAYER } from "./impulse.ts";
import { IS_TOUCH_SCREEN } from "../touch.ts";

type GreenButtonProps = ThreeElements["group"] & {
  position?: [number, number, number];
  /** Brighter glow while the pointer is over it. */
  hovered?: boolean;
  /** Whether this is the button to press: lit buttons glow and ripple, unlit ones only respond to hover. */
  lit?: boolean;
};

const CAP_RADIUS = 0.2;
const GREEN = new THREE.Color("chartreuse");
// The cap's glow breathes slowly; every RIPPLE_PERIOD a faint ring spreads out from it as a hint
const PULSE_SPEED = 2.2; // radians per second
const RIPPLE_PERIOD = 2.2; // seconds
const RIPPLE_SPREAD = 2.2; // how far the ring grows, in cap radii
// On a phone a button is only a few pixels wide, so touch screens get a bigger, invisible target
const TOUCH_TARGET_RADIUS = 0.6;

/**
 * A push button on the catapult board: press and drag on it to charge a launch. Pointer handlers passed
 * in go on the whole button. Its green cap glows softly, and a faint ring ripples out from it now and then.
 */
function GreenButton({ position = [-2, 0.05, 0], hovered = false, lit = true, ...handlers }: GreenButtonProps) {
  const capMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const ripple = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>(null);
  // Each button starts its pulse at a different moment, so two side by side don't blink in unison
  const phase = useMemo(() => position[0] * 1.7, [position]);

  useFrame(({ elapsed }) => {
    const t = elapsed + phase;
    const material = capMaterial.current;
    if (material) {
      const breathe = 0.5 + 0.5 * Math.sin(t * PULSE_SPEED);
      material.emissiveIntensity = lit
        ? (hovered ? 0.9 : 0.25) + breathe * (hovered ? 0.5 : 0.35)
        : hovered ? 0.3 : 0;
    }
    const ring = ripple.current;
    if (ring) {
      const p = (t / RIPPLE_PERIOD) % 1; // 0 → 1 as the ring spreads
      ring.scale.setScalar(1 + p * (RIPPLE_SPREAD - 1));
      ring.material.opacity = lit ? (1 - p) * (1 - p) * (hovered ? 0.7 : 0.4) : 0;
    }
  });

  return (
    <group name="green-button" position={position} {...handlers}>
      <mesh position={[0, 0.025, 0]} onUpdate={(mesh) => mesh.layers.enable(IMPULSE_LAYER)}>
        <cylinderGeometry args={[CAP_RADIUS, 0.225, 0.015, 32]} />
        <meshStandardMaterial
          ref={capMaterial}
          color="chartreuse"
          emissive={GREEN}
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 0, 0]} onUpdate={(mesh) => mesh.layers.enable(IMPULSE_LAYER)}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* A thin glowing ring that spreads out from the cap and fades: "press here". Ignores the pointer. */}
      <mesh ref={ripple} position={[0, 0.034, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
        <ringGeometry args={[CAP_RADIUS * 0.92, CAP_RADIUS, 48]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {IS_TOUCH_SCREEN && (
        <mesh name="button-touch-target" visible={false}>
          <cylinderGeometry args={[TOUCH_TARGET_RADIUS, TOUCH_TARGET_RADIUS, 0.3, 16]} />
          <meshBasicMaterial />
        </mesh>
      )}
    </group>
  );
}
export default GreenButton;
