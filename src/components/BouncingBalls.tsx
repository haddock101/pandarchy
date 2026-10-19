import { useEffect, useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BallCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Html, useCursor, useTexture } from "@react-three/drei";
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
import { getControlledBall, setControlledBall } from "../controlledBall.ts";
import { resetChuteDamping } from "./chuteDamping.ts";
import { BALL, PUSH } from "../config.ts";
import { clearHoverTarget, setHoverTarget, num, vec, type HoverTarget } from "../hoverInfo.ts";

const SPHERE_SEGMENTS = 64; // Number of segments for the sphere geometry

const BALL_TEXTURES = {
  bumpMap: "/textures/sphereMap.jpg",
  roughnessMap: "/textures/sphereMap.jpg",
  aoMap: "/textures/stripe.jpg",
};
// Start loading right away, so the first ball doesn't suspend the scene (the black flash).
useTexture.preload(Object.values(BALL_TEXTURES));

// Where pooled balls wait, disabled, until they're spawned.
const PARKED = { x: 0, y: -100, z: 0 };
const ZERO = { x: 0, y: 0, z: 0 };
const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };
// Hidden balls must not catch the pointer or the marker's ray.
const noRaycast = () => {};

/** One use of a pooled ball. A new `seq` re-spawns the ball even if it's already in play. */
export type BallSpawn = {
  seq: number;
  position: [number, number, number];
  colors: [string, string];
  friction?: number;
};

// Gap between the marker's tip and the hovered surface.
const MARKER_GAP = 0.005;
const MARKER_SIZE = 0.25;
const MARKER_COLOR_EMPTY = new THREE.Color("white");
const MARKER_COLOR_FULL = new THREE.Color("red");

// The marker's own raycaster; R3F's shared one drives pointer events and must stay on all layers.
const markerRaycaster = new THREE.Raycaster();
markerRaycaster.layers.set(IMPULSE_LAYER);
const hitNormal = new THREE.Vector3();

type BouncingBallProps = {
  name: string;
  /** Null keeps the ball parked: disabled, hidden and out of the simulation. */
  spawn: BallSpawn | null;
  impulseMultiplier: number;
  impulseDivisor: number;
  radius: number;
  restitution: number;
  /** Continuous collision detection, so fast balls don't tunnel through thin pipe walls. */
  ccd?: boolean;
  friction: number;
  density: number;
  canSleep?: boolean;
  togglePhysics: (value?: boolean) => void;
  toggleControls: (value?: boolean) => void;
};

