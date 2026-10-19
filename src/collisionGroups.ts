import { interactionGroups } from "@react-three/rapier";

// Collision groups (0–15). Colliders without groups are in all of them and collide with everything.
const DEFAULT = 0;
const CHUTE = 1;
const ALL_GROUPS = Array.from({ length: 16 }, (_, i) => i);

/** The chute pieces (funnel, pipes, halfpipes): large trimeshes that only balls need to hit. */
export const CHUTE_GROUPS = interactionGroups([CHUTE]);

/**
 * The catapult arm ignores the chutes. It never touches them, but with CCD on (which a fast
 * launch needs) Rapier sweeps the arm's trimesh cups against the chutes' big trimeshes every
 * step, which pinned the CPU for seconds per frame. Filtered pairs are skipped entirely.
 */
export const CATAPULT_ARM_GROUPS = interactionGroups(
  [DEFAULT],
  ALL_GROUPS.filter((group) => group !== CHUTE),
);
