import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
/*
export default function ModelLibrary() {

}
*/
/* @ts-expect-error: Unknown */
function CloneGLTFModel({ url, ...props }) {
   /* @ts-expect-error: Unknown */
  const { scene } = useGLTF(url);

  // Safely clone the asset mesh so instances don't share the same material/geometry transformations
  const clone = useMemo(() => scene.clone(), [scene]);

  return <primitive object={clone} {...props} />;
}
/* @ts-expect-error: Unknown */
export const Cannonball = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      colliders="ball" // Auto-generates a hull collider matching the mesh
      restitution={1.5} // Determines how bouncy the ball is
      friction={0.0001} // Slide resistance
      {...props}
    >
      <CloneGLTFModel url={'/glb/cannon-ball.glb'} />
    </RigidBody>
  );
};

 /* @ts-expect-error: Unknown */
export const Barrel = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0.2} // Determines how bouncy the ball is
      friction={0.01} // Slide resistance
      {...props}
    >
      <CloneGLTFModel url={'/glb/barrel.glb'} />
    </RigidBody>
  );
};
