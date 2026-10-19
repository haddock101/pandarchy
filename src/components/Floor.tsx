import { RigidBody } from "@react-three/rapier";

// The green ground under everything. The checkered floors and their colliders live with the walls (Wall.tsx).
function Floor() {
  return (
    <>
      <RigidBody type="fixed">
        <mesh position={[28, -1.6, 0]}>
          <boxGeometry args={[56, 2, 31]} />
          <meshStandardMaterial color="chartreuse" />
        </mesh>
      </RigidBody>
    </>
  );
}
export default Floor;
