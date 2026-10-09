import { useState, useRef } from "react";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";

function SpringBoard() {
  const ref = useRef<RapierRigidBody>(null);
  const [active, setActive] = useState(false);
  const handleBounce = () => {
      // Apply an upward impulse on the y-axis
    if (ref.current) {
      // console.log(ref.current);
      /* @ts-expect-error: Unknown */
      ref.current.setRotation([0, 0, 0, 0], true);
      // ref.current.applyImpulse({ x: 0.0001, y: 0.05, z: 0.005 }, true)
    }
  }
  return (
    <RigidBody name="SpringBoard" ref={ref} colliders="cuboid" type="fixed" sensor
      onIntersectionEnter={({ other }) => {
        console.log(other.rigidBodyObject?.name + " hit the SpringBoard");
        // console.log("An object entered the ghost zone!", other.rigidBodyObject.name)
      }}
      onIntersectionExit={() => {
        // console.log("An object left the ghost zone!")
      }}
    >
      <mesh
        castShadow
        scale={active ? 1.02 : 1}
        position={[1.575, -0.45, 1.575]}
        rotation={[
          (Math.PI / 180) * 0,
          (Math.PI / 180) * 0,
          (Math.PI / 180) * 0,
        ]}
        onClick={() => {
          setActive(!active)
          handleBounce()
        }}
      >
        <boxGeometry args={[3, 0.2, 3]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </RigidBody>
  );
}
export default SpringBoard;
