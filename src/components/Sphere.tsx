import { useRef, useMemo } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Sparkles, Shadow } from "@react-three/drei";
import Glow from "./Glow.tsx";


/* @ts-expect-error: Unknown */
function CloneRef({ ref, ...props }) {
  const { scene } = ref;

  // Safely clone the asset mesh so instances don't share the same material/geometry transformations
  const clone = useMemo(() => scene.clone(), [scene]);

  return <primitive object={clone} {...props} />;
}

/* @ts-expect-error: Unknown */
export const CloneSphere = ({ ref, position, ...props }) => {
  return (
    <RigidBody
      position={position}
      // colliders="ball"  Auto-generates a hull collider matching the mesh
      // restitution={1.2} // Determines how bouncy the ball is
      // friction={0} // Slide resistance
      {...props}
    >
      <CloneRef ref={ref} />
    </RigidBody>
  );
};

export const Sphere = ({
  size = 1,
  amount = 50,
  color = "white",
  emissive,
  glow,
  ...props
}: {
  size: number;
  amount: number;
  color: string;
  emissive: string;
  glow: string;
}) => {
  const sRef = useRef<RapierRigidBody>(null!);
  return (
    // sensor onIntersectionEnter={() => console.log("Passed through!")}
    <RigidBody type="fixed" colliders="ball" ref={sRef}>
      <mesh {...props}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhysicalMaterial
          roughness={0}
          color={color}
          emissive={emissive || color}
          envMapIntensity={0.2}
        />
        <Glow
          scale={size * 2.2}
          near={-25}
          color={glow || emissive || color}
          far={1.0}
        />
        <Sparkles count={amount} scale={size * 2} size={6} speed={0.4} />
        <Shadow
          rotation={[-Math.PI / 2, 0, 0]}
          scale={size * 1.5}
          position={[0, -size, 0]}
          color="black"
          opacity={1}
        />
      </mesh>
    </RigidBody>
  );
};
export default Sphere;
