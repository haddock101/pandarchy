import { useMemo } from "react";
import { RigidBody, type RigidBodyProps } from "@react-three/rapier";
import { useGLTF, Clone } from "@react-three/drei";

// Static scenery by default; entries override what differs.
const staticBody: RigidBodyProps = {
  type: "fixed",
  colliders: "hull",
  restitution: 0,
  friction: 1,
};

const models = {
  cannonball: {
    url: "/glb/cannon-ball.glb",
    body: { type: "dynamic", colliders: "ball", restitution: 1, friction: 0.5 },
  },
  barrel: {
    url: "/glb/barrel.glb",
    body: { type: "dynamic", colliders: "hull", restitution: 0.2, friction: 0.1 },
  },
  pirateFlag: { url: "/glb/flag-pirate-high-pennant.glb" },
  pirateShip: { url: "/glb/ship-pirate-medium.glb" },
  dock: { url: "/glb/structure-platform-dock.glb" },
  tower: { url: "/glb/tower-complete-large.glb" },
  watchTower: { url: "/glb/tower-watch.glb" },
  castleDoor: { url: "/glb/castle-door.glb" },
  castleWindow: { url: "/glb/castle-window.glb" },
  castleWall: { url: "/glb/castle-wall.glb" },
  castleGate: { url: "/glb/castle-gate.glb" },
  palmBent: { url: "/glb/palm-detailed-bend.glb" },
  palmBentSimple: { url: "/glb/palm-bend.glb" },
  palmStraight: { url: "/glb/palm-detailed-straight.glb" },
  palmStraightSimple: { url: "/glb/palm-straight.glb" },
  patchSand: { url: "/glb/patch-sand.glb" },
  patchSandFoliage: { url: "/glb/patch-sand-foliage.glb" },
  patchGrass: { url: "/glb/patch-grass.glb" },
  patchGrassFoliage: { url: "/glb/patch-grass-foliage.glb" },
} satisfies Record<string, { url: string; body?: RigidBodyProps }>;

export type ModelName = keyof typeof models;

/**
 * A GLB model from public/glb wrapped in a RigidBody.
 * Any RigidBody prop (position, type, colliders, mass…) overrides the model's defaults.
 *
 * @example <Model name="barrel" position={[0, 5, 0]} />
 */
export function Model({ name, ...props }: { name: ModelName } & RigidBodyProps) {
  const entry: { url: string; body?: RigidBodyProps } = models[name];
  const { scene } = useGLTF(entry.url);
  // Clone so several instances of one model don't share a scene graph
  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <RigidBody name={name} {...staticBody} {...entry.body} {...props}>
      <Clone object={clone} castShadow />
    </RigidBody>
  );
}
