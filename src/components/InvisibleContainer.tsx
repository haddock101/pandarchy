import { RigidBody, CuboidCollider } from "@react-three/rapier";

const InvisibleWall1 = ({ opacity }: { opacity: number; }) => {
  return (
    // Creates a fixed, invisible cuboid collider
    <RigidBody
      type="fixed"

      position={[3, 2.75, 0]}
      scale={[0.3, 6, 6]}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor={true} // 👈 This makes it a ghost/trigger zone
        onIntersectionEnter={({ other  }) => {
          console.log( other.rigidBodyObject?.name + ' hit InvisibleWall1' );
        }}
        onIntersectionExit={() => {
          //   console.log("An object left the ghost zone!")
        }}
      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" transparent={true} opacity={opacity} />
      </mesh>
    </RigidBody>
  );
};

const InvisibleWall2 = ({ opacity }: { opacity: number; }) => {
  return (
    // Creates a fixed, invisible cuboid collider
    <RigidBody
      type="fixed"

      position={[-3, 2.75, 0]}
      scale={[0.3, 6, 6]}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor={true} // 👈 This makes it a ghost/trigger zone
        onIntersectionEnter={({ other }) => {
          console.log( other.rigidBodyObject?.name + ' hit wall2' );
        }}
        onIntersectionExit={() => {
          // console.log("An object left the ghost zone!")
        }}
      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" transparent={true} opacity={opacity} />
      </mesh>
    </RigidBody>
  );
};
const InvisibleWall3 = ({ opacity }: { opacity: number; }) => {
  return (
    // Creates a fixed, invisible cuboid collider
    <RigidBody
      type="fixed"

      position={[0, 2.75, 3]}
      scale={[6, 6, 0.3]}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor={true} // 👈 This makes it a ghost/trigger zone
        onIntersectionEnter={({ other }) => {
          console.log( other.rigidBodyObject?.name + ' hit wall3' );
        }}
        onIntersectionExit={() => {
          //  console.log("An object left the ghost zone!")
        }}
      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" transparent={true} opacity={opacity} />
      </mesh>
    </RigidBody>
  );
};
const InvisibleWall4 = ({ opacity }: { opacity: number; }) => {
  return (
    // Creates a fixed, invisible cuboid collider
    <RigidBody
      type="fixed"

      position={[0, 2.75, -3]}
      scale={[6, 6, 0.3]}
    >
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor={true} // 👈 This makes it a ghost/trigger zone
        onIntersectionEnter={({ other }) => {
          console.log( other.rigidBodyObject?.name + ' hit wall4' );
        }}
        onIntersectionExit={() => {
          // console.log("An object left the ghost zone!")
        }}
      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="white" transparent={true} opacity={opacity} />
      </mesh>
    </RigidBody>
  );
};

export function InvisibleContainer({ opacity }: { opacity: number; }) {

  return (
    // Creates a fixed, invisible cuboid collider
    <>
      <RigidBody
        type="fixed"
        colliders="cuboid"
        position={[0, -0.25, 0]}
        scale={[6, 0.3, 6]}
      >
        <CuboidCollider
          args={[0.5, 0.5, 0.5]}
          sensor={false} // 👈 This makes it a ghost/trigger zone
          onIntersectionEnter={({ other }) => {
            console.log( other.rigidBodyObject?.name + ' hit the ground' );
            // console.log("An object entered the ghost zone!", other.rigidBodyObject.name)
          }}
          onIntersectionExit={() => {
            // console.log("An object left the ghost zone!")
          }}
        />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="white" transparent={true} opacity={ opacity }  />
        </mesh>
      </RigidBody>
      <InvisibleWall1 opacity={ opacity } />
      <InvisibleWall2 opacity={ opacity } />
      <InvisibleWall3 opacity={ opacity } />
      <InvisibleWall4 opacity={ opacity } />
    </>
  );
}
