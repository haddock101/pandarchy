import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
// import { type Vector3 } from "@react-three/fiber";
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
export const Cannonball = ({ position, name, ...props }) => {
  return (
    <RigidBody name={name}
      position={position}
      colliders="ball" // Auto-generates a hull collider matching the mesh
      restitution={1} // Determines how bouncy the ball is
      friction={0.5} // Slide resistance
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
      friction={0.1} // Slide resistance
      {...props}
    >
      <CloneGLTFModel url={'/glb/barrel.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const PirateFlag = ({ position, ...props }) => {
  return (
    <RigidBody type="fixed"
      position={position}
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0}
      friction={1}
      // mass={5000}
      {...props}
    >
      <CloneGLTFModel url={'/glb/flag-pirate-high-pennant.glb'} />
    </RigidBody>
  );
};
/* @ts-expect-error: Unknown */
export const Dock = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      colliders="hull" // Auto-generates a hull collider matching the mesh
      type="fixed"
      restitution={0}
      friction={1}
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/structure-platform-dock.glb'} />
    </RigidBody>
  );
};
/* @ts-expect-error: Unknown */
export const Tower = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/tower-complete-large.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const CastleDoor = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/castle-door.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const CastleWindow = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/castle-window.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const CastleWall = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/castle-wall.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const CastleGate = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/castle-gate.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const PalmBent = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/palm-detailed-bend.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const PalmStraightAlt = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/palm-straight.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const PalmStraight = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/palm-detailed-straight.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const PatchSand = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/patch-sand.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const PatchGrass = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/patch-grass.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const PatchGrassFoliage = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/patch-grass-foliage.glb'} />
    </RigidBody>
  );
};

/* @ts-expect-error: Unknown */
export const PatchSandFoliage = ({ position, ...props }) => {
  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders="hull" // Auto-generates a hull collider matching the mesh
      restitution={0} // Determines how bouncy the ball is
      friction={1} // Slide resistance
      // mass={500}
      {...props}
    >
      <CloneGLTFModel url={'/glb/patch-sand-foliage.glb'} />
    </RigidBody>
  );
};
