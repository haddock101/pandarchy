import { RigidBody } from "@react-three/rapier";
import { Sparkles, Shadow } from "@react-three/drei";
import Glow from "./Glow.tsx"

const Sphere = ({
  size = 1,
  amount = 50,
  color = "white",
  emissive,
  glow,
  ...props
}: { size: number; amount: number; color: string; emissive: string; glow: string; }) => (
  // sensor onIntersectionEnter={() => console.log("Passed through!")}
  <RigidBody type="fixed" colliders="ball" >
    <mesh {...props} >
      <sphereGeometry args={[size, 32, 32]}  />
      <meshPhysicalMaterial
        roughness={0}
        color={color}
        emissive={emissive || color}
        envMapIntensity={0.2}
      />
      <Glow scale={size * 1.2} near={-25} color={glow || emissive || color} far={1.0} />
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
export default Sphere;
