import { RigidBody } from "@react-three/rapier";


export function Wall() {
  return (
    <RigidBody type="fixed">
      <mesh receiveShadow position={[13, 2, 0]}>
        <boxGeometry args={[1, 7, 27]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    </RigidBody>
  );
}


export function SideWall() {
  return (
    <RigidBody type="fixed">
      <mesh receiveShadow position={[0, 2, -13]}>
        <boxGeometry args={[27, 7, 1]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    </RigidBody>
  );
}

export function FrontWall() {
  return (
    <RigidBody type="fixed">
      <mesh position={[-13, 2, 0]}>
        <boxGeometry args={[1, 7, 27]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    </RigidBody>
  );
}

export function BackWall() {
  return (
    <RigidBody type="fixed">
      <mesh position={[0, 2, 13]}>
        <boxGeometry args={[27, 7, 1]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    </RigidBody>
  );
}
