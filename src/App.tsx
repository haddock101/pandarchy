import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { RapierRigidBody, Physics } from "@react-three/rapier";
import { Stats, OrbitControls, Environment } from "@react-three/drei";
import { Leva, useControls } from "leva";
import UtilWrapper from "./components/UtilWrapper.tsx";
import InvisibleContainer from "./components/InvisibleContainer.tsx";
import {
  BouncingBall,
  BouncingBallTwin,
  BouncingBallTriplet,
  ImpulseMarker
} from "./components/BouncingBalls.tsx";
import {
  Funnel,
  Halfpipe,
  Pipe90,
  Pipe90Medium,
  Pipe90Tight,
} from "./components/PropsNStuff.tsx";
import { Wall, FrontWallAlt, BackWall, SideWall } from "./components/Wall.tsx";
import Floor from "./components/Floor.tsx";

export default function App() {
  const controls = useControls({
    showContainer: false,
    containerOpacity: {
      value: 0.4,
      min: 0,
      max: 1,
      step: 0.1,
    },
    maxPolarAngle: {
      value: (Math.PI / 180) * 89.9,
      min: 0,
      max: Math.PI,
      step: Math.PI / 180,
    },
    bounceMultiplier: {
      value: 10,
      min: 0.0001,
      max: 100,
      step: 0.0001,
    },
    debugState: false,
    sphereColor: "#eb087a",
    moundColor: "#8da8bc",
    reset: false,
  });

  const hpRef = useRef<RapierRigidBody>(null!);
  const pipe90Ref = useRef<RapierRigidBody>(null!);
  const pipe90Ref2 = useRef<RapierRigidBody>(null!);
  const pipe90Medium = useRef<RapierRigidBody>(null!);
  const pipe90Tight = useRef<RapierRigidBody>(null!);

  return (
    <UtilWrapper>
      <Leva
        fill
        flat
        oneLineLabels
        collapsed
        titleBar={{
          title: "Debug Controls",
          drag: true,
          filter: true,
          position: { x: 0, y: 0 },
          // onDrag: (position) => {// console.log(position)}, // Callback when dragged
        }}
      />
      <Canvas shadows camera={{ position: [14.5, 13.5, -14.5], fov: 30 }}>
        <directionalLight
          castShadow
          /* @ts-expect-error: Unknown */
          frames={40}
          temporal
          scale={15}
          opacity={2}
          position={[-14, 45, 5]}
        />

        <directionalLight
          castShadow
          /* @ts-expect-error: Unknown */
          frames={40}
          temporal
          scale={15}
          opacity={2}
          position={[10, 30, 10]}
        />
        <hemisphereLight intensity={1} color="white" groundColor="black" />
        <Environment
          files="/hdr/evening_road_01_2k.hdr"
          ground={{ height: 5, radius: 100, scale: 50 }}
        />
        {/* Wrap all interactive 3D physical entities inside the Physics context */}
        <Physics gravity={[0, -9.81, 0]} debug={controls.debugState}>

          <group scale={[0.5, 0.5, 0.5]}>
            <BouncingBall
              bounceMultiplier={controls.bounceMultiplier}
              position={[-9, 6.93, 9]}
            />
            <BouncingBallTwin
              bounceMultiplier={controls.bounceMultiplier}
              position={[1, 5, 1]}
            />
            <BouncingBallTriplet
              bounceMultiplier={controls.bounceMultiplier}
              position={[-1, 5, -1]}
            />

          </group>
          <group>
            <Halfpipe
              ref={hpRef}
              radius={1}
              length={3}
              rotation={[0, (Math.PI / 180) * 0, (Math.PI / 180) * 270]}
            />
            <Pipe90
              ref={pipe90Ref}
              rotation={[
                (Math.PI / 180) * 270,
                (Math.PI / 180) * 0,
                (Math.PI / 180) * 90,
              ]}
              position={[-1.5, 0.93, 3]}
            />
            <Pipe90
              ref={pipe90Ref2}
              rotation={[
                (Math.PI / 180) * 270,
                (Math.PI / 180) * 0,
                (Math.PI / 180) * 0,
              ]}
              position={[1.5, 0.93, 3]}
            />
            <Pipe90Medium
              ref={pipe90Medium}
              rotation={[
                (Math.PI / 180) * 270,
                (Math.PI / 180) * 0,
                (Math.PI / 180) * 270,
              ]}
              position={[2.5, 0.93, 3]}
            />
            <Pipe90Tight
              ref={pipe90Tight}
              rotation={[
                (Math.PI / 180) * 0,
                (Math.PI / 180) * 90,
                (Math.PI / 180) * 180,
              ]}
              position={[-4.5, 1.93, 3]}
            />
            <Funnel radius={1} position={[-4.5, 2.43, 4]} />
          </group>
          <group position={[0, 0, 0]} scale={[0.5, 0.2, 0.5]}>
            <Floor />
            <FrontWallAlt />
            <BackWall />
            <Wall />
            <SideWall />
          </group>
          <group position={[0, -0.001, 0]} scale={[2.5, 2.5, 2.5]}>
            <InvisibleContainer
              visible={controls.showContainer}
              opacity={controls.containerOpacity}
            />
          </group>
          <ImpulseMarker />
        </Physics>

        <OrbitControls
          target={[0, 0, 0]}
          autoRotateSpeed={0.85}
          zoomSpeed={0.75}
          minPolarAngle={0}
          maxPolarAngle={controls.maxPolarAngle}
        />
      </Canvas>
      <Stats className="statsContainer" />
    </UtilWrapper>
  );
}
