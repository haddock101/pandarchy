import { useSyncExternalStore } from "react";

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
export const num = (n: number, digits = 2) => n.toFixed(digits);
export const vec = (v: { x: number; y: number; z: number }, digits = 2) =>
  `${num(v.x, digits)}, ${num(v.y, digits)}, ${num(v.z, digits)}`;
export const deg = (radians: number) => `${num((radians * 180) / Math.PI, 1)}°`;
