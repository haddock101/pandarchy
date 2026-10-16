import { useState, useRef, useEffect } from "react";
import {
  useFrame,
  useThree,
  type Vector3 /*, useLoader  */,
} from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export function BouncingBall({
  bounceMultiplier,
  position,
}: {
  bounceMultiplier: number;
  position: Vector3;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered]);

  const [ballColor, setColor] = useState("purple");
  const ballRef = useRef<RapierRigidBody>(null!);
  const { camera } = useThree();
  const forward = new THREE.Vector3();
  /* @ts-expect-error: Unknown */
  const showTargetPoint = (e) => {
    camera.getWorldDirection(forward);
  };
  /* @ts-expect-error: Unknown */
  const hideTargetPoint = (e) => {
    // console.log(e);
  };
  /* @ts-expect-error: Unknown */
  const handleJump = (e) => {
    if (ballRef.current) {
      camera.getWorldDirection(forward);
      const impulseStrength = (1 * bounceMultiplier) / 10;
      forward.multiplyScalar(impulseStrength);
      ballRef.current.applyImpulseAtPoint(forward, e.point, true);
    }
  };
  const props = useTexture({
    // map: '/textures/sphereMap.jpg',
    bumpMap: "/textures/sphereMap.jpg",
    // displacementMap: '/textures/sphereMap.jpg',
    // normalMap: '/textures/stripe.jpg',
    roughnessMap: "/textures/sphereMap.jpg",

    aoMap: "/textures/stripe.jpg",
  });
  return (
    <RigidBody
      name="orangeball"
      ref={ballRef}
      colliders="ball"
      restitution={0.1} // High elasticity makes it bounce
      friction={0}
      mass={1000000}
      position={position} // [-10, 15, 7]
      canSleep={false}
    >
      <mesh
        castShadow
        onClick={(e) => {
          setColor(ballColor === "orange" ? "hotpink" : "orange");
          handleJump(e);
        }}
        onPointerOver={(e) => {
          setHovered(true);
          showTargetPoint(e);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          hideTargetPoint(e);
        }}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={ballColor} {...props} />
      </mesh>
    </RigidBody>
  );
}

export const BouncingBallTwin = ({
  bounceMultiplier,
  position,
}: {
  bounceMultiplier: number;
  position: Vector3;
}) => {
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered]);

  const { camera } = useThree();
  const forward = new THREE.Vector3();
  const ballRef = useRef<RapierRigidBody>(null);
  /* @ts-expect-error: Unknown */
  const showTargetPoint = (e) => {};
  /* @ts-expect-error: Unknown */
  const hideTargetPoint = (e) => {};
  /* @ts-expect-error: Unknown */
  const handleJump = (e) => {
    if (ballRef.current) {
      camera.getWorldDirection(forward);
      const impulseStrength = (1 * bounceMultiplier) / 3;
      forward.multiplyScalar(impulseStrength);
      ballRef.current.applyImpulseAtPoint(forward, e.point, true);
    }
  };
  const [active, setActive] = useState(false);
  const [color, setColor] = useState("green");
  const props = useTexture({
    // map: '/textures/sphereMap.jpg',
    bumpMap: "/textures/sphereMap.jpg",
    // displacementMap: '/textures/sphereMap.jpg',
    // normalMap: '/textures/stripe.jpg',
    roughnessMap: "/textures/sphereMap.jpg",
    aoMap: "/textures/stripe.jpg",
  });
  useFrame(() => {
    if (active) {
      //  console.log(ballRef.current);
    }
  });
  return (
    <RigidBody
      name="greenball"
      ref={ballRef}
      colliders="ball"
      restitution={0.1} // High elasticity makes it bounce
      friction={1.5}
      mass={100}
      position={position /* [-10, 5, 7] */}
    >
      <mesh
        castShadow
        onClick={(e) => {
          setActive(!active);
          setColor(color === "green" ? "hotpink" : "green");
          handleJump(e);
        }}
        onPointerOver={(e) => {
          setHovered(true);
          showTargetPoint(e);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          hideTargetPoint(e);
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} {...props} />
      </mesh>
    </RigidBody>
  );
};

