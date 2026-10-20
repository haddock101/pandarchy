import { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { MeshCollider, RapierRigidBody, RigidBody, useBeforePhysicsStep, useRevoluteJoint } from '@react-three/rapier';
import { SCENE } from '../config.ts';
import { isControlHeld } from './KeyboardControls.tsx';

type Vec3 = [number, number, number];

type PinballFlipperProps = {
  side: 'left' | 'right';
  /** Where the pivot sits, relative to the sloped floor (x down the slope, y up from its surface) */
  position: Vec3;
  /** The KeyboardControls control that flips it */
  control: 'leftFlipper' | 'rightFlipper';
  /** Draws the hinge and the bat's own pivot on top of everything (see HingeMarker and PivotMarker) */
  showJoints?: boolean;
};

// The model runs 4 units along +x, from its narrow tip at the origin to the wide, round end it should
// pivot on; it's shifted back so that end sits on the hinge and the bat reaches 2 along -x after scaling.
const MODEL_SCALE = 0.5;
const PIVOT_OFFSET: Vec3 = [-4 * MODEL_SCALE, 0, 0];
// Half the model's height after scaling, so it rests on the floor rather than in it
const HALF_HEIGHT = 0.5 * MODEL_SCALE * 2;
// How far the bat swings either side of straight out, in radians
const SWING = 0.5;
// The motor drives the bat to an angle rather than at a speed: a speed motor this strong swung it to twice
// the limits. These reach the top in about 80 ms and overshoot the limit by under 0.1 rad.
const FLIP_STIFFNESS = 6000;
const FLIP_DAMPING = 200;
// A softer return, so the bat drops back rather than slamming down
const RETURN_STIFFNESS = 1500;
const RETURN_DAMPING = 100;

export function PinballFlipper({ side, position, control, showJoints = false }: PinballFlipperProps) {
  const anchorRef = useRef<RapierRigidBody>(null!);
  const flipperRef = useRef<RapierRigidBody>(null!);
  // Seen from the low end of the slope, looking up it (-x), the left flipper sits at +z and its bat (along -x,
  // after the shift) points to -z, towards the middle; the right one is its mirror. The joint's angle turns
  // the bat anticlockwise seen from above, which swings the left bat up the slope and the right one down it,
  // so each flips towards dir × SWING.
  const dir = side === 'left' ? 1 : -1;

  const joint = useRevoluteJoint(anchorRef, flipperRef, [
    [0, 0, 0], // Pivot on the anchor
    [0, 0, 0], // Pivot on the flipper (the centre of the model's wide end)
    [0, 1, 0], // Hinge axis: the floor's normal, so the bat swings across the slope
    [-SWING, SWING],
  ]);

  // null until the first step, so the motor gets configured once the joint exists
  const wasPressed = useRef<boolean | null>(null);
  useBeforePhysicsStep(() => {
    if (!joint.current) return;
    const pressed = isControlHeld(control);
    // Only reconfigure the motor when the key changes, not every step
    if (pressed === wasPressed.current) return;
    wasPressed.current = pressed;
    if (pressed) joint.current.configureMotorPosition(dir * SWING, FLIP_STIFFNESS, FLIP_DAMPING);
    else joint.current.configureMotorPosition(-dir * SWING, RETURN_STIFFNESS, RETURN_DAMPING);
  });

  const { scene } = useGLTF('./gltf/flippers.gltf');
  // useGLTF caches the scene, so each flipper gets its own copy instead of sharing (and rescaling) the original
  const model = useMemo(() => {
    const copy = scene.clone();
    copy.traverse((o) => (o.castShadow = true));
    return copy;
  }, [scene]);

  return (
    <group position={position} rotation={[0, (-dir * Math.PI) / 2, 0]}>
      {/* Invisible fixed anchor for the hinge */}
      <RigidBody ref={anchorRef} type="fixed" colliders={false}>
        {showJoints && <HingeMarker />}
      </RigidBody>
      {/* The collider comes from the model alone (MeshCollider), so the markers never touch the ball */}
      <RigidBody
        ref={flipperRef}
        type="dynamic"
        colliders={false}
        ccd // Continuous Collision Detection keeps fast balls from passing through the bat
        canSleep={false}
        friction={0.1}
        restitution={0.5}
        // No enabledTranslations here: Rapier locks the centre of mass, not the body's origin, which left the
        // bat spinning about its middle while the joint tugged at its wide end.
      >
        <MeshCollider type="hull">
          <primitive object={model} position={PIVOT_OFFSET} scale={MODEL_SCALE} />
        </MeshCollider>
        {showJoints && <PivotMarker />}
      </RigidBody>
    </group>
  );
}

// Joint markers. They draw over everything, so they show through the bat. When the joint is lined up, the
// magenta dot (the bat's pivot) stays on the yellow rod (the hinge), and the magenta line (the bat) swings
// between the two yellow lines (the joint's limits).
const HINGE_COLOR = 'yellow';
const PIVOT_COLOR = 'magenta';
const BAT_LENGTH = 4 * MODEL_SCALE;

function MarkerMaterial({ color }: { color: string }) {
  return <meshBasicMaterial color={color} depthTest={false} transparent />;
}

/** Fixed with the hinge: a rod along its axis and a line at each swing limit. */
function HingeMarker() {
  return (
    <group>
      <mesh renderOrder={999}>
        <cylinderGeometry args={[0.03, 0.03, 2 * HALF_HEIGHT + 0.6, 8]} />
        <MarkerMaterial color={HINGE_COLOR} />
      </mesh>
      {[-SWING, SWING].map((limit) => (
        // The bat reaches along -x, so a limit line does too, turned about the hinge by the limit angle
        <group key={limit} rotation={[0, limit, 0]}>
          <mesh renderOrder={999} position={[-BAT_LENGTH / 2, 0, 0]}>
            <boxGeometry args={[BAT_LENGTH, 0.02, 0.02]} />
            <MarkerMaterial color={HINGE_COLOR} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Moves with the bat: a dot at the point the joint holds it by, and a line along the bat. */
function PivotMarker() {
  return (
    <group>
      <mesh renderOrder={1000}>
        <sphereGeometry args={[0.08, 12, 8]} />
        <MarkerMaterial color={PIVOT_COLOR} />
      </mesh>
      <mesh renderOrder={1000} position={[-BAT_LENGTH / 2, 0, 0]}>
        <boxGeometry args={[BAT_LENGTH, 0.03, 0.03]} />
        <MarkerMaterial color={PIVOT_COLOR} />
      </mesh>
    </group>
  );
}

const FLIPPER_Y = HALF_HEIGHT + 0.01;
// How far down the slope (from the seam with the flat section, at x = 0) the flippers sit, and how far
// either side of the middle their pivots are. The bats are 2 long, leaving a 2-wide gap between the tips.
const FLIPPER_X = -3;
const FLIPPER_Z = 3;

export function Flippers({ showJoints = false }: { showJoints?: boolean }) {
  return (
    // Tilted like the left floor section (Wall.tsx): around the seam where it meets the flat section
    <group position={[0, SCENE.floorY, 0]} rotation={[0, 0, -SCENE.leftSectionSlope]}>
      <PinballFlipper side="left" position={[FLIPPER_X, FLIPPER_Y, FLIPPER_Z]} control="leftFlipper" showJoints={showJoints} />
      <PinballFlipper side="right" position={[FLIPPER_X, FLIPPER_Y, -FLIPPER_Z]} control="rightFlipper" showJoints={showJoints} />
    </group>
  );
}

export default Flippers;
