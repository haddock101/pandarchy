import { useSyncExternalStore } from "react";
import type { ThreeEvent } from "@react-three/fiber";

// What the debug panel shows: the object under the pointer and a way to read its live state.
// Objects register themselves on pointer over and clear themselves on pointer out.

export type InfoRow = [label: string, value: string];

export type HoverTarget = {
  /** Identifies the object, so only it can clear itself. */
  id: string;
  title: string;
  /** Called repeatedly while hovered, so values stay live (positions, velocities…). */
  read: () => InfoRow[];
};

let current: HoverTarget | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function setHoverTarget(target: HoverTarget) {
  current = target;
  notify();
}

export function clearHoverTarget(id: string) {
  if (current?.id !== id) return;
  current = null;
  notify();
}

export function useHoverTarget() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

// Formatting helpers so every object's rows look alike
export const num = (n: number, digits = 3) => n.toFixed(digits);
export const vec = (v: { x: number; y: number; z: number }, digits = 2) =>
  `${num(v.x, digits)}, ${num(v.y, digits)}, ${num(v.z, digits)}`;
export const deg = (radians: number) => `${num((radians * 180) / Math.PI, 1)}°`;

/**
 * Pointer handlers for a static surface (floor, wall): shows its rows plus the world point under the pointer.
 * Spread them on its mesh, or a group around its meshes. Only the nearest object under the pointer claims it.
 */
export function surfaceHover(id: string, title: string, rows: InfoRow[]) {
  let point = { x: 0, y: 0, z: 0 };
  const target: HoverTarget = { id, title, read: () => [...rows, ["pointer at", vec(point)]] };
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      point = e.point.clone();
      setHoverTarget(target);
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      point = e.point.clone();
    },
    onPointerOut: () => clearHoverTarget(id),
  };
}
