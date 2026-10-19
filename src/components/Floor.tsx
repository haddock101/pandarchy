import { RigidBody } from "@react-three/rapier";
import CheckeredBox from "./CheckeredBox";

function Floor() {
  return (
    <>
      <RigidBody type="fixed">
        <mesh position={[0, -1.6, 0]}>
          <boxGeometry args={[31, 2, 31]} />
          <meshStandardMaterial color="chartreuse" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.5} colliders="cuboid">
        <CheckeredBox position={[0, -0.9, 0]} />
        <mesh receiveShadow position={[0, -2, 0]}>
          <boxGeometry args={[25, 2, 25]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
    </>
  );
}
export default Floor;
