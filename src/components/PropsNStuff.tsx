import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import type { Euler, Vector3 } from "@react-three/fiber";

const deg = THREE.MathUtils.degToRad;

function PinkMaterial() {
  return <meshStandardMaterial color="hotpink" side={THREE.DoubleSide} />;
}

export function Halfpipe({
  radius,
  length,
  rotation,
}: {
  radius: number;
  length: number;
  rotation?: Euler;
}) {
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh
        castShadow
        receiveShadow
        rotation={rotation}
        position={[0, radius - 0.07, 0]}
      >
        <cylinderGeometry
          args={[radius, radius, length, 32, 1, true, 0, Math.PI]}
        />
        <PinkMaterial />
      </mesh>
    </RigidBody>
  );
}

/**
 * A 90° bend of open pipe. `radius` is the bend radius; the tube radius is 1.
 * `thetaLength` controls how much of the tube's cross-section is drawn
 * (Math.PI = open half-pipe, Math.PI * 2 = closed tube).
 */
export function Pipe90({
  radius,
  rotation,
  position,
  thetaLength = Math.PI,
}: {
  radius: number;
  rotation?: Euler;
  position?: Vector3;
  thetaLength?: number;
}) {
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh castShadow receiveShadow rotation={rotation} position={position}>
        {/* radius, tube, radialSegments, tubularSegments, arc, thetaStart, thetaLength */}
        <torusGeometry
          args={[radius, 1, 32, 100, deg(90), Math.PI, thetaLength]}
        />
        <PinkMaterial />
      </mesh>
    </RigidBody>
  );
}

export function Funnel({
  radius,
  position,
}: {
  radius: number;
  position?: Vector3;
}) {
  return (
    <RigidBody type="fixed" colliders="trimesh" position={position}>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, deg(90), deg(90)]}>
        <cylinderGeometry args={[radius, 2, 1, 32, 1, true, 0]} />
        <PinkMaterial />
      </mesh>
    </RigidBody>
  );
}
