import { useState, useRef } from "react";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";

function Plane() {
  const [color, setColor] = useState("#888888");
  const planeRef = useRef<RapierRigidBody>(null);
  const handlePlane = () => {
    if (planeRef?.current) {
      planeRef.current.applyImpulse({ x: 0.001, y: 0.11, z: 0.003 }, true);
    }
  };
  return (
    <RigidBody name="plane" ref={planeRef} colliders="cuboid" canSleep={true} mass={10000}>
      <mesh
        position={[-0.3, 2, 10]}
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
