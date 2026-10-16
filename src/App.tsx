import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Stats, OrbitControls, Environment } from "@react-three/drei";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import UtilWrapper from "./components/UtilWrapper.tsx";
import InvisibleContainer from "./components/InvisibleContainer.tsx";
import { BouncingBall, ImpulseMarker } from "./components/BouncingBalls.tsx";
import { Funnel, Halfpipe, Pipe90 } from "./components/PropsNStuff.tsx";
import { Walls } from "./components/Wall.tsx";
import Floor from "./components/Floor.tsx";
import { Model } from "./components/ModelLibrary.tsx";

const deg = THREE.MathUtils.degToRad;

export default function App() {
  const controls = useControls({
    showContainer: false,
    containerOpacity: { value: 0.4, min: 0, max: 1, step: 0.1 },
    maxPolarAngle: { value: deg(89.9), min: 0, max: Math.PI, step: deg(1) },
    bounceMultiplier: { value: 10, min: 0.0001, max: 100, step: 0.0001 },
    debugState: false,
  });

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
        }}
      />

      
      <Canvas
        shadows="percentage"
        camera={{ position: [14.5, 13.5, -14.5], fov: 30 }}
        onCreated={(state) => {
          state.setEvents({ filter: (intersections) => intersections.filter(i => i.object.visible) })
        }}
      >
        <directionalLight castShadow position={[-14, 45, 5]} />
        <directionalLight castShadow position={[10, 30, 10]} />
        <hemisphereLight intensity={1} color="white" groundColor="black" />
        <Environment
          files="/hdr/evening_road_01_2k.hdr"
          ground={{ height: 5, radius: 100, scale: 50 }}
        />
        {/* Wrap all interactive 3D physical entities inside the Physics context */}
        <Physics gravity={[0, -9.81, 0]} debug={controls.debugState}>
          <Model name="barrel" position={[0, 5, 0]} />
          <group scale={0.5}>
            <BouncingBall
              name="orangeball"
              position={[-9, 6.93, 9]}
              bounceMultiplier={controls.bounceMultiplier}
              radius={0.5}
              mass={1000000}
              restitution={0.1}
              friction={0}
              impulseDivisor={10}
              initialColor="purple"
              colors={["orange", "hotpink"]}
              canSleep={false}
            />
            <BouncingBall
              name="greenball"
              position={[1, 5, 1]}
              bounceMultiplier={controls.bounceMultiplier}
              radius={1}
              mass={100}
              restitution={0.1}
              friction={1.5}
              impulseDivisor={3}
              colors={["green", "hotpink"]}
            />
            <BouncingBall
              name="skyball"
              position={[-1, 5, -1]}
              bounceMultiplier={controls.bounceMultiplier}
              radius={1}
              mass={100}
              restitution={0.8}
              friction={0.5}
              impulseDivisor={2}
              colors={["skyblue", "orange"]}
            />
          </group>
          <group>
            <Halfpipe radius={1} length={3} rotation={[0, 0, deg(270)]} />
            <Pipe90
              radius={3}
              rotation={[deg(270), 0, deg(90)]}
              position={[-1.5, 0.93, 3]}
            />
            <Pipe90
              radius={3}
              rotation={[deg(270), 0, 0]}
              position={[1.5, 0.93, 3]}
            />
            <Pipe90
              radius={2}
              rotation={[deg(270), 0, deg(270)]}
              position={[2.5, 0.93, 3]}
            />
            <Pipe90
              radius={1}
              thetaLength={Math.PI * 2}
              rotation={[0, deg(90), deg(180)]}
              position={[-4.5, 1.93, 3]}
            />
            <Funnel radius={1} position={[-4.5, 2.43, 4]} />
          </group>
          <group scale={[0.5, 0.2, 0.5]}>
            <Floor />
            <Walls />
          </group>
          <group position={[0, -0.001, 0]} scale={2.5}>
            <InvisibleContainer
              visible={controls.showContainer}
              opacity={controls.containerOpacity}
              debug={controls.debugState}
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
