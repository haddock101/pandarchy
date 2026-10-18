import * as THREE from "three";
// Keeps the Leva settings in localStorage, so they survive a reload.
// Storage can be unavailable (private windows, blocked site data), so every access is guarded
// and the app falls back to the defaults.



const STORAGE_KEY = "pandarchy.settings";

function readAll(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Read once at startup; later changes are only written, never read back.
const saved = readAll();

/** The saved value for `name`, or `fallback` if there is none or it has the wrong type. */
export function restored<T extends boolean | number | string | number[] | THREE.Vector3 | {x: 0, y: 0, z: 0} | [number, number, number]>(name: string, fallback: T): T {
  const value = saved[name];
  return typeof value === typeof fallback ? (value as T) : fallback;
}

export function saveSettings(settings: Record<string, unknown>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable: settings just won't persist.
  }
}
