import type { ThreeEvent } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

// Meshes that can be pushed are also on this layer, so the marker can raycast only against them.
export const IMPULSE_LAYER = 1;

// Drag distance (in screen pixels) that gives a full-strength impulse.
const MAX_DRAG_PX = 200;
// A plain tap still gives a small nudge.
const MIN_CHARGE = 0.1;

// Direction of the impulse under the pointer, kept up to date by the marker while hovering.
export const impulseDirection = new THREE.Vector3(0, 1, 0);

// The aim being charged right now. Only one pointer drags at a time, so a single shared object
// lets the pushed body write the charge and the marker read it without re-rendering React.
export const aim = {
  active: false,
  charge: 0, // 0..1
  startX: 0,
  startY: 0,
  point: new THREE.Vector3(), // world-space point the impulse is applied at
  normal: new THREE.Vector3(), // world-space surface normal at that point
};

// Scratch vector, so releases don't allocate.
const impulse = new THREE.Vector3();

// Press: lock the aim point and direction where the pointer hit.
export function startCharge(e: ThreeEvent<PointerEvent>) {
  if (!e.face) return;
  e.stopPropagation();
  // Keep receiving move/up events even when the drag leaves the mesh (or the finger slides off).
  (e.target as Element).setPointerCapture(e.pointerId);
  aim.active = true;
  aim.charge = 0;
  aim.startX = e.nativeEvent.clientX;
  aim.startY = e.nativeEvent.clientY;
  aim.point.copy(e.point);
  // Read the normal from the event itself: on touch there is no hover, so the marker hasn't aimed yet.
  aim.normal.copy(e.face.normal).transformDirection(e.object.matrixWorld);
  impulseDirection.copy(aim.normal);
}

// Drag: the further from the press, the stronger.
export function updateCharge(e: ThreeEvent<PointerEvent>) {
  if (!aim.active) return;
  const dragPx = Math.hypot(e.nativeEvent.clientX - aim.startX, e.nativeEvent.clientY - aim.startY);
  aim.charge = Math.min(dragPx / MAX_DRAG_PX, 1);
}

// Release: push the body into the surface. Returns whether an impulse was applied.
export function releaseCharge(body: RapierRigidBody | null, maxStrength: number) {
  if (!aim.active) return false;
  aim.active = false;
  if (!body) return false;
  impulse.copy(aim.normal).negate().multiplyScalar(Math.max(aim.charge, MIN_CHARGE) * maxStrength);
  body.applyImpulseAtPoint(impulse, aim.point, true);
  return true;
}

export function cancelCharge() {
  aim.active = false;
}
