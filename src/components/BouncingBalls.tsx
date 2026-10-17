import { useRef, useState, useMemo } from "react";
import { useFrame, type Vector3 } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useCursor, useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  IMPULSE_LAYER,
  aim,
  impulseDirection,
  startCharge,
  updateCharge,
  releaseCharge,
  cancelCharge,
} from "./impulse.ts";

const SPHERE_SEGMENTS = 64; // Number of segments for the sphere geometry

// Gap between the marker's tip and the hovered surface.
const MARKER_GAP = 0.005;
const MARKER_SIZE = 0.25;
// How far the marker is pulled back from the surface at full charge.
const MAX_PULL = 1.5;
const MARKER_COLOR_EMPTY = new THREE.Color("white");
const MARKER_COLOR_FULL = new THREE.Color("red");

// The marker's own raycaster; R3F's shared one drives pointer events and must stay on all layers.
const markerRaycaster = new THREE.Raycaster();
markerRaycaster.layers.set(IMPULSE_LAYER);
const hitNormal = new THREE.Vector3();

type BouncingBallProps = {
  name: string;
  position: Vector3;
  impulseMultiplier: number;
  impulseDivisor: number; 
  radius: number;
  restitution: number;
  friction: number;
  density: number;
  colors: [string, string];
  initialColor?: string;
  canSleep?: boolean;
  togglePhysics: (value?: boolean) => void;
  toggleControls: (value?: boolean) => void;
};

export function BouncingBall({
  name,
  position,
  impulseMultiplier,
  radius,
  density,
  impulseDivisor,
  restitution,
  friction,
  colors: [colorA, colorB],
  initialColor = colorA,
  canSleep = true,
  togglePhysics,
  toggleControls,
}: BouncingBallProps) {
  const ballRef = useRef<RapierRigidBody>(null!);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const [color, setColor] = useState(initialColor);

  const textures = useTexture({
    bumpMap: "/textures/sphereMap.jpg",
    roughnessMap: "/textures/sphereMap.jpg",
    aoMap: "/textures/stripe.jpg",
  });

  return (
    <RigidBody
      name={name}
      ref={ballRef}
      colliders="ball"
      restitution={restitution}
      friction={friction}
      density={density} 
      position={position}
      canSleep={canSleep}
    >
      <mesh
        castShadow
        onUpdate={(mesh) => mesh.layers.enable(IMPULSE_LAYER)}
        // onClick={handleClick}
        onPointerDown={(e) => {
          // togglePhysics(false)
          toggleControls(false)
          startCharge(e)
        }}
        onPointerMove={updateCharge}
        onPointerUp={() => {
          // Unpause so the ball flies off right away instead of waiting for the pointer to leave it
          togglePhysics(false)
          toggleControls(true)
          if (releaseCharge(ballRef.current, impulseMultiplier / impulseDivisor)) {
            setColor((c) => (c === colorA ? colorB : colorA))
          }
        }}
        onPointerCancel={() => {
          cancelCharge()
          toggleControls(true)
        }}
        onPointerOver={() => {
          setHovered(true)
          togglePhysics(true)
          toggleControls(true)
        }}
        onPointerOut={() => {
          setHovered(false)
          togglePhysics(false)
          // toggleControls(false)
        }}
      >
        <sphereGeometry args={[radius, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <meshStandardMaterial color={color} {...textures} />
      </mesh>
    </RigidBody>
  );
}

export function ImpulseMarker() {
  const markerRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const stemRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ pointer, camera, scene }) => {
    const marker = markerRef.current;
    const halo = haloRef.current;
    const stem = stemRef.current;
    const material = materialRef.current;
    if (!marker || !halo || !stem || !material) return;

    let point: THREE.Vector3;
    if (aim.active) {
      // Aim is locked while charging; the drag only changes the strength.
      point = aim.point;
      hitNormal.copy(aim.normal);
    } else {
      markerRaycaster.setFromCamera(pointer, camera);
      const [hit] = markerRaycaster.intersectObjects(scene.children, true);
      marker.visible = !!hit?.face;
      if (!hit?.face) return;
      point = hit.point;
      hitNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
      impulseDirection.copy(hitNormal).normalize();
    }
    marker.visible = true;

    // Pull the marker back from the surface like a slingshot: the further, the stronger.
    const charge = aim.active ? aim.charge : 0;
    const pull = MARKER_GAP + charge * MAX_PULL;
    marker.position.copy(point).addScaledVector(hitNormal, pull);
    marker.lookAt(point);

    halo.scale.setScalar(1 + charge);
    // The stem spans from the halo to the surface, so its length shows the strength too.
    stem.visible = charge > 0;
    stem.scale.set(1, pull, 1);
    stem.position.z = pull / 2;

    material.color.lerpColors(MARKER_COLOR_EMPTY, MARKER_COLOR_FULL, charge);
    material.emissive.copy(material.color);
  });

  const halo = useMemo(() => {
    const geometry = new THREE.SphereGeometry(MARKER_SIZE, 32, 32, 0, (Math.PI * 2), Math.PI / 8, Math.PI / 16);
    geometry.translate(0, -MARKER_SIZE / 1.1, 0) // Move the halo so that it aligns with the center of the sphere
    geometry.rotateX(-Math.PI / 2)
    return geometry;
  }, []);

  // const halo = new THREE.ExtrudeGeometry([{arrowShape, extrudeSettings}]);
  return (
    <group ref={markerRef} name="marker" visible={false}>
      <mesh geometry={halo} castShadow ref={haloRef}>
        <meshStandardMaterial
          ref={materialRef}
          color="white"
          emissive="white" emissiveIntensity={2}
        />
      </mesh>
      {/* Unit-height cylinder lying along +Z (towards the surface); scaled to the pull distance each frame */}
      <mesh ref={stemRef} rotation-x={Math.PI / 2} visible={false}>
        <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}
