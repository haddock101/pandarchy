import { RigidBody } from "@react-three/rapier";
import type { Vector3 } from "@react-three/fiber";
import CheckeredBox from "./CheckeredBox";
import { generateSeededKey } from "./playfulRandomId";
import { SCENE } from "../config";

type Vec3 = [number, number, number];

// Each set's origin is the top of its checkered floor, placed at SCENE.floorY in world space.
const FLOOR_TOP = SCENE.floorY / SCENE.floorScale[1];

const walls: {
  set: {
    name: string;
    /** Tilt around z, in true world radians; negative raises the -x end. */
    slope: number;
    /** The point the set tilts around, in the same (scaled) coordinates as `offset`. */
    hinge: Vec3;
    offset: Vec3;
    walls: {
      name: string;
      position: Vector3;
      size: Vec3;
    }[];
  }
}[] = [
    {
      set: {
        slope: 0,
        hinge: [0, FLOOR_TOP, 0],
        name: "group1",
        offset: [25, FLOOR_TOP, 0],
        walls: [
          { name: "frontWall", position: [0, 3.4, 13], size: [50, 7, 1] },
          { name: "backWall", position: [0, 3.4, -13], size: [50, 7, 1] },
          { name: "rightWall", position: [25.5, 3.4, 0], size: [1, 7, 27] }
        ],
      },
    },
    {
      set: {
        // Rises towards the left wall, hinged on the floor's top edge at the seam with group1,
        // so the two floors stay joined and group1 stays flat.
        slope: -SCENE.leftSectionSlope,
        hinge: [0, FLOOR_TOP, 0],
        name: "group2",
        offset: [-25, FLOOR_TOP, 0],
        walls: [
          { name: "frontWall1", position: [0, 3.4, 13], size: [50, 7, 1] },
          { name: "backWall1", position: [0, 3.4, -13], size: [50, 7, 1] },
          { name: "leftWall", position: [-25.5, 3.4, 0], size: [1, 7, 27] },
        ],
      },
    }]
  ;

const [sx, sy, sz] = SCENE.floorScale;
const unscale: Vec3 = [1 / sx, 1 / sy, 1 / sz];
const minus = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export function Walls() {
  return (
    <>
      {walls.map(group => {
        return (
          // App scales everything here by SCENE.floorScale. Rotating inside that squashed space would
          // flatten the angle and shear the boxes (and their colliders), so the tilt is applied with
          // the scale undone, around the hinge, and the scale put back inside it.
          <group key={group.set.name+generateSeededKey(group.set.name)} position={group.set.hinge}>
          <group scale={unscale}>
          <group key={group.set.name+generateSeededKey(group.set.name + "a", group.set.name)} rotation={[0, 0, group.set.slope]}>
          <group scale={SCENE.floorScale}>
          <group position={minus(group.set.offset, group.set.hinge)}>

            {group.set.walls.map(({ name, position, size }) => (
              <RigidBody key={group.set.name + ":wall" + name} name={"wall" + name} type="fixed" colliders="cuboid" restitution={1.5} friction={1}>
                <mesh key={group.set.name + ":mesh" + name} receiveShadow position={position}>
                  <boxGeometry key={group.set.name + ":geometry" + name} args={size} />
                  <meshStandardMaterial color="#888888" />
                </mesh>
              </RigidBody>
            ))}
            <RigidBody key={"floorRigidBody+group" + group.set.name} type="fixed" friction={0.5} colliders="cuboid">
              {/* The checkered top and the thicker invisible box under it both end at the set's origin, so
                  balls roll on the surface you see, at SCENE.floorY, which the catapult's rest angle is built on.
                  A position needs all three numbers: [0, 0] left z undefined, which put the collider at NaN
                  and crashed Rapier. */}
              <CheckeredBox key={"floor1+group" + group.set.name} name={"floor1" + group.set.name} position={[0, -0.5, 0]} />
              <mesh key={"floorMesh+group" + group.set.name} receiveShadow position={[0, -1, 0]}>
                <boxGeometry key={"floorGeometry+group" + group.set.name} args={[50, 2, 25]} />
                <meshBasicMaterial key={"floorMaterial+group" + group.set.name} visible={false} />
              </mesh>
            </RigidBody>
          </group>
          </group>
          </group>
          </group>
          </group>
        );
      })}
    </>
  );
}
