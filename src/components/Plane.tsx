import { useState, useRef } from "react";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";

function Plane({ bounceMultiplier }: {bounceMultiplier: number;}) {
  const [color, setColor] = useState("#888888");
  const planeRef = useRef<RapierRigidBody>(null);
  const handlePlane = () => {
    if (planeRef?.current) {
      planeRef.current.applyImpulse({ x: (1-Math.random()) * 0.001 * bounceMultiplier, y: 0.11 * bounceMultiplier, z: (1-Math.random()) * 0.003 * bounceMultiplier }, true)
      // planeRef.current.applyImpulse({ x: 0.001 * bounceMultiplier, y: 0.11 * bounceMultiplier, z: 0.003 * bounceMultiplier }, true);
    }
  };
  return (
    <RigidBody name="plane" ref={planeRef} colliders="cuboid" canSleep={true} mass={10000}>
      <mesh
        position={[-0.3, 3, 9]}
        rotation={[0, 0, (Math.PI / 180) * 80]}
        onClick={() => {
          setColor(color === "orange" ? "hotpink" : "orange");
          handlePlane();
        }}
      >
        <boxGeometry args={[0.1, 25, 7]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}
export default Plane;
