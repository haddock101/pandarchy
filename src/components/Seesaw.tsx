import { useRef } from 'react';
import { RapierRigidBody, RigidBody, useRevoluteJoint } from '@react-three/rapier';
import * as THREE from 'three';

const deg = THREE.MathUtils.degToRad;

const angle = deg(23); // ~23 degrees in radians
console.log(angle, Math.sin(angle), Math.cos(angle));

export function Seesaw({ position }: { position: [number, number, number] }) {
  const baseRef = useRef<RapierRigidBody>(null!);
  const boardRef = useRef<RapierRigidBody>(null!);

  // Rapier 2.2 useRevoluteJoint syntax accepts: [anchorA, anchorB, axis, limits]
  useRevoluteJoint(
    baseRef, 
    boardRef, 
    [
      [0, 1.0, 0],       // Anchor point on the base
      [0, 0, 0],         // Anchor point on the plank
      [0, 0, 1]         // Hinge axis (rotates around Z-axis)
             // ROTATION LIMITS: [Min Radian, Max Radian] (~ -23 to +23 degrees)
    ]
  );

  return (
    <group position={position}>
      {/* STATIC BASE */}
      <RigidBody ref={baseRef} type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 2, 4]} />
          <meshStandardMaterial color="skyblue" />
        </mesh>
      </RigidBody>

      {/* DYNAMIC PLANK */}
      <RigidBody 
        ref={boardRef} 
        type="dynamic" 
        position={[0, 1.2, 0]} 
        colliders="cuboid"
        enabledTranslations={[false, false, false]} // Keep the joint highly stable
      >
        <mesh 
          castShadow 
          receiveShadow

        >
          <boxGeometry args={[6, 0.05, 2.4]} />
          <meshStandardMaterial color="lightgray" />
        </mesh>
      </RigidBody>
    </group>
  );
}


