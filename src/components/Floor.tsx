
import { RigidBody } from "@react-three/rapier";
import CheckeredBox from "./CheckeredBox";

function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid" >
      <CheckeredBox position={[0, -0.9, 0]} />
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[25, 2, 25]} />
        <meshBasicMaterial transparent={true} opacity={0.1} color="chartreuse" />
      </mesh>
    </RigidBody>
  );
}
export default Floor;
