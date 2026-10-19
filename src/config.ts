// Every value you'd tune by hand, in one place. Components read from here rather than keeping their own copies.
//
// Not in here, because they belong with what they describe:
//  - the catapult's shape (board, base, cups): components/catapultLayout.ts, which also derives its rest angle
//  - pure looks (marker, aura, button glow, mesh detail): at the top of each component
//  - the chute pieces' layout and seams: App.tsx, next to the pieces themselves

const deg = (degrees: number) => (degrees * Math.PI) / 180;
type Vec3 = [number, number, number];

export const SCENE = {
  /** Top of the checkered floor in world space (the floor boxes in Wall.tsx, under App's 0.2 vertical scale). */
  floorY: -0.08,
};

/** Defaults for the Leva settings panel; once changed there, the browser remembers the new values. */
export const SETTINGS_DEFAULTS = {
  impulseMultiplier: 10,
  maxBalls: 12,
  containerOpacity: 0.4,
  cameraFov: 49,
  cameraPosition: [14.5, 13.5, 24.5] as Vec3,
  cameraLookAt: [0, 0, 0] as Vec3,
};

export const BALL = {
  radius: 0.5,
  density: 1,
  restitution: 0.1,
  friction: 0.3,
  /** Friction for balls dropped into the catapult's cup with "Load", so they stay put. */
  loadedFriction: 0.55,
  /** Air drag everywhere outside the chute; the catapult throws are tuned with it. */
  linearDamping: 0.4,
  /** Drag while touching a chute piece. The usual drag caps chute speed at g·sin(slope)/damping. */
  chuteLinearDamping: 0.01,
  /** A full-charge push is impulseMultiplier / pushDivisor. */
  pushDivisor: 1,
  /** Where "Random" drops balls: a `spread`-wide square starting at x, z, at this height. */
  randomDrop: { x: -2, z: -2, spread: 0.5, height: 8.5 },
};

/** Press-drag-release pushes, on balls and the catapult's buttons. */
export const PUSH = {
  /** How far the marker is pulled back from the surface at full charge, in world units. */
  maxPull: 2.5,
  /** A plain click or tap still gives this much of a full push. */
  minCharge: 0.1,
};

/** Touch screens: fingers are big and cover what they touch. */
export const TOUCH = {
  /** A touch drag needs at least this much finger movement for a full charge (the marker then trails). */
  minPullPx: 150,
  /** …but is never stretched more than this. */
  maxStretch: 4,
  /** Invisible grab area around each ball, in ball radii. */
  ballTargetScale: 2.2,
  /** Invisible grab area around each catapult button, in world units. */
  buttonTargetRadius: 0.6,
};

export const CATAPULT = {
  /** Where the bottom of the base cone stands; the catapult turns around this point. */
  position: [-0.025, SCENE.floorY, 1.525] as Vec3,
  /** Turn around the vertical axis. The raised cup should end up under the end of halfpipe2. */
  yaw: deg(-35),
  /** Light enough that a ball (mass ~0.5) landing in a cup tips the arm. Pushes scale with it. */
  armMass: 15,
  /** A full-charge push on a button is impulseMultiplier × armMass / pushDivisor. */
  pushDivisor: 0.2,
  /** Hinge spring that rewinds the arm to rest. Acceleration-based, so independent of armMass. */
  spring: {
    stiffness: 20,
    damping: 9,
    /** Aim this far past rest, so the arm settles pressed gently onto the floor. */
    pressPastRest: deg(1.2),
  },
  /** When a ball lands in the high cup, the catapult turns round to bring it down. */
  turn: {
    /** Seconds for the ball to settle in the cup first. */
    delay: 0.5,
    /** Seconds for the half turn. */
    duration: 2.5,
    /** Seconds for the arm to tip over afterwards, with the ball still held. */
    tipDuration: 1.5,
    /** The low end is lifted this far off the floor during the turn, so it doesn't drag. */
    lift: deg(2),
    /** Constant pull holding the ball in its cup while it's carried round (impulse per step). */
    holdStrength: 0.25,
  },
};

/** Pulls balls into the catapult's low cup. */
export const ATTRACTOR = {
  range: 2,
  /** Applied as an impulse every physics step, so even this pulls a ball at up to ~3× gravity. */
  strength: 0.35,
  /** After a launch the pull is off for this long, or it drags the ball straight back into the cup. */
  launchPauseMs: 1500,
};

export const CHUTE = {
  /** Slope of the chutes, in radians. The seams stay lined up and the funnel vertical at any slope. */
  slope: 0.05,
};

/** W/A/S/D (or arrows) and space steer the selected ball. */
export const KEYBOARD = {
  /** How hard the keys push the ball along the floor, in m/s². */
  acceleration: 8,
  /** Upward speed a jump gives the ball, in m/s. */
  jumpSpeed: 5,
  /** A ball moving up or down faster than this is in the air, and can't jump again. */
  groundedSpeed: 1.5,
};
