import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useBeforePhysicsStep } from "@react-three/rapier";
import * as THREE from "three";
import { getControlledBall } from "../controlledBall.ts";
import { KEYBOARD } from "../config.ts";

type KeyboardControlsProps = {
  /** How hard W/A/S/D (or the arrow keys) push the ball along the floor, in m/s². */
  acceleration?: number;
  /** Upward speed a jump gives the ball, in m/s. */
  jumpSpeed?: number;
};

// Each direction answers to its W/A/S/D key and the matching arrow key
const DIRECTION_KEYS = {
  ahead: ["KeyW", "ArrowUp"],
  back: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
};
const CONTROL_KEYS = new Set([...Object.values(DIRECTION_KEYS).flat(), "Space"]);
// A ball moving up or down faster than this is in the air, and can't jump again (set in config.ts)
const GROUNDED_SPEED = KEYBOARD.groundedSpeed;
const UP = new THREE.Vector3(0, 1, 0);

// Keys typed into a text field (Leva's inputs, say) are for the field, not the ball
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * W/A/S/D or the arrow keys push the last clicked (or touched) ball across the floor, relative to the camera's view (W away from it,
 * A/D to the sides), and space makes it jump. Keys are matched by position, so this also works on
 * non-QWERTY layouts. Lives inside <Physics>, applying its pushes in step with the simulation.
 */
export function KeyboardControls({ acceleration = KEYBOARD.acceleration, jumpSpeed = KEYBOARD.jumpSpeed }: KeyboardControlsProps) {
  const held = useRef(new Set<string>());
  const jumpQueued = useRef(false);
  const get = useThree((state) => state.get);
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const push = useRef(new THREE.Vector3());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!CONTROL_KEYS.has(e.code) || isTyping(e.target)) return;
      // Also stops space scrolling the page or clicking the button that still has focus
      e.preventDefault();
      if (e.code === "Space" && !e.repeat) jumpQueued.current = true;
      held.current.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!CONTROL_KEYS.has(e.code)) return;
      if (!isTyping(e.target)) e.preventDefault();
      held.current.delete(e.code);
    };
    // Switching tabs or windows mid-press never delivers the key-up, so let go of everything
    const onBlur = () => held.current.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useBeforePhysicsStep((world) => {
    const ball = getControlledBall();
    if (!ball || !ball.isEnabled()) {
      jumpQueued.current = false;
      return;
    }
    const keys = held.current;
    const pressed = (codes: string[]) => (codes.some((code) => keys.has(code)) ? 1 : 0);
    const ahead = pressed(DIRECTION_KEYS.ahead) - pressed(DIRECTION_KEYS.back);
    const side = pressed(DIRECTION_KEYS.right) - pressed(DIRECTION_KEYS.left);
    if (ahead || side) {
      // The camera's view direction, flattened onto the floor
      const fwd = get().camera.getWorldDirection(forward.current).setY(0).normalize();
      const rgt = right.current.crossVectors(fwd, UP).normalize();
      const dir = push.current.copy(fwd).multiplyScalar(ahead).addScaledVector(rgt, side).normalize();
      ball.applyImpulse(dir.multiplyScalar(acceleration * ball.mass() * world.timestep), true);
    }
    if (jumpQueued.current) {
      jumpQueued.current = false;
      if (Math.abs(ball.linvel().y) < GROUNDED_SPEED) ball.applyImpulse({ x: 0, y: jumpSpeed * ball.mass(), z: 0 }, true);
    }
  });

  return null;
}
