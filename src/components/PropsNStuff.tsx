import * as THREE from "three";
import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { CHUTE_GROUPS } from "../collisionGroups.ts";
import { onChuteContactEnter, onChuteContactExit } from "./chuteDamping.ts";
import type { Euler, Vector3 } from "@react-three/fiber";


const deg = THREE.MathUtils.degToRad;

function PinkMaterial() {
  return <meshStandardMaterial color="hotpink" side={THREE.DoubleSide} />;
}
function ChartreuseMaterial() {
  return <meshStandardMaterial color="chartreuse" side={THREE.DoubleSide} />;
}

export function Corner({
  id,
  radius,
  rotation,
  position,
}: {
  id: string;
  radius: number;
  rotation?: Euler;
  position?: Vector3;
}) {
  if (position === undefined) {
    position = [0, radius - 0.078, 0];
  }
  return (
    <RigidBody name={id} friction={0} type="fixed" colliders="trimesh">
      <mesh
        castShadow
        receiveShadow
        rotation={rotation}
        position={position}
      >
        <sphereGeometry
          args={[radius, 32, 32, 0, Math.PI / 2, 0, Math.PI / 2]}
        />
        <PinkMaterial />
      </mesh>
    </RigidBody>
  );
}

export function Quarterpipe({
  id,
  radius,
  length,
  rotation,
  position,
}: {
  id: string;
  radius: number;
  length: number;
  rotation?: Euler;
  position?: Vector3;
}) {
  if (position === undefined) {
    position = [0, radius - 0.078, 0];
  }
  return (
    <RigidBody name={id} friction={0} type="fixed" colliders="trimesh">
      <mesh
        castShadow
        receiveShadow
        rotation={rotation}
        position={position}
      >
        <cylinderGeometry
          args={[radius, radius, length, 32, 1, true, 0, Math.PI / 2]}
        />
        <PinkMaterial />
      </mesh>
    </RigidBody>
  );
}

export function Halfpipe({
  id,
  radius,
  length,
  rotation,
  position,
}: {
  id: string;
  radius: number;
  length: number;
  rotation?: Euler;
  position?: Vector3;
}) {
  return (
    <RigidBody
      name={id}
      collisionGroups={CHUTE_GROUPS}
      // Balls roll with little drag while touching any chute piece
      onCollisionEnter={onChuteContactEnter}
      onCollisionExit={onChuteContactExit}
      friction={0} type="fixed" colliders="trimesh">
      <mesh
        castShadow
        receiveShadow
        rotation={rotation}
        position={position ?? [0, 0.922, 0]}
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
  id,
  rotation,
  position,
  thetaLength = Math.PI,
}: {
  id: string;
  radius: number;
  rotation?: Euler;
  position?: Vector3;
  thetaLength?: number;
}) {
  return (
    <RigidBody
      name={id}
      ccd={true}
      collisionGroups={CHUTE_GROUPS}
      // Balls roll with little drag while touching any chute piece
      onCollisionEnter={onChuteContactEnter}
      onCollisionExit={onChuteContactExit}
      friction={0.5} type="fixed" colliders="trimesh">
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
  id,
  radius,
  position,
}: {
  id: string;
  radius: number;
  position?: Vector3;
}) {
  return (
    <RigidBody
      name={id}
      ccd={true}
      collisionGroups={CHUTE_GROUPS}
      // Balls roll with little drag while touching any chute piece
      onCollisionEnter={onChuteContactEnter}
      onCollisionExit={onChuteContactExit}
      friction={0} type="fixed" colliders="trimesh" position={position}>
      <mesh receiveShadow position={[0, 1.875, 0]} rotation={[Math.PI / 2, deg(90), deg(90)]}>
        <cylinderGeometry args={[radius, radius*1.1, 0.25, 64, 1, true, 0]} />
        <PinkMaterial />
      </mesh>
      <mesh receiveShadow position={[0, 1.375, 0]} rotation={[Math.PI / 2, deg(90), deg(90)]}>
        <cylinderGeometry args={[radius/2.4, radius, 0.75, 64, 1, true, 0]} />
        <ChartreuseMaterial />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]} rotation={[Math.PI / 2, deg(90), deg(90)]}>
        <cylinderGeometry args={[radius/3, radius/2.4, 0.5, 64, 1, true, 0]} />
        <PinkMaterial />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]} rotation={[Math.PI / 2, deg(90), deg(90)]}>
        <cylinderGeometry args={[1, radius/3, 0.5, 64, 1, true, 0]} />
        <ChartreuseMaterial />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.25, 0]} rotation={[Math.PI / 2, deg(90), deg(90)]}>
        <cylinderGeometry args={[1, 1, 0.5, 64, 1, true, 0]} />
        <PinkMaterial />
      </mesh>
    </RigidBody>
  );
}

export function ParametricArrow({
  stemWidth = 0.4,
  stemLength = 1.5,
  headWidth = 1.2,
  headLength = 0.8,
  length = 2,
  depth = 0.2
}) {

  // Calculate and memorize the arrow shape whenever dimensions change
  const arrowShape = useMemo(() => {
    const shape = new THREE.Shape()

    // Scale stem and head proportionally so together they fit the total length of the arrow
    const scale = length / (stemLength + headLength);
    const stem = stemLength * scale;
    const head = headLength * scale;

    // Start at tip of the arrow head
    shape.moveTo(0, 0)

    // Flare out to the left edge of the arrow head
    shape.lineTo(headWidth, stem)

    // Pull back into the right side of the stem
    shape.lineTo(stemWidth / 2, stem)

    // Line down to the bottom right of the stem
    shape.lineTo(stemWidth / 2, head + stem)

    // Line up to the other side of the stem
    shape.lineTo(-stemWidth / 2, head + stem)

    // Up to the left edge of the arrow head
    shape.lineTo(-stemWidth / 2, stem)

    // Out to the left edge of the arrow head
    shape.lineTo(-headWidth, stem)

    // Close the path automatically back to the start
    return shape;

  }, [stemWidth, stemLength, headWidth, headLength, length])

  // Extrusion settings (depth, bevels, etc.)
  const extrudeSettings = useMemo(() => ({
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3
  }), [depth])

  return <extrudeGeometry args={[arrowShape, extrudeSettings]} />

}