export function BouncingBallTriplet({
  bounceMultiplier,
  position,
}: {
  bounceMultiplier: number;
  position: Vector3;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered]);
  const { camera } = useThree();
  const forward = new THREE.Vector3();
  const ballRef = useRef<RapierRigidBody>(null!);
  /* @ts-expect-error: Unknown */
  const showTargetPoint = (e) => {
    console.log(e);
  };
  /* @ts-expect-error: Unknown */
  const hideTargetPoint = (e) => {
    console.log(e);
  };
  /* @ts-expect-error: Unknown */
  const handleJump = (e) => {
    if (ballRef.current) {
      camera.getWorldDirection(forward);
      const impulseStrength = (1 * bounceMultiplier) / 2;
      forward.multiplyScalar(impulseStrength);
      ballRef.current.applyImpulseAtPoint(forward, e.point, true);
    }
  };
  const [ballColor, setColor] = useState("skyblue");

  const props = useTexture({
    // map: '/textures/sphereMap.jpg',
    bumpMap: "/textures/sphereMap.jpg",
    // displacementMap: '/textures/sphereMap.jpg',
    // normalMap: '/textures/stripe.jpg',
    roughnessMap: "/textures/sphereMap.jpg",

    aoMap: "/textures/stripe.jpg",
  });
  return (
    <RigidBody
      name="skyball"
      ref={ballRef}
      colliders="ball"
      restitution={0.8} // High elasticity makes it bounce
      friction={0.5}
      mass={100}
      position={position} // [-1, 5, 8]
    >
      <mesh
        castShadow
        onPointerOver={(e) => {
          setHovered(true);
          showTargetPoint(e);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          hideTargetPoint(e);
        }}
        onClick={(e) => {
          setColor(ballColor === "skyblue" ? "orange" : "skyblue");
          handleJump(e);
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={ballColor} {...props} />
      </mesh>
    </RigidBody>
  );
}
export function ImpulseMarker() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const targetDirection = new THREE.Vector3(0, 0, -1);

  const { camera } = useThree();
  const forward = new THREE.Vector3();

  useFrame(() => {
    if (meshRef.current) {
      // 1. Create a dummy target position by adding the direction to the current position
      const currentPos = meshRef.current.position;
      const targetPos = new THREE.Vector3().addVectors(currentPos, targetDirection)
      camera.getWorldDirection(forward);
      // console.log(targetPos,forward);
      meshRef.current.lookAt(forward);
//      console.log({ x: forward.x, y: forward.y, z: forward.z });
        // 2. Create a temporary matrix and make it "look at" the target position
      //  const m1 = new THREE.Matrix4()
        //  m1.lookAt(targetPos, currentPos, meshRef.current.up)

        // 3. Apply the rotation to the object as a Quaternion (or Euler)

      //  meshRef.current.quaternion.setFromRotationMatrix(m1)
      }
    })

  const handleMarker = () => {
    if (meshRef?.current) {
      console.log(meshRef.current);
      console.log(meshRef.current.position);
      camera.getWorldDirection(forward);
      console.log(forward);
      console.log(meshRef.current.quaternion);
      // meshRef.current.lookAt(forward);
      // markerRef.current.setRotation({ x: forward.x, y: 0, z: forward.z, w:0}, true);
      // planeRef.current.applyImpulse({ x: 0.001 * bounceMultiplier, y: 0.11 * bounceMultiplier, z: 0.003 * bounceMultiplier }, true);
    }
  };
  return (
    <>
    <mesh name="marker" ref={meshRef}
      position={[4.3, 0.4, 0.5]}
      rotation={[
        (Math.PI / 180) * 0,
        (Math.PI / 180) * 90,
        (Math.PI / 180) * 180,
      ]}
        onClick={() => {
          handleMarker();
        }}
      >
        <boxGeometry args={[1, 0.1, 4]} />
        <meshStandardMaterial color="green" />
      </mesh>
    </>
    )
}