export function BouncingBall({
  name,
  spawn,
  impulseMultiplier,
  radius,
  density,
  impulseDivisor,
  restitution,
  friction,
  ccd = false,
  canSleep = true,
  togglePhysics,
  toggleControls,
}: BouncingBallProps) {
  const ballRef = useRef<RapierRigidBody>(null!);
  // The drawn ball (moves smoothly between physics steps), for the selection aura to follow
  const ballObjectRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const textures = useTexture(BALL_TEXTURES);

  const active = spawn !== null;
  const [colorA, colorB] = spawn?.colors ?? ["white", "white"];
  // Each push flips the colour; counting per spawn means a re-spawned ball starts on colorA again.
  const [flips, setFlips] = useState({ seq: -1, count: 0 });
  const flipCount = flips.seq === spawn?.seq ? flips.count : 0;
  const color = flipCount % 2 === 0 ? colorA : colorB;

  // Move the physics body to its spawn point (or park it) without remounting anything.
  useEffect(() => {
    const body = ballRef.current;
    if (!body) return;
    body.setLinvel(ZERO, false);
    body.setAngvel(ZERO, false);
    body.setRotation(IDENTITY, false);
    if (!spawn) {
      body.setTranslation(PARKED, false);
      resetChuteDamping(body);
      body.setEnabled(false);
      return;
    }
    const [x, y, z] = spawn.position;
    body.setTranslation({ x, y, z }, false);
    resetChuteDamping(body);
    body.setEnabled(true);
    body.wakeUp();
  }, [spawn]);

  // Live properties for the debug panel
  const hoverTarget = (): HoverTarget => ({
    id: name,
    title: `Ball · ${name}`,
    read: () => {
      const body = ballRef.current;
      if (!body) return [];
      const v = body.linvel();
      return [
        ["state", !body.isEnabled() ? "parked" : body.isSleeping() ? "sleeping" : "in play"],
        ["colour", color],
        ["position", vec(body.translation())],
        ["velocity", vec(v)],
        ["speed", num(Math.hypot(v.x, v.y, v.z))],
        ["spin", vec(body.angvel())],
        ["mass", num(body.mass(), 3)],
        ["radius", num(radius)],
        ["density", num(density)],
        ["friction", num(friction)],
        ["restitution", num(restitution)],
        ["ccd", body.isCcdEnabled() ? "on" : "off"],
        ["spawn #", String(spawn?.seq ?? "–")],
        ["keyboard", getControlledBall() === body ? "W A S D / arrows, space" : "–"],
      ];
    },
  });

  return (
    <RigidBody
      name={name}
      ref={ballRef}
      // An explicit collider: auto colliders are only built from meshes visible at mount,
      // and a parked ball's mesh is hidden, which left pooled balls with no collider and no mass.
      colliders={false}
      position={[PARKED.x, PARKED.y, PARKED.z]}
      linearDamping={BALL.linearDamping}
      canSleep={canSleep}
      ccd={ccd}
    >
      <BallCollider args={[radius]} restitution={restitution} friction={friction} density={density} />
      <group
        ref={ballObjectRef}
        onPointerDown={(e) => {
          toggleControls(false)
          // Clicking or touching a ball selects it: the keyboard (W/A/S/D or arrows, space) steers it
          setControlledBall(ballRef.current, ballObjectRef.current)
          startCharge(e)
        }}
        onPointerMove={updateCharge}
        onPointerUp={() => {
          // Unpause so the ball flies off right away instead of waiting for the pointer to leave it
          togglePhysics(false)
          toggleControls(true)
          if (releaseCharge(ballRef.current, impulseMultiplier / impulseDivisor)) {
            setFlips({ seq: spawn?.seq ?? -1, count: flipCount + 1 })
          }
        }}
        onPointerCancel={() => {
          cancelCharge()
          toggleControls(true)
        }}
        onPointerOver={(e) => {
          // Only the nearest object under the pointer claims the hover, not the cup behind the ball
          e.stopPropagation()
          setHovered(true)
          setHoverTarget(hoverTarget())
          togglePhysics(true)
          toggleControls(true)
        }}
        onPointerOut={() => {
          setHovered(false)
          clearHoverTarget(name)
          togglePhysics(false)
        }}
      >
        <mesh
          castShadow
          visible={active}
          raycast={active ? THREE.Mesh.prototype.raycast : noRaycast}
          onUpdate={(mesh) => mesh.layers.enable(IMPULSE_LAYER)}
        >
          <sphereGeometry args={[radius, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
          <meshStandardMaterial color={color} {...textures} />
        </mesh>
      </group>
    </RigidBody>
  );
}

export function ImpulseMarker() {
  const markerRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const stemRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const labelAnchorRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useFrame(({ pointer, camera, scene }) => {
    const marker = markerRef.current;
    const halo = haloRef.current;
    const stem = stemRef.current;
    const material = materialRef.current;
    if (!marker || !halo || !stem || !material) return;
    // The charge readout only shows while a push is being charged
    const label = labelRef.current;
    if (label) label.style.display = aim.active ? "" : "none";

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
    const pull = MARKER_GAP + charge * PUSH.maxPull;
    marker.position.copy(point).addScaledVector(hitNormal, pull);
    marker.lookAt(point);

    halo.scale.setScalar(1 + charge);
    // The stem spans from the halo to the surface, so its length shows the strength too.
    stem.visible = charge > 0;
    stem.scale.set(1, pull, 1);
    stem.position.z = pull / 2;

    material.color.lerpColors(MARKER_COLOR_EMPTY, MARKER_COLOR_FULL, charge);
    material.emissive.copy(material.color);

    // Written straight to the DOM every frame, so charging doesn't re-render React
    const anchor = labelAnchorRef.current;
    if (aim.active && anchor && label) {
      anchor.position.copy(marker.position);
      label.textContent = `${Math.round(charge * 100)}%`;
      label.style.color = material.color.getStyle();
      // With a finger on the screen the marker is under it, so the readout moves above the finger
      label.classList.toggle("chargeLabel--touch", aim.pointerType === "touch");
    }
  });

  const halo = useMemo(() => {
    const geometry = new THREE.SphereGeometry(MARKER_SIZE, 32, 32, 0, (Math.PI * 2), Math.PI / 8, Math.PI / 16);
    geometry.translate(0, -MARKER_SIZE / 1.1, 0) // Move the halo so that it aligns with the center of the sphere
    geometry.rotateX(-Math.PI / 2)
    return geometry;
  }, []);

  // const halo = new THREE.ExtrudeGeometry([{arrowShape, extrudeSettings}]);
  return (
    <>
    {/* The charge readout follows the marker, offset on screen so it doesn't cover it */}
    <group ref={labelAnchorRef}>
      <Html className="chargeLabel" style={{ display: "none" }} ref={labelRef} zIndexRange={[20, 0]}>
        0%
      </Html>
    </group>
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
        <cylinderGeometry args={[0.005, 0.075, 1, 5]} />
        <meshStandardMaterial color="white" emissive="skyblue" opacity={0.1} roughness={0.01} emissiveIntensity={1} />
      </mesh>
    </group>
    </>
  );
}
