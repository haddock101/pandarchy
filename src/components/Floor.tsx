
import { RigidBody } from "@react-three/rapier";
import CheckeredBox from "./CheckeredBox";

function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid" >
      <CheckeredBox position={[0, -0.9, 0]} />
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[25, 2, 25]} />
        <meshBasicMaterial color="chartreuse" visible={false} />
      </mesh>
    </RigidBody>
  );
}
export default Floor;
