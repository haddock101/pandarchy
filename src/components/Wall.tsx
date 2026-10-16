import { RigidBody } from "@react-three/rapier";
import type { Vector3 } from "@react-three/fiber";

const walls: {
  name: string;
  position: Vector3;
  size: [number, number, number];
}[] = [
  { name: "wall", position: [13, 2, 0], size: [1, 7, 27] },
  { name: "sideWall", position: [0, 2, -13], size: [27, 7, 1] },
  { name: "frontWall", position: [-13, 2, 0], size: [1, 7, 27] },
  { name: "backWall", position: [0, 2, 13], size: [27, 7, 1] },
];

/** The four grey walls around the floor. */
export function Walls() {
  return (
    <>
      {walls.map(({ name, position, size }) => (
        <RigidBody key={name} name={name} type="fixed" colliders="cuboid" restitution={3} friction={1}>
          <mesh receiveShadow position={position}>
            <boxGeometry args={size} />
            <meshStandardMaterial color="#888888" />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
