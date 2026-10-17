import { useRef, useState } from 'react';
import { RapierRigidBody, RigidBody, useRevoluteJoint } from '@react-three/rapier';
import { useCursor } from '@react-three/drei';
import { IMPULSE_LAYER, startCharge, updateCharge, releaseCharge, cancelCharge } from './impulse.ts';

type SeesawProps = {
  position: [number, number, number];
  impulseMultiplier: number;
  // The board is far heavier than a ball, so its push is scaled by its mass; this tones that down.
  impulseDivisor?: number;
  toggleControls: (value?: boolean) => void;
};

export function Seesaw({ position, impulseMultiplier, impulseDivisor = 4, toggleControls }: SeesawProps) {
  const baseRef =   useRef<RapierRigidBody>(null!);
  const boardRef =  useRef<RapierRigidBody>(null!);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // Rapier 2.2 useRevoluteJoint syntax accepts: [anchorA, anchorB, axis, limits]
  useRevoluteJoint(
    baseRef, 
    boardRef, 
    [
      [0, 0.5, 0],       // Anchor point on the base
      [0, 0, 0],         // Anchor point on the plank
      [0, 0, 1],         // Hinge axis (rotates around Z-axis)
    ]
  );

  return (
    <group position={position}>
      <RigidBody ref={baseRef} type="fixed" position={[0, 0.55, 0]} colliders="cuboid" >
        <mesh castShadow receiveShadow >
          <cylinderGeometry args={[0.05, 0.05, 1, 4]} />
          <meshStandardMaterial color="skyblue" />
        </mesh>
      </RigidBody>
      <RigidBody 
        ref={boardRef} 
        type="dynamic" 
        density={201}
        position={[0, 1.15, 0]} 
        colliders="cuboid"
        enabledTranslations={[false, false, false]} // Keep the joint highly stable
      >
        <mesh 
          castShadow 
          receiveShadow
          onUpdate={(mesh) => mesh.layers.enable(IMPULSE_LAYER)}
          // Unlike the balls, hovering doesn't pause physics: the board covers most of the scene.
          onPointerDown={(e) => {
            toggleControls(false)
            startCharge(e)
          }}
          onPointerMove={updateCharge}
          onPointerUp={() => {
            toggleControls(true)
            const board = boardRef.current
            releaseCharge(board, (impulseMultiplier * board.mass()) / impulseDivisor)
          }}
          onPointerCancel={() => {
            cancelCharge()
            toggleControls(true)
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[6, 0.05, 5]} />
          <meshStandardMaterial color="lightgray" />
        </mesh>
      </RigidBody>
    </group>
  );
}


