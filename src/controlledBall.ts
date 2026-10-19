import type { RapierRigidBody } from "@react-three/rapier";
import type { Object3D } from "three";

// The ball the keyboard steers: whichever was hovered last. Balls register themselves on hover.
// The body is what gets pushed; the object is what's drawn (it moves smoothly between physics steps).
let controlled: { body: RapierRigidBody; object: Object3D | null } | null = null;

export function setControlledBall(body: RapierRigidBody | null, object: Object3D | null = null) {
  controlled = body ? { body, object } : null;
}

export function getControlledBall() {
  return controlled?.body ?? null;
}

export function getControlledBallObject() {
  return controlled?.object ?? null;
}
