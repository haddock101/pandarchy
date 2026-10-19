// The catapult's measurements, shared so the scene can line things up with its cups.
// All positions are relative to the catapult's own position.

/** Top of the checkered floor (Floor.tsx's box, as scaled in App). */
export const FLOOR_Y = -0.08;

export const BASE_HEIGHT = 1;
export const BASE_Y = 0.42; // centre of the base cone
export const BOARD_SIZE: [number, number, number] = [6, 0.05, 0.4];
// The arm pivots around the board's centre, just above the cone's tip so the two never touch.
export const PIVOT_Y = BASE_Y + BASE_HEIGHT / 2 + BOARD_SIZE[1] / 2 + 0.005;

// Cups sit on top of the board, one at each end. Each is a bowl cut from a sphere,
// big enough to hold a ball (radius 0.5).
export const CUP_RADIUS = 0.65;
// How far the bowl wraps up around the ball, measured from its bottom (90° = a hemisphere).
// The arm only swings ~40° before its other end hits the floor, so the cup has to carry the ball
// round the arc for it to fly towards the funnel. In a headless Rapier run with the real chutes,
// 100° or shallower let the ball slip out early and go straight up; 110° is the shallowest that
// reliably reaches the funnel. Wider bowls (radius 0.8+) catch on pipe904 with the arm raised.
export const CUP_ANGLE = (70 * Math.PI) / 180;
export const CUP_RIGHT_ANGLE = (-22 * Math.PI) / 180;
export const CUP_LEFT_ANGLE = (22 * Math.PI) / 180;
export const CUP_X = 2.8;
export const CUP_Y = BOARD_SIZE[1] / 2 + CUP_RADIUS -0.001; // bowl's sphere centre, so its bottom rests on the board

/** Arm angle (around Z) with the right end resting on the floor: the loaded, ready-to-launch position. */
export const REST_ANGLE = -Math.asin((PIVOT_Y - FLOOR_Y - BOARD_SIZE[1] / 2) / (BOARD_SIZE[0] / 2));

/** Where a cup's sphere centre is when the arm is at `angle`. A ball resting in the cup sits 0.2 below it. */
export function cupCentre(angle: number, cupX = CUP_X): [number, number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [cupX * cos - CUP_Y * sin, PIVOT_Y + cupX * sin + CUP_Y * cos, 0];
}

/** The right cup's sphere centre at rest, on the floor. */
export const RIGHT_CUP_AT_REST = cupCentre(REST_ANGLE);

/** The bottom of the base cone, relative to the catapult's origin. Placement uses this point. */
export const CONE_BOTTOM_Y = BASE_Y - BASE_HEIGHT / 2;

/**
 * The low cup's sphere centre in world space, for a catapult placed with its cone bottom at
 * `position` and turned by `yaw` (radians, around the vertical axis through that point).
 */
export function lowCupWorld(position: [number, number, number], yaw: number): [number, number, number] {
  const [x, y, z] = RIGHT_CUP_AT_REST;
  const dy = y - CONE_BOTTOM_Y;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  // Rotation around y: x' = x cos + z sin, z' = -x sin + z cos
  return [position[0] + x * cos + z * sin, position[1] + dy, position[2] - x * sin + z * cos];
}
