import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type PortraitFovProps = {
  /** The vertical field of view (degrees) on screens at least `minAspect` wide. */
  fov: number;
  /** Narrower than this (width / height), the view widens so the scene isn't cropped at the sides. */
  minAspect?: number;
  /** Upper limit, since very wide angles look distorted. */
  maxFov?: number;
};

/**
 * A perspective camera keeps its vertical field of view, so on a tall, narrow phone screen the sides
 * of the scene get cut off. This widens the vertical view on such screens so the horizontal view
 * stays what it would be at `minAspect`.
 */
export function PortraitFov({ fov, minAspect = 1, maxFov = 95 }: PortraitFovProps) {
  const get = useThree((state) => state.get);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  useEffect(() => {
    const { camera } = get();
    if (!(camera instanceof THREE.PerspectiveCamera) || height === 0) return;
    const widen = Math.max(1, minAspect / (width / height));
    const halfTan = Math.tan(THREE.MathUtils.degToRad(fov) / 2) * widen;
    camera.fov = Math.min(THREE.MathUtils.radToDeg(2 * Math.atan(halfTan)), maxFov);
    camera.updateProjectionMatrix();
  }, [get, width, height, fov, minAspect, maxFov]);

  return null;
}
