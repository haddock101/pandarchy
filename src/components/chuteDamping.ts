import type { CollisionEnterPayload, CollisionExitPayload, RapierRigidBody } from "@react-three/rapier";

// Balls normally have some air drag (linear damping), which the catapult throws are tuned with.
// That same drag caps a ball rolling down the gently sloped chute at about
// g · sin(slope) / damping ≈ 9.81 × 0.05 / 0.3 ≈ 1.6 m/s, so inside the chute it's turned down.

/** A ball's usual linear damping, everywhere outside the chute. */
export const BALL_LINEAR_DAMPING = 0.4;
/** Linear damping while a ball touches any chute piece. */
export const CHUTE_LINEAR_DAMPING = 0.01;

// Which chute colliders each ball is touching. At a seam a ball briefly touches two pieces, so it
// only gets its usual drag back once it has left all of them. A set rather than a count: the
// contact-start event repeats many times while a ball rolls through a pipe, but the last event for a
// piece is always the end of contact once the ball has left it.
const touching = new Map<number, Set<number>>();

const isBall = (payload: CollisionEnterPayload | CollisionExitPayload) =>
  payload.other.rigidBodyObject?.name.startsWith("ball") ?? false;

/** Put on chute pieces' RigidBodies as onCollisionEnter. */
export function onChuteContactEnter(payload: CollisionEnterPayload) {
  const ball = payload.other.rigidBody;
  if (!ball || !isBall(payload)) return;
  let pieces = touching.get(ball.handle);
  if (!pieces) touching.set(ball.handle, (pieces = new Set()));
  if (pieces.size === 0) ball.setLinearDamping(CHUTE_LINEAR_DAMPING);
  pieces.add(payload.target.collider.handle);
}

/** Put on chute pieces' RigidBodies as onCollisionExit. */
export function onChuteContactExit(payload: CollisionExitPayload) {
  const ball = payload.other.rigidBody;
  if (!ball || !isBall(payload)) return;
  const pieces = touching.get(ball.handle);
  pieces?.delete(payload.target.collider.handle);
  if (pieces?.size) return;
  touching.delete(ball.handle);
  ball.setLinearDamping(BALL_LINEAR_DAMPING);
}

/** Forget a ball's chute contacts and restore its usual drag, e.g. when a pooled ball is respawned. */
export function resetChuteDamping(ball: RapierRigidBody) {
  touching.delete(ball.handle);
  ball.setLinearDamping(BALL_LINEAR_DAMPING);
}
