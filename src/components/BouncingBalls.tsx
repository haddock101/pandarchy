import { useRef, useState } from "react";
import {
  useFrame,
  useThree,
  type ThreeEvent,
  type Vector3,
} from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useCursor, useTexture } from "@react-three/drei";
import * as THREE from "three";

// Scratch vector shared by all handlers, so clicks and frames don't allocate.
const forward = new THREE.Vector3();

type BouncingBallProps = {
  name: string;
  position: Vector3;
  bounceMultiplier: number;
  radius: number;
  mass: number;
  restitution: number;
  friction: number;
  /** Click impulse is bounceMultiplier / impulseDivisor. */
  impulseDivisor: number;
  /** Clicking toggles between these two colors. */
  colors: [string, string];
  /** Color before the first click; defaults to colors[0]. */
  initialColor?: string;
  canSleep?: boolean;
};

export function BouncingBall({
  name,
  position,
  bounceMultiplier,
  radius,
  mass,
  restitution,
  friction,
  impulseDivisor,
  colors: [colorA, colorB],
  initialColor = colorA,
  canSleep = true,
}: BouncingBallProps) {
  const ballRef = useRef<RapierRigidBody>(null);
  const [hovered, setHovered] = useState(false);
  const [color, setColor] = useState(initialColor);
  const { camera } = useThree();
  useCursor(hovered);

  const textures = useTexture({
    bumpMap: "/textures/sphereMap.jpg",
    roughnessMap: "/textures/sphereMap.jpg",
    aoMap: "/textures/stripe.jpg",
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    setColor((c) => (c === colorA ? colorB : colorA));
    if (!ballRef.current) return;
    camera
      .getWorldDirection(forward)
      .multiplyScalar(bounceMultiplier / impulseDivisor);
    ballRef.current.applyImpulseAtPoint(forward, e.point, true);
  };

  return (
    <RigidBody
      name={name}
      ref={ballRef}
      colliders="ball"
      restitution={restitution}
      friction={friction}
      mass={mass}
      position={position}
      canSleep={canSleep}
    >
      <mesh
        castShadow
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} {...textures} />
      </mesh>
    </RigidBody>
  );
}

export function ImpulseMarker() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;
    camera.getWorldDirection(forward);
    meshRef.current.lookAt(forward);
  });

  return (
    <mesh name="marker" ref={meshRef} position={[4.3, 0.4, 0.5]}>
      <boxGeometry args={[1, 0.1, 4]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
}
