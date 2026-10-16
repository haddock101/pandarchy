import { RigidBody, CuboidCollider } from "@react-three/rapier";
import type { Vector3 } from "@react-three/fiber";

type ContainerProps = {
  visible: boolean;
  opacity: number;
  /** Log collisions and sensor hits to the console. */
  debug?: boolean;
};

const walls: { name: string; position: Vector3; scale: Vector3 }[] = [
  { name: "wall1", position: [3, 2.75, 0], scale: [1, 6, 6] },
  { name: "wall2", position: [-3, 2.75, 0], scale: [1, 6, 6] },
  { name: "wall3", position: [0, 2.75, 3], scale: [6, 6, 1] },
  { name: "wall4", position: [0, 2.75, -3], scale: [6, 6, 1] },
];

function ContainerBox({ visible, opacity }: ContainerProps) {
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

export function InvisibleContainer({ visible, opacity, debug }: ContainerProps) {
  return (
    <>
      <RigidBody type="fixed" position={[0, -0.55, 0]} scale={[6, 1, 6]}>
        <CuboidCollider
          args={[0.5, 0.5, 0.5]}
          onCollisionEnter={({ other }) => {
            if (debug) console.log(`${other.rigidBodyObject?.name} hit the ground`);
          }}
        />
        <ContainerBox visible={visible} opacity={opacity} />
      </RigidBody>
      {walls.map(({ name, position, scale }) => (
        <RigidBody key={name} type="fixed" position={position} scale={scale}>
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
