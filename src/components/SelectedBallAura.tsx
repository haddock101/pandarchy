import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { getControlledBall, getControlledBallObject } from "../controlledBall.ts";
import { BALL } from "../config.ts";

type SelectedBallAuraProps = {
  /** Radius of the balls it surrounds. */
  ballRadius?: number;
  color?: string;
};

// A soft glow on a disc that always faces the camera, centred on the ball: the ball itself hides the
// middle, so what shows is a halo around its edge. It breathes slowly.
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uInner; // where the ball's edge is, as a fraction of the disc's radius
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float glow = 1.0 - clamp((d - uInner) / (1.0 - uInner), 0.0, 1.0);
    gl_FragColor = vec4(uColor, glow * glow * uOpacity);
  }
`;
const AURA_SCALE = 2.4; // disc radius, in ball radii

// Sparkles: a few soft dots circling the ball at different heights and speeds, each twinkling.
// (drei's <Sparkles> reads state.clock, which this canary of react-three-fiber no longer has.)
const SPARKLE_COUNT = 18;
// Point size in CSS pixels at one unit from the camera; scaled by the screen's pixel ratio each frame
const SPARKLE_SIZE = 140;
// Each sparkle's orbit, picked once when the module loads: radius and height in ball radii,
// angular speed (either way round) and starting angle
const SPARKLE_SEEDS = new Float32Array(SPARKLE_COUNT * 4);
for (let i = 0; i < SPARKLE_COUNT; i++) {
  SPARKLE_SEEDS.set(
    [
      1.2 + Math.random() * 0.7,
      Math.random() * 2.4 - 1.2,
      (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.6),
      Math.random() * Math.PI * 2,
    ],
    i * 4,
  );
}
const sparkleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uBallRadius;
  attribute vec4 aSeed; // radius and height (in ball radii), angular speed, phase
  varying float vTwinkle;
  void main() {
    float angle = aSeed.w + uTime * aSeed.z;
    vec3 p = uBallRadius * vec3(cos(angle) * aSeed.x, aSeed.y + 0.16 * sin(uTime * 1.3 + aSeed.w * 3.0), sin(angle) * aSeed.x);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vTwinkle = 0.5 + 0.5 * sin(uTime * (2.0 + aSeed.z * 3.0) + aSeed.w * 7.0);
    gl_PointSize = uSize * (0.6 + 0.4 * vTwinkle) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const sparkleFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.0, 1.0, d)) * vTwinkle;
    gl_FragColor = vec4(uColor, a);
  }
`;

/** Marks the ball the keyboard controls (the last one clicked or touched) with a glowing halo and a few sparkles. */
export function SelectedBallAura({ ballRadius = BALL.radius, color = "#9ff3ff" }: SelectedBallAuraProps) {
  const groupRef = useRef<THREE.Group>(null);
  const discRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);
  const sparklesRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

  const sparkles = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    // Positions are computed in the shader; the attribute is only there to give each point a vertex
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(SPARKLE_COUNT * 3), 3));
    geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(SPARKLE_SEEDS, 4));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), ballRadius * 3);
    const sparkleMaterial = new THREE.ShaderMaterial({
      vertexShader: sparkleVertex,
      fragmentShader: sparkleFragment,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: SPARKLE_SIZE },
        uBallRadius: { value: ballRadius },
        uColor: { value: new THREE.Color(color) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material: sparkleMaterial };
  }, [ballRadius, color]);
  useEffect(
    () => () => {
      sparkles.geometry.dispose();
      sparkles.material.dispose();
    },
    [sparkles],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: 0.6 },
          uInner: { value: 1 / AURA_SCALE },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ elapsed, viewport }) => {
    const group = groupRef.current;
    if (!group) return;
    const body = getControlledBall();
    const object = getControlledBallObject();
    // Nothing selected, or the selected ball has been parked back in the pool
    if (!body || !object || !body.isEnabled()) {
      group.visible = false;
      return;
    }
    group.visible = true;
    object.getWorldPosition(group.position);
    const disc = discRef.current;
    if (disc) disc.material.uniforms.uOpacity.value = 0.45 + 0.2 * Math.sin(elapsed * 2.5);
    const points = sparklesRef.current;
    if (points) {
      points.material.uniforms.uTime.value = elapsed;
      // gl_PointSize is in device pixels, so on high-density screens points would otherwise shrink
      points.material.uniforms.uSize.value = SPARKLE_SIZE * viewport.dpr;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <Billboard>
        <mesh ref={discRef} material={material} scale={ballRadius * AURA_SCALE} raycast={() => {}}>
          <circleGeometry args={[1, 48]} />
        </mesh>
      </Billboard>
      <points ref={sparklesRef} geometry={sparkles.geometry} material={sparkles.material} raycast={() => {}} />
    </group>
  );
}
