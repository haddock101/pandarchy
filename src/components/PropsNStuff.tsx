import * as THREE from "three";
import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import type { Euler, Vector3 } from "@react-three/fiber";

const deg = THREE.MathUtils.degToRad;

function PinkMaterial() {
  return <meshStandardMaterial color="hotpink" side={THREE.DoubleSide} />;
}


export function Quarterpipe({
  radius,
  length,
  rotation,
  position,
}: {
  radius: number;
  length: number;
  rotation?: Euler;
  position?: Vector3;
}) {
  if (position === undefined) {
    position = [0, radius - 0.07, 0];
  }
  return (
    <RigidBody type="fixed" colliders="trimesh">
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
  radius,
  length,
  rotation
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

    stemLength = length * (stemLength/(stemLength+headLength)); // Scale stemLength to fit within the total length of the arrow
    headLength = length * (headLength/(stemLength+headLength));

    // Start at tip of the arrow head
    shape.moveTo(0, 0)

    // Flare out to the left edge of the arrow head
    shape.lineTo(headWidth, stemLength)

    // Pull back into the right side of the stem
    shape.lineTo(stemWidth / 2, stemLength)

    // Line down to the bottom right of the stem
    shape.lineTo(stemWidth / 2, headLength + stemLength)

    // Line up to the other side of the stem
    shape.lineTo( -stemWidth / 2, headLength + stemLength)

    // Up to the left edge of the arrow head
    shape.lineTo( -stemWidth / 2, stemLength )
    
    // Out to the left edge of the arrow head
    shape.lineTo(-headWidth, stemLength )    
    
    // Close the path automatically back to the start
    return shape;

    
  }, [stemWidth, stemLength, headWidth, headLength])

  // Extrusion settings (depth, bevels, etc.)
  const extrudeSettings = useMemo(() => ({
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3
  }), [depth])

  return (
    
      <extrudeGeometry args={[arrowShape, extrudeSettings]} />
    
  )
}