import { RigidBody } from "@react-three/rapier";
import type { Vector3 } from "@react-three/fiber";
import CheckeredBox from "./CheckeredBox";
import { generateSeededKey } from "./playfulRandomId";

const walls: {
  set: {
    name: string;
    rotation: [number, number, number];
    offset: [number, number, number];
    walls: {
      name: string;
      position: Vector3;
      size: [number, number, number];
    }[];
  }
}[] = [
    {
      set: {
        rotation: [0, 0, 0],
        name: "group1",
        offset: [25, 1.25, 0],
        walls: [
          { name: "frontWall", position: [0, 3, 13], size: [50, 7, 1] },
          { name: "backWall", position: [0, 3, -13], size: [50, 7, 1] },
          { name: "rightWall", position: [25.5, 3, 0], size: [1, 7, 27] }
        ],
      },
    },
    {
      set: {
        rotation: [0, 0, 0],
        name: "group2",
        offset: [-25, 1.25, 0],
        walls: [
          { name: "frontWall1", position: [0, 3, 13], size: [50, 7, 1] },
          { name: "backWall1", position: [0, 3, -13], size: [50, 7, 1] },
          { name: "leftWall", position: [-25.5, 3, 0], size: [1, 7, 27] },
        ],
      },
    }]
  ;



export function Walls() {
  return (
    <>
      {walls.map(group => {
        return (
          <group key={group.set.name+generateSeededKey(group.set.name)} position={group.set.offset}>
          <group key={group.set.name+generateSeededKey(group.set.name + "a", group.set.name)} rotation={group.set.rotation}>
          
            {group.set.walls.map(({ name, position, size }) => (
              <RigidBody key={group.set.name + ":wall" + name} name={"wall" + name} type="fixed" colliders="cuboid" restitution={1.5} friction={1}>
                <mesh key={group.set.name + ":mesh" + name} receiveShadow position={position}>
                  <boxGeometry key={group.set.name + ":geometry" + name} args={size} />
                  <meshStandardMaterial color="#888888" />
                </mesh>
              </RigidBody>
            ))}
            <RigidBody key={"floorRigidBody+group" + group.set.name} type="fixed" friction={0.5} colliders="cuboid">
              {/* Heights as they were in Floor.tsx: with App's 0.2 vertical scale the checkered top sits at
                  FLOOR_Y (-0.08), which the catapult's rest angle is built on. A position needs all three
                  numbers: [0, 0] left z undefined, which put the collider at NaN and crashed Rapier. */}
              <CheckeredBox key={"floor1+group" + group.set.name} name={"floor1" + group.set.name} position={[0, -0.9, 0]} />
              <mesh key={"floorMesh+group" + group.set.name} receiveShadow position={[0, 0, 0]}>
                <boxGeometry key={"floorGeometry+group" + group.set.name} args={[50, 2, 25]} />
                <meshBasicMaterial key={"floorMaterial+group" + group.set.name} visible={false} />
              </mesh>
            </RigidBody>
          </group>
          </group>
        );
      })}
    </>
  );
}
