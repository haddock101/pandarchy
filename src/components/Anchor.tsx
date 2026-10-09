import { useRef } from "react";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
function Anchor({ bounceMultiplier }: {bounceMultiplier: number;}) {
  const ref = useRef<RapierRigidBody>(null);
  const handleJump = () => {
    console.log(ref);
      // Apply an upward impulse on the y-axis
    if (ref.current) {
      ref.current.applyTorqueImpulse({ x: 0, y: 0.005, z: 0.001 }, true);
      ref.current.applyImpulse({ x: 0.0001 * (1-Math.random()) * bounceMultiplier, y: 0.15 * Math.random() * bounceMultiplier, z: 0.005 * (1-Math.random()) * bounceMultiplier }, true)
    }
  }
  return (
    <RigidBody ref={ref} >
      <mesh
        position={[0, 0, 0]}
        onClick={() => {
          console.log("d");
          handleJump()
        }}
      >
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </RigidBody>
  );
}
export default Anchor;
