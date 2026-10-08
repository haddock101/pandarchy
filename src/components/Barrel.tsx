import { useGLTF } from "@react-three/drei";

export function Barrel() {
  const obj = useGLTF("glb/barrel.glb");
  return (
    <primitive
      object={obj}
      position={[5, 0.5, -5]}
      scale={20}
      rotation={[0, (Math.PI / 180) * -40, 0]}
    />
  );
}
