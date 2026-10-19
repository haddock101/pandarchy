import { RigidBody, CuboidCollider } from "@react-three/rapier";
import type { Vector3 } from "@react-three/fiber";

type Size = { x: number; y: number; z: number };

type ContainerProps = {
  visible: boolean;
  opacity: number;
  /** Log collisions and sensor hits to the console. */
  debug?: boolean;
  /** The space inside: width (x), height (y) from the floor to the ceiling, and depth (z). */
  size?: Size;
};

/** Floor, ceiling and walls are all this thick, whatever the size. */
const THICKNESS = 1;
/** The floor's top surface, where the inside starts. */
const FLOOR_TOP = -0.05;
const DEFAULT_SIZE: Size = { x: 20, y: 15, z: 5 };

/** Where each slab goes for a given inner size. */
function layout(size: Size) {
  const t = THICKNESS;
  const wallHeight = size.y + t; // from the floor's level up to the ceiling's top
  const slab = { x: size.x + t, z: size.z + t }; // floor and ceiling reach halfway into the walls
  return {
    floor: { position: [0, FLOOR_TOP - t / 2, 0] as Vector3, scale: [slab.x, t, slab.z] as Vector3 },
    ceiling: { position: [0, FLOOR_TOP + size.y + t / 2, 0] as Vector3, scale: [slab.x, t, slab.z] as Vector3 },
    walls: [
      { name: "iwall21", position: [(size.x + t) / 2, wallHeight / 2, 0], scale: [t, wallHeight, slab.z] },
      { name: "iwall22", position: [-(size.x + t) / 2, wallHeight / 2, 0], scale: [t, wallHeight, slab.z] },
      { name: "iwall23", position: [0, wallHeight / 2, (size.z + t) / 2], scale: [slab.x, wallHeight, t] },
      { name: "iwall24", position: [0, wallHeight / 2, -(size.z + t) / 2], scale: [slab.x, wallHeight, t] },
    ] as { name: string; position: Vector3; scale: Vector3 }[],
  };
}

function ContainerBox({ visible, opacity }: Pick<ContainerProps, "visible" | "opacity">) {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color="white"
        transparent
        opacity={opacity}
        visible={visible}
      />
    </mesh>
  );
}

export function InvisibleContainer({ visible, opacity, debug, size = DEFAULT_SIZE }: ContainerProps) {
  const { floor, ceiling, walls } = layout(size);
  return (
    <>
      <RigidBody type="fixed" position={floor.position} scale={floor.scale}>
        <CuboidCollider
          args={[0.5, 0.5, 0.5]}
          onCollisionEnter={({ other }) => {
            if (debug) console.log(`${other.rigidBodyObject?.name} hit the ground`);
          }}
        />
        <ContainerBox visible={visible} opacity={opacity} />
      </RigidBody>
      <RigidBody type="fixed" position={ceiling.position} scale={ceiling.scale}>
        <CuboidCollider
          args={[0.5, 0.5, 0.5]}
          onCollisionEnter={({ other }) => {
            if (debug) console.log(`${other.rigidBodyObject?.name} hit the ceiling`);
          }}
        /> 
        <ContainerBox visible={visible} opacity={opacity} />
      </RigidBody>
      {walls.map(({ name, position, scale }) => (
        <RigidBody key={name+position.toString()} type="fixed" position={position} scale={scale}>
          <CuboidCollider
            args={[0.5, 0.5, 0.5]}
            sensor
            onIntersectionEnter={({ other }) => {
              if (debug) console.log(`${other.rigidBodyObject?.name} hit ${name}`);
            }}
          />
          <ContainerBox visible={visible} opacity={opacity} />
        </RigidBody>
      ))}
    </>
  );
}

export default InvisibleContainer;
