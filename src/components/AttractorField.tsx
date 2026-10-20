import { useEffect, useMemo, useRef } from "react";
import { useFrame, type Vector3 } from "@react-three/fiber";
import * as THREE from "three";
import { Timer } from "three";

type AttractorFieldProps = {
  /** Centre of the field, on the floor. */
  position: Vector3;
  /** Radius on the floor, normally where the Attractor's range meets the floor. */
  radius: number;
  color?: string;
  /** How many rings are travelling inwards at once. */
  rings?: number;
  /** Seconds for a ring to travel from the edge to the centre. */
  period?: number;
  /** Peak brightness; keep it low for a hint rather than an effect. */
  opacity?: number;
  /** When false the field fades out, e.g. while the Attractor is switched off. */
  active?: boolean;
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Thin rings drift towards the centre: each has a crisp inner edge and a soft tail behind it,
// and the whole field fades out at its rim and near the middle.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uRings;
  uniform float uPeriod;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0; // 0 at the centre, 1 at the rim
    float phase = fract(d * uRings + uTime / uPeriod);
    float ring = smoothstep(0.0, 0.03, phase) * (1.0 - smoothstep(0.03, 0.4, phase));
    float fade = smoothstep(0.08, 0.3, d) * (1.0 - smoothstep(0.7, 1.0, d));
    gl_FragColor = vec4(uColor, ring * fade * uOpacity);
  }
`;

/**
 * A subtle floor-level hint for an Attractor: faint rings drift inwards across the floor
 * towards whatever it pulls things into. Purely visual, with no colliders, and it ignores the pointer.
 */
export function AttractorField({
  position,
  radius,
  color = "chartreuse",
  rings = 6,
  period = 0.8,
  opacity = 0.15,
  active = true,
}: AttractorFieldProps) {
  const meshRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: 0 }, // eased up to `opacity` in useFrame, so the field fades in
          uTime: { value: 0 },
          uRings: { value: rings },
          uPeriod: { value: period },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        // Sit on the floor without flickering against it
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [color, rings, period],
  );
  useEffect(() => () => material.dispose(), [material]);

  const timer = new Timer();
  

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { uniforms } = mesh.material;
    const elapsed = timer.getElapsed(); 
    uniforms.uTime.value = elapsed;
    // Ease towards the target brightness, so switching on and off fades instead of popping
    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, active ? opacity : 0, 6, delta);
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} scale={radius} material={material} raycast={() => {}}>
      <circleGeometry args={[1, 64]} />
    </mesh>
  );
}
