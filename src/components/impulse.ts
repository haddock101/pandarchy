import type { ThreeEvent } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

// Meshes that can be pushed are also on this layer, so the marker can raycast only against them.
export const IMPULSE_LAYER = 1;

// How far (in world units) the marker is pulled back from the surface at full charge.
// The drag works in the same units, so the marker always sits under the pointer.
export const MAX_PULL = 2.5;
// A plain tap still gives a small nudge.
const MIN_CHARGE = 0.1;
// With a finger, MAX_PULL can be only a few dozen pixels on a phone screen: too twitchy, and hidden
// under the finger. Touch drags are stretched so a full charge takes at least this much finger
// movement (the marker then trails the finger rather than sitting under it), within a limit.
const MIN_TOUCH_PULL_PX = 150;
const MAX_TOUCH_STRETCH = 4;
// Below this angle between the pointer's ray and the pull line, the line looks like a dot on
// screen and can't be dragged along, so the pull is measured across the screen instead.
const MIN_LINE_ANGLE = THREE.MathUtils.degToRad(15);

// Direction of the impulse under the pointer, kept up to date by the marker while hovering.
export const impulseDirection = new THREE.Vector3(0, 1, 0);

// The aim being charged right now. Only one pointer drags at a time, so a single shared object
// lets the pushed body write the charge and the marker read it without re-rendering React.
export const aim = {
  active: false,
  /** "touch", "mouse" or "pen": a finger covers what's under it, so the charge readout moves for touch. */
  pointerType: "mouse",
  charge: 0, // 0..1
  /** How much further than the marker the pointer has to go: 1, or more for touch on small screens. */
  stretch: 1,
  point: new THREE.Vector3(), // world-space point the impulse is applied at
  normal: new THREE.Vector3(), // world-space surface normal at that point
};

// Scratch vectors, so drags and releases don't allocate.
const impulse = new THREE.Vector3();
const toRay = new THREE.Vector3();
const onPlane = new THREE.Vector3();
const screenA = new THREE.Vector3();
const screenB = new THREE.Vector3();

/** How many pixels a full pull (MAX_PULL along the normal from the aim point) covers on screen. */
function fullPullPixels(e: ThreeEvent<PointerEvent>) {
  const { width, height } = (e.nativeEvent.target as Element).getBoundingClientRect();
  screenA.copy(aim.point).project(e.camera);
  screenB.copy(aim.point).addScaledVector(aim.normal, MAX_PULL).project(e.camera);
  return Math.hypot(((screenB.x - screenA.x) * width) / 2, ((screenB.y - screenA.y) * height) / 2);
}

// Press: lock the aim point and direction where the pointer hit. `surface` overrides the hit point
// and normal, for presses on an enlarged touch target rather than the object's own surface.
export function startCharge(e: ThreeEvent<PointerEvent>, surface?: { point: THREE.Vector3; normal: THREE.Vector3 }) {
  if (!e.face && !surface) return;
  e.stopPropagation();
  // Keep receiving move/up events even when the drag leaves the mesh (or the finger slides off).
  (e.target as Element).setPointerCapture(e.pointerId);
  aim.active = true;
  aim.pointerType = e.nativeEvent.pointerType;
  aim.charge = 0;
  if (surface) {
    aim.point.copy(surface.point);
    aim.normal.copy(surface.normal).normalize();
  } else {
    aim.point.copy(e.point);
    // Read the normal from the event itself: on touch there is no hover, so the marker hasn't aimed yet.
    aim.normal.copy(e.face!.normal).transformDirection(e.object.matrixWorld);
  }
  impulseDirection.copy(aim.normal);
  aim.stretch =
    aim.pointerType === "touch"
      ? THREE.MathUtils.clamp(MIN_TOUCH_PULL_PX / Math.max(fullPullPixels(e), 1), 1, MAX_TOUCH_STRETCH)
      : 1;
}

/**
 * How far along the pull line (from the aim point, out along the surface normal) the pointer is.
 * It's the point on that line closest to the pointer's ray, so the marker drawn there stays under the pointer.
 */
function pullUnderPointer(ray: THREE.Ray) {
  const { origin, direction } = ray;
  toRay.subVectors(origin, aim.point);
  const cos = direction.dot(aim.normal);
  const sin2 = 1 - cos * cos;
  if (sin2 > Math.sin(MIN_LINE_ANGLE) ** 2) {
    // Closest points between the ray and the line
    return (toRay.dot(aim.normal) - cos * toRay.dot(direction)) / sin2;
  }
  // Looking almost straight down the line: use the distance from the aim point across the screen
  // instead, measured where the ray meets the plane through the aim point facing the camera.
  onPlane.copy(origin).addScaledVector(direction, -toRay.dot(direction));
  return onPlane.distanceTo(aim.point);
}

// Drag: pulling the marker back from the surface, like a slingshot, sets the strength.
export function updateCharge(e: ThreeEvent<PointerEvent>) {
  if (!aim.active) return;
  aim.charge = THREE.MathUtils.clamp(pullUnderPointer(e.ray) / (MAX_PULL * aim.stretch), 0, 1);
}

// Release: push the body into the surface. Returns whether an impulse was applied.
export function releaseCharge(body: RapierRigidBody | null, maxStrength: number) {
  if (!aim.active) return false;
  aim.active = false;
  if (!body) return false;
  impulse.copy(aim.normal).negate().multiplyScalar(Math.max(aim.charge, MIN_CHARGE) * maxStrength);
  body.applyImpulseAtPoint(impulse, aim.point, true);
  // A short buzz on phones that support it (Android; iOS ignores it), stronger for a fuller charge
  if (aim.pointerType === "touch") navigator.vibrate?.(10 + Math.round(aim.charge * 30));
  return true;
}

export function cancelCharge() {
  aim.active = false;
}
