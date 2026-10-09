import { useState, useRef } from "react";
import { useFrame /*, useLoader  */ } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";

// A bouncing ball that responds to user clicks by jumping
export function BouncingBall({ bounceMultiplier }: {bounceMultiplier: number;}) {
  const [color, setColor] = useState("orange");
  const ballRef = useRef<RapierRigidBody>(null);
  const handleJump = () => {
      // Apply an upward impulse on the y-axis
    if (ballRef.current) {
      ballRef.current.applyImpulse({ x: (1-Math.random()) * 0.01 * bounceMultiplier, y: 0.02 * bounceMultiplier, z: (1-Math.random()) * 0.01 * bounceMultiplier }, true)
    }
  }
  return (
    <RigidBody
      name="orangeball"
      ref={ballRef}
      colliders="ball"
      restitution={0.8} // High elasticity makes it bounce
      position={[-10, 15, 7]}
      canSleep={false}
    >
      <mesh onClick={() => {
        setColor(color === "orange" ? "hotpink" : "orange")
        handleJump()
      }}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}


export const BouncingBallTwin = ({ bounceMultiplier }: {bounceMultiplier: number;}) => {
  const ballRef = useRef<RapierRigidBody>(null);
  const handleJump = () => {
      // Apply an upward impulse on the y-axis
    if (ballRef.current) {
      ballRef.current.applyImpulse({ x: (1-Math.random()) * 0.0001 * bounceMultiplier, y: 0.02 * bounceMultiplier, z: (1-Math.random()) * 0.0001 * bounceMultiplier }, true)
    }
  }
  const [active, setActive] = useState(false);
  const [color, setColor] = useState("green");

  useFrame(() => {
    if (active) {
      //  console.log(ballRef.current);
    }
  });
  return (
    <RigidBody
      name="greenball"
      ref={ballRef} colliders="ball"
      restitution={1.9} // High elasticity makes it bounce
      position={[-10, 5, 7]}
    >
      <mesh
        castShadow
        onClick={() => {
          setActive(!active);
          setColor(color === "green" ? "hotpink" : "green");
          handleJump();
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
};

export function BouncingBallTriplet({ bounceMultiplier }: {bounceMultiplier: number;}) {
  const ballRef = useRef<RapierRigidBody>(null);
  const handleJump = () => {
      // Apply an upward impulse on the y-axis
    if (ballRef.current) {
      ballRef.current.applyImpulse({ x: (1-Math.random()) * 0.001 * bounceMultiplier, y: 0.04 * bounceMultiplier, z: (1-Math.random()) * 0.0001 * bounceMultiplier }, true)
    }
  }
  const [ballColor, setColor] = useState("skyblue");
  return (
    <RigidBody
      name="skyball"
      ref={ballRef}
      colliders="ball"
      restitution={0.8} // High elasticity makes it bounce
      position={[-1, 5, 8]}
    >
      <mesh
        onClick={() => {
          setColor(ballColor === "skyblue" ? "orange" : "skyblue")
          handleJump()
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={ballColor} />
      </mesh>
    </RigidBody>
  );
}
