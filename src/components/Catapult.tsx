import { useEffect, useMemo, useRef, useState } from 'react';
import { BallCollider, CuboidCollider, RapierRigidBody, RigidBody, TrimeshCollider, useBeforePhysicsStep, useRevoluteJoint } from '@react-three/rapier';
import { Attractor } from '@react-three/rapier-addons';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { startCharge, updateCharge, releaseCharge, cancelCharge } from './impulse.ts';
import { BASE_HEIGHT, BASE_Y, BOARD_SIZE, CONE_BOTTOM_Y, CUP_ANGLE, CUP_LEFT_ANGLE, CUP_RADIUS, CUP_RIGHT_ANGLE, CUP_X, CUP_Y, PIVOT_Y, REST_ANGLE } from './catapultLayout.ts';
import { CATAPULT_ARM_GROUPS } from '../collisionGroups.ts';
import { clearHoverTarget, setHoverTarget, deg, num, type HoverTarget } from '../hoverInfo.ts';
import type { ThreeEvent } from '@react-three/fiber';
import GreenButton from './GreenButton.tsx';

type CatapultProps = {
  /** Where the bottom of the base cone stands; the catapult turns around this point. */
  position: [number, number, number];
  /** Rotation around the vertical axis through `position`, in radians. At 0 the arm runs along x, low cup at +x. */
  yaw?: number;
  impulseMultiplier: number;
  // Clicks push with impulseMultiplier × the arm's mass, so they feel the same whatever ARM_MASS is; this scales that.
  // The default 0.7 lets a 90–100% drag land a ball from the right cup in the funnel (at impulseMultiplier 10).
  impulseDivisor?: number;
  toggleControls: (value?: boolean) => void;
  /** Called when a push is released on the arm. */
  onLaunch?: () => void;
  /** The Attractor that holds a ball in the ball-holding cup (the low one at rest). 0 switches it off. */
  attractorStrength?: number;
  attractorRange?: number;
  /** Called with true when the catapult starts turning to bring a new ball down, and false when done. */
  onTurn?: (turning: boolean) => void;
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

// When a ball lands in the high cup, the catapult turns half a circle around its base while the arm
// tips the other way, so that cup ends up low where the other one was, ready to launch.
// It happens in phases, so the arm never sweeps through the chute: the half turn comes first with the
// tilt unchanged (the low end swings round low, the ball's end stays high), and only then does the arm
// tip over, once the low end is clear of the chute beside halfpipe2's end.
const TURN_DELAY = 0.5; // seconds for the ball to settle in the cup first
const TURN_DURATION = 2.5; // seconds for the half turn
const TIP_DURATION = 1.5; // seconds for the arm to tip over afterwards, with the ball still held
// During the half turn the low end is lifted this far off the floor, so it doesn't drag along it
const TURN_LIFT = THREE.MathUtils.degToRad(2);
// Sensors sit where a ball rests in each cup (the bowl's sphere centre, less the ball's play in it)
const SENSOR_RADIUS = 0.3;
const SENSOR_Y = CUP_Y - (CUP_RADIUS - 0.5);
const easeInOut = (t: number) => t * t * (3 - 2 * t);
// While a ball is carried round, the Attractor holds it firmly: a constant pull (applied as an impulse
// every step, so ~0.25 × 60 / 0.52 ≈ 29 m/s², about 3 g for a ball) towards a point below the bowl,
// which presses the ball down into the cup. The usual linear pull fades to almost nothing near its centre.
const HOLD_STRENGTH = 0.25;
const HOLD_Y = CUP_Y - CUP_RADIUS - 0.5;

// Scratch values for reading the arm's hinge angle with the catapult's own yaw taken out
const UP = new THREE.Vector3(0, 1, 0);
const unyaw = new THREE.Quaternion();
const armRotation = new THREE.Quaternion();
const baseRotation = new THREE.Quaternion();

export function Catapult({
  position,
  yaw = 0,
  impulseMultiplier,
  impulseDivisor = 0.2,
  toggleControls,
  onLaunch,
  attractorStrength = 0,
  attractorRange = 2,
  onTurn,
}: CatapultProps) {
  const baseRef = useRef<RapierRigidBody>(null!);
  const armRef = useRef<RapierRigidBody>(null!);
  // Which launch button the pointer is over: -1 left, 1 right, 0 neither
  const [hoveredButton, setHoveredButton] = useState<-1 | 0 | 1>(0);
  useCursor(hoveredButton !== 0);

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

  // Which way round the catapult is. Unflipped, the right cup (+x) is low; each half turn swaps them,
  // and the hinge spring's target mirrors with it.
  const flippedRef = useRef(false);
  // The same, for rendering: which end is low (+1 right, -1 left). The button on the other, raised end
  // is the one that launches, so that's the one lit up.
  const [lowSide, setLowSide] = useState<1 | -1>(1);
  const springTarget = () => (flippedRef.current ? -RETURN_TARGET : RETURN_TARGET);
  useEffect(() => {
    joint.current?.configureMotorPosition(springTarget(), RETURN_STIFFNESS, RETURN_DAMPING);
  }, [joint]);

  // The Attractor sits in the ball-holding cup: +1 is the right cup, -1 the left. It moves to the high
  // cup when a ball arrives there, and that cup is the low one once the turn is done.
  const [attractorSide, setAttractorSide] = useState<1 | -1>(1);
  // True from a ball's arrival in the high cup until the turn is done
  const [holding, setHolding] = useState(false);
  const highSide = () => (flippedRef.current ? 1 : -1);

  // The half turn, driven in step with the physics. The base is a kinematic body; turning it drags
  // the arm round through the hinge joint.
  const turn = useRef<{ phase: 'idle' | 'settle' | 'turn' | 'tip'; elapsed: number; fromOffset: number }>({
    phase: 'idle',
    elapsed: 0,
    fromOffset: 0,
  });
  const setSpring = (target: number) => joint.current?.configureMotorPosition(target, RETURN_STIFFNESS, RETURN_DAMPING);
  const yawOffset = useRef(0); // grows by π with each completed turn
  const onBallInCup = (side: 1 | -1, other: { rigidBodyObject?: THREE.Object3D }) => {
    const t = turn.current;
    if (t.phase !== 'idle' || side !== highSide()) return;
    if (!other.rigidBodyObject?.name.startsWith('ball')) return;
    setAttractorSide(side);
    setHolding(true);
    t.phase = 'settle';
    t.elapsed = 0;
  };
  useBeforePhysicsStep((world) => {
    const t = turn.current;
    const base = baseRef.current;
    if (!base || t.phase === 'idle') return;
    t.elapsed += world.timestep;

    if (t.phase === 'settle') {
      if (t.elapsed < TURN_DELAY) return;
      t.phase = 'turn';
      t.elapsed = 0;
      t.fromOffset = yawOffset.current;
      // Keep the current tilt, just lifted off the floor (towards level) for the turn
      const sign = flippedRef.current ? -1 : 1;
      setSpring(sign * (REST_ANGLE + TURN_LIFT));
      armRef.current?.wakeUp();
      onTurn?.(true);
    }

    if (t.phase === 'turn') {
      const progress = Math.min(t.elapsed / TURN_DURATION, 1);
      base.setNextKinematicRotation(baseRotation.setFromAxisAngle(UP, yaw + t.fromOffset + Math.PI * easeInOut(progress)));
      if (progress < 1) return;
      // Turned round and clear of the chute: now tip the ball's cup down to the floor
      yawOffset.current = t.fromOffset + Math.PI;
      flippedRef.current = !flippedRef.current;
      setLowSide(flippedRef.current ? -1 : 1);
      setSpring(springTarget());
      t.phase = 'tip';
      t.elapsed = 0;
      return;
    }

    if (t.phase === 'tip' && t.elapsed >= TIP_DURATION) {
      t.phase = 'idle';
      setHolding(false);
      onTurn?.(false);
    }
  });

  // Live properties for the debug panel, shown when hovering any part of the catapult
  const hoverTarget = (): HoverTarget => ({
    id: 'catapult',
    title: 'Catapult',
    read: () => {
      const arm = armRef.current;
      if (!arm) return [];
      // Relative to the catapult, the arm only rotates around z, so that quaternion's z gives the angle
      const { x, y, z, w } = arm.rotation();
      armRotation.set(x, y, z, w).premultiply(unyaw.setFromAxisAngle(UP, -(yaw + yawOffset.current)));
      const angle = 2 * Math.asin(armRotation.z);
      return [
        ['arm angle', deg(angle)],
        ['from rest', deg(angle - REST_ANGLE)],
        ['angular vel', `${num(arm.angvel().z)} rad/s`],
        ['state', arm.isSleeping() ? 'sleeping' : Math.abs(arm.angvel().z) > 0.05 ? 'swinging' : 'at rest'],
        ['arm mass', num(arm.mass())],
        ['rest angle', deg(REST_ANGLE)],
        ['spring target', deg(springTarget())],
        ['low cup', flippedRef.current ? 'left' : 'right'],
        ['attractor', holding ? `holding (static ${HOLD_STRENGTH})` : `linear ${num(attractorStrength)}`],
        ['turn', turn.current.phase === 'turn' ? `turning ${num((turn.current.elapsed / TURN_DURATION) * 100, 0)}%` : turn.current.phase],
        ['return spring', `k ${RETURN_STIFFNESS}, damping ${RETURN_DAMPING}`],
        ['cups', `r ${num(CUP_RADIUS)}, ${deg(CUP_ANGLE)} deep`],
        ['cup tilt L / R', `${deg(CUP_LEFT_ANGLE)} / ${deg(CUP_RIGHT_ANGLE)}`],
        ['full-charge push', num((impulseMultiplier * arm.mass()) / impulseDivisor, 0)],
        ['position', position.map((n) => num(n)).join(', ')],
        ['yaw', deg(yaw + yawOffset.current)],
      ];
    },
  });
  // Only the nearest object under the pointer claims the hover
  const showInfo = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoverTarget(hoverTarget());
  };
  const hideInfo = () => clearHoverTarget('catapult');

  // Pressing anywhere on a button pushes straight down into the board, whichever face was hit
  const buttonHandlers = (side: -1 | 1) => ({
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      toggleControls(false);
      const boardUp = new THREE.Vector3(0, 1, 0).transformDirection(e.eventObject.matrixWorld);
      startCharge(e, { point: e.point.clone(), normal: boardUp });
    },
    onPointerMove: updateCharge,
    onPointerUp: () => {
      toggleControls(true);
      const arm = armRef.current;
      if (releaseCharge(arm, (impulseMultiplier * arm.mass()) / impulseDivisor)) onLaunch?.();
    },
    onPointerCancel: () => {
      cancelCharge();
      toggleControls(true);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      setHoveredButton(side);
      showInfo(e);
    },
    onPointerOut: () => {
      setHoveredButton((current) => (current === side ? 0 : current));
      hideInfo();
    },
  });

  return (
    <group position={[position[0], position[1] - CONE_BOTTOM_Y, position[2]]} rotation={[0, yaw, 0]}>
      <RigidBody ref={baseRef} name="base" type="kinematicPosition" colliders="hull" position={[0, BASE_Y, 0]}>
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
        {/* Press and drag on a button to charge a launch; it pushes that end of the board down. */}
        {([-1, 1] as const).map((side) => (
          <GreenButton
            key={side}
            position={[side * 2, 0.05, 0]}
            hovered={hoveredButton === side}
            // Only the raised end's button launches anything, and not while a ball is being carried round
            lit={side === -lowSide && !holding}
            {...buttonHandlers(side)}
          />
        ))}
        {/* A solid box gives the arm its mass and inertia. */}
        <CuboidCollider args={[BOARD_SIZE[0] / 2, BOARD_SIZE[1] / 2, BOARD_SIZE[2] / 2]} mass={ARM_MASS} collisionGroups={CATAPULT_ARM_GROUPS} />
        <mesh
          name="board"
          castShadow
          receiveShadow
          // Launches start from the buttons only; the board just shows the debug info
          onPointerOver={showInfo}
          onPointerOut={hideInfo}
        >
          <boxGeometry args={BOARD_SIZE} />
          <meshStandardMaterial color="lightgray" />
        </mesh>
        {/* Holds a ball in the ball-holding cup, and follows it while the catapult turns */}
        <Attractor
          position={[attractorSide * CUP_X, holding ? HOLD_Y : CUP_Y + 0.2, 0]}
          strength={holding ? HOLD_STRENGTH : attractorStrength}
          range={attractorRange}
          type={holding ? 'static' : 'linear'}
        />
        {([-1, 1] as const).map((side) => (
          <BallCollider
            key={side}
            sensor
            mass={0}
            args={[SENSOR_RADIUS]}
            position={[side * CUP_X, SENSOR_Y, 0]}
            collisionGroups={CATAPULT_ARM_GROUPS}
            onIntersectionEnter={({ other }) => onBallInCup(side, other)}
          />
        ))}
        {[-CUP_X, CUP_X].map((x) => (
          <group key={x} rotation={[Math.PI, 0, x < 0 ? CUP_LEFT_ANGLE : CUP_RIGHT_ANGLE]} position={[x, CUP_Y, 0]}>
            {/* An open trimesh has no real volume, so Rapier computes nonsense mass for it, which locks
                the joint up. mass={0} keeps the cups out of the arm's mass and inertia. */}
            <TrimeshCollider args={[cup.vertices, cup.indices]} mass={0} collisionGroups={CATAPULT_ARM_GROUPS} />
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
