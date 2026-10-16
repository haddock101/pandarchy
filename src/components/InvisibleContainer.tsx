import { RigidBody, CuboidCollider } from "@react-three/rapier";

const InvisibleWall1 = ({ visible, opacity }: { visible: boolean; opacity: number; }) => {
  return (
    // Creates a fixed, invisible cuboid collider
    <RigidBody
      type="fixed"
      position={[3, 2.75, 0]}
      scale={[1, 6, 6]}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor={true}
        onIntersectionEnter={({ other  }) => {
          console.log( other.rigidBodyObject?.name + ' hit InvisibleWall1' );
        }}

      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" transparent={true} opacity={opacity} visible={visible} />
      </mesh>
    </RigidBody>
  );
};

const InvisibleWall2 = ({ visible, opacity }: { visible: boolean; opacity: number; }) => {
  return (
    // Creates a fixed, invisible cuboid collider
    <RigidBody
      type="fixed"

      position={[-3, 2.75, 0]}
      scale={[1, 6, 6]}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor={true}
        onIntersectionEnter={({ other }) => {
          console.log( other.rigidBodyObject?.name + ' hit wall2' );
        }}

      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" transparent={true} opacity={opacity} visible={visible} />
      </mesh>
    </RigidBody>
  );
};
const InvisibleWall3 = ({ visible, opacity }: { visible: boolean; opacity: number; }) => {
  return (
    <RigidBody
      type="fixed"
      position={[0, 2.75, 3]}
      scale={[6, 6, 1]}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor={true}
        onIntersectionEnter={({ other }) => {
          console.log( other.rigidBodyObject?.name + ' hit wall3' );
        }}

      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" transparent={true} opacity={opacity} visible={visible} />
      </mesh>
    </RigidBody>
  );
};
const InvisibleWall4 = ({ visible, opacity }: { visible: boolean; opacity: number; }) => {
  return (
    <RigidBody
      type="fixed"
      position={[0, 2.75, -3]}
      scale={[6, 6, 1]}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor={true}
        onIntersectionEnter={({ other }) => {
          console.log( other.rigidBodyObject?.name + ' hit wall4' );
        }}

      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" transparent={true} opacity={opacity} visible={visible} />
      </mesh>
    </RigidBody>
  );
};

export function InvisibleContainer({ visible, opacity }: { visible: boolean;  opacity: number; }) {
  return (
    // Creates a fixed, invisible cuboid collider
    <>
      <RigidBody
        type="fixed"
        position={[0, -0.55, 0]}
        scale={[6, 1, 6]}
      >
        <CuboidCollider
          args={[0.5, 0.5, 0.5]}
          sensor={false}
          onIntersectionEnter={({ other }) => {
            console.log( other.rigidBodyObject?.name + ' hit the ground' );
          }}
        />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="white" transparent={true} opacity={ opacity } visible={ visible }  />
        </mesh>
      </RigidBody>
      <InvisibleWall1 opacity={ opacity } visible={ visible } />
      <InvisibleWall2 opacity={ opacity } visible={ visible } />
      <InvisibleWall3 opacity={ opacity } visible={ visible } />
      <InvisibleWall4 opacity={ opacity } visible={ visible } />
    </>
  );
}
export default InvisibleContainer;
