import { useRef, useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useLoader, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";

const GrassMaterialShader = {
  uniforms: {
    uTime: { value: 0 },
    uWindSpeed: { value: 1.5 },
    uWindStrength: { value: 0.3 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uWindSpeed;
    uniform float uWindStrength;
    varying vec2 vUv;
    varying float vY;

    void main() {
      vUv = uv;
      vY = position.y;

      // Calculate a simple wave based on time and instance position
      vec4 instancePosition = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      float wave = sin(uTime * uWindSpeed + instancePosition.x * 2.0 + instancePosition.z * 2.0);

      // Only bend the top part of the blade (where position.y > 0)
      vec3 transformed = position;
      if (transformed.y > 0.0) {
        transformed.x += wave * uWindStrength * transformed.y;
        transformed.z += wave * uWindStrength * 0.5 * transformed.y;
      }

      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vY;

    void main() {
      // Gradient from a dark earth green at the base to a bright grass green at the tip
      vec3 baseColor = vec3(0.05, 0.2, 0.05);
      vec3 tipColor = vec3(0.2, 0.6, 0.1);

      // Mix colors based on the height of the blade
      vec3 finalColor = mix(baseColor, tipColor, vY * 2.0);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

function MoundAndGrass({ count = 15000 }) {
  const meshRef = useRef();
  const materialRef = useRef();

  // Create a base mound geometry (a distorted sphere or hemisphere)
  const moundGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(
      3,
      64,
      64,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    const pos = geo.attributes.position;

    // Distort the hemisphere subtly to look like an organic hill
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Basic noise simulation using trig functions to create bumps
      y += Math.sin(x * 1.5) * 0.15 + Math.cos(z * 1.5) * 0.15;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Generate single grass blade shape geometry
  const grassBladeGeometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.04, 0.4, 3);
    geo.translate(0, 0.2, 0); // Shift origin to the base of the blade
    return geo;
  }, []);

  // Generate positions for every grass blade across the surface of the mound
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useMemo(() => {
    // Wait for the next tick to ensure the ref is populated if updating dynamically
    setTimeout(() => {
      if (!meshRef.current) return;

      const raycaster = new THREE.Raycaster();
      const tempTarget = new THREE.Mesh(moundGeometry);
      const up = new THREE.Vector3(0, 1, 0);

      for (let i = 0; i < count; i++) {
        // Random distribution within the mound radius
        const radius = Math.random() * 2.9;
        const theta = Math.random() * Math.PI * 2;
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);

        // Raycast downwards to find the exact Y height of the organic mound
        raycaster.set(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0));
        const intersections = raycaster.intersectObject(tempTarget);

        if (intersections.length > 0) {
          const y = intersections[0].point.y;
          dummy.position.set(x, y, z);

          // Randomize rotation and scaling for realistic variation
          dummy.rotation.set(
            (Math.random() - 0.5) * 0.4,
            Math.random() * Math.PI,
            (Math.random() - 0.5) * 0.4,
          );
          const scale = 0.6 + Math.random() * 0.6;
          dummy.scale.set(scale, scale, scale);

          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }, 0);
  }, [count, moundGeometry, dummy]);

  // Animate the custom shader uniform time variable for the wind effect
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });
  return (
    <group>
      {/* The Dirt Mound Ground */}
      <mesh geometry={moundGeometry} receiveShadow>
        <meshStandardMaterial color="#2d2214" roughness={0.9} />
      </mesh>

      {/* The Instanced Grass Blades */}
      <instancedMesh
        ref={meshRef}
        args={[grassBladeGeometry, null, count]}
        castShadow
      >
        <shaderMaterial
          ref={materialRef}
          args={[GrassMaterialShader]}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}

function Mound() {
  /*
  const colorMap = useTexture('textures/PavingStones130_1K_Color.jpg');
  const normalMap = useTexture('textures/PavingStones130_1K_Color.jpg');
  const roughnessMap = useTexture('textures/PavingStones130_1K_Color.jpg');
  const aoMap = useTexture('textures/PavingStones130_1K_Color.jpg');

 */
  // const colorMap = useTexture('textures/Mound_colorMap.jpg');
  const alphaMap = useTexture('textures/Mound_alphaMap.jpg');

  /* <MoundAndGrass count={2000} /> */
  return (
    <RigidBody type="fixed" colliders="hull" visible={false}>
      <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 180 * 180,Math.PI / 180 * 270,Math.PI / 180 * 90]} scale={[0.1, 2, 2]} >
        <sphereGeometry
          args={[
            2, // radius (size of the mound)
            32, // widthSegments (smoothness)
            16, // heightSegments
          //  0, // phiStart
         //   Math.PI * 2, // phiLength (full horizontal circle)
        //    0, // thetaStart (starts at the very top pole)
        //    Math.PI / 2, // thetaLength (stops exactly at the equator, creating a hemisphere)
          ]}
        />
        <meshStandardMaterial
          // map={colorMap}

          color="#cccccc"
          alphaMap={alphaMap}
          transparent={true}
          opacity={1}
          alphaTest={0} // Optional: cuts off semi-transparent pixels sharply
        />
      </mesh>
    </RigidBody>
  );
}
export default Mound;
