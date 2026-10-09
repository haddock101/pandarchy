import { useRef } from "react";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
function Box() {
  const ref = useRef<RapierRigidBody>(null);
  const handleJump = () => {
      // Apply an upward impulse on the y-axis
    if (ref.current) {
      ref.current.applyImpulse({ x: 0.0001, y: 0.05, z: 0.005 }, true)
    }
  }
  return (
    <RigidBody name="pinkbox" ref={ref} colliders="cuboid" >
      <mesh
        position={[8, 5, 8]}
        rotation={[
          (Math.PI / 180) * 3,
          (Math.PI / 180) * 40,
          (Math.PI / 180) * 75,
        ]}
        onClick={() => {
          handleJump()
        }}
      >
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </RigidBody>
  );
}
export default Box;
