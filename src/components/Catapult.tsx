import { useEffect, useMemo, useRef, useState } from 'react';
import { CuboidCollider, RapierRigidBody, RigidBody, TrimeshCollider, useRevoluteJoint } from '@react-three/rapier';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { IMPULSE_LAYER, startCharge, updateCharge, releaseCharge, cancelCharge } from './impulse.ts';
import { BASE_HEIGHT, BASE_Y, BOARD_SIZE, CUP_ANGLE, CUP_LEFT_ANGLE, CUP_RADIUS, CUP_RIGHT_ANGLE, CUP_X, CUP_Y, PIVOT_Y, REST_ANGLE } from './catapultLayout.ts';
import { clearHoverTarget, setHoverTarget, deg, num, type HoverTarget } from '../hoverInfo.ts';
import type { ThreeEvent } from '@react-three/fiber';

type CatapultProps = {
  position: [number, number, number];
  impulseMultiplier: number;
  // Clicks push with impulseMultiplier × the arm's mass, so they feel the same whatever ARM_MASS is; this scales that.
  // The default 0.7 lets a 90–100% drag land a ball from the right cup in the funnel (at impulseMultiplier 10).
  impulseDivisor?: number;
  toggleControls: (value?: boolean) => void;
  /** Called when a push is released on the arm. */
  onLaunch?: () => void;
};

// Light enough that a ball (mass ~0.5) landing in a cup tips the arm. Clicks scale with the mass, so they feel the same.
const ARM_MASS = 15;
// A soft spring in the hinge rewinds the arm to rest (right cup on the floor) after a launch, ready for
// the next ball. Its target is a degree past the floor, so the arm settles pressed gently against it.
// Rapier's default motor model is acceleration-based, so these don't depend on ARM_MASS.
// Tuned in a headless Rapier run: back at rest ~2s after a launch, without flinging the ball on its own.
const RETURN_TARGET = REST_ANGLE - THREE.MathUtils.degToRad(1.2);
const RETURN_STIFFNESS = 20;
const RETURN_DAMPING = 9;

export function Catapult({ position, impulseMultiplier, impulseDivisor = 0.2, toggleControls, onLaunch }: CatapultProps) {
  const baseRef = useRef<RapierRigidBody>(null!);
  const armRef = useRef<RapierRigidBody>(null!);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // One geometry shared by the visible cups and their colliders.
  const cup = useMemo(() => {
    const geometry = new THREE.SphereGeometry(CUP_RADIUS, 32, 16, 0, Math.PI * 2, 0, CUP_ANGLE);
    const vertices = geometry.attributes.position.array as Float32Array;
    // Three stores small geometries' indices as Uint16Array; Rapier wants Uint32Array.
    const indices = Uint32Array.from(geometry.index!.array);
    return { geometry, vertices, indices };
  }, []);

  // Rapier 2.2 useRevoluteJoint syntax accepts: [anchorA, anchorB, axis, limits]
  // Anchors are in each body's local space, so both must point at the same world-space pivot.
  const joint = useRevoluteJoint(
    baseRef,
    armRef,
    [
      [0, PIVOT_Y - BASE_Y, 0], // Pivot, seen from the base
      [0, 0, 0],                // Pivot, seen from the arm (its origin)
      [0, 0, 1],                // Hinge axis (rotates around Z-axis)
    ]
  );

  useEffect(() => {
    joint.current?.configureMotorPosition(RETURN_TARGET, RETURN_STIFFNESS, RETURN_DAMPING);
  }, [joint]);

  // Live properties for the debug panel, shown when hovering any part of the catapult
  const hoverTarget = (): HoverTarget => ({
    id: 'catapult',
    title: 'Catapult',
    read: () => {
      const arm = armRef.current;
      if (!arm) return [];
      // The arm only rotates around Z, so its quaternion's z gives the angle directly
      const angle = 2 * Math.asin(arm.rotation().z);
      return [
        ['arm angle', deg(angle)],
        ['from rest', deg(angle - REST_ANGLE)],
        ['angular vel', `${num(arm.angvel().z)} rad/s`],
        ['state', arm.isSleeping() ? 'sleeping' : Math.abs(arm.angvel().z) > 0.05 ? 'swinging' : 'at rest'],
        ['arm mass', num(arm.mass())],
        ['rest angle', deg(REST_ANGLE)],
        ['spring target', deg(RETURN_TARGET)],
        ['return spring', `k ${RETURN_STIFFNESS}, damping ${RETURN_DAMPING}`],
        ['cups', `r ${num(CUP_RADIUS)}, ${deg(CUP_ANGLE)} deep`],
        ['cup tilt L / R', `${deg(CUP_LEFT_ANGLE)} / ${deg(CUP_RIGHT_ANGLE)}`],
        ['full-charge push', num((impulseMultiplier * arm.mass()) / impulseDivisor, 0)],
        ['position', position.map((n) => num(n)).join(', ')],
      ];
    },
  });
  // Only the nearest object under the pointer claims the hover
  const showInfo = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoverTarget(hoverTarget());
  };
  const hideInfo = () => clearHoverTarget('catapult');

  return (
    <group position={position}>
      <RigidBody ref={baseRef} name="base" type="fixed" colliders="hull" position={[0, BASE_Y, 0]}>
        <mesh castShadow receiveShadow onPointerOver={showInfo} onPointerOut={hideInfo}>
          <coneGeometry args={[0.1, BASE_HEIGHT, 3, 1]} />
          <meshStandardMaterial color="skyblue" />
        </mesh>
      </RigidBody>
      <RigidBody
        ref={armRef}
        name="arm"
        ccd={true}  
        type="dynamic"
        position={[0, PIVOT_Y, 0]}
        // Start at rest, so the arm doesn't swing down when the scene loads
        rotation={[0, 0, REST_ANGLE]}
        colliders={false}
        enabledTranslations={[false, false, false]} // Keep the joint highly stable
      >
        {/* A solid box gives the arm its mass and inertia. */}
        <CuboidCollider args={[BOARD_SIZE[0] / 2, BOARD_SIZE[1] / 2, BOARD_SIZE[2] / 2]} mass={ARM_MASS} />
        <mesh
          name="board"
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
            const arm = armRef.current
            if (releaseCharge(arm, (impulseMultiplier * arm.mass()) / impulseDivisor)) onLaunch?.()
          }}
          onPointerCancel={() => {
            cancelCharge()
            toggleControls(true)
          }}
          onPointerOver={(e) => {
            setHovered(true)
            showInfo(e)
          }}
          onPointerOut={() => {
            setHovered(false)
            hideInfo()
          }}
        >
          <boxGeometry args={BOARD_SIZE} />
          <meshStandardMaterial color="lightgray" />
        </mesh>
        {[-CUP_X, CUP_X].map((x) => (
          <group key={x} rotation={[ Math.PI,0, x < 0 ? CUP_LEFT_ANGLE : CUP_RIGHT_ANGLE]} position={[x, CUP_Y, 0]}>
            {/* An open trimesh has no real volume, so Rapier computes nonsense mass for it, which locks
                the joint up. mass={0} keeps the cups out of the arm's mass and inertia. */}
            <TrimeshCollider args={[cup.vertices, cup.indices]} mass={0} />
            <mesh
              name={x < 0 ? "left-cup" : "right-cup"}
              castShadow
              geometry={cup.geometry}
              onPointerOver={showInfo}
              onPointerOut={hideInfo}
            >
              <meshStandardMaterial color="gray" side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </RigidBody>
    </group>
  );
}
