// import { useState, useRef, useMemo } from "react";
import { Canvas /* useFrame , useLoader  */ } from "@react-three/fiber";
// import { SceneWithFBO } from "./components/SceneWithFBO";
/* import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js"; */
import {
  // ContactShadows, useGLTF, Billboard, DragControls, BakeShadows,
  Stats,
  RandomizedLight,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import Sphere from "./components/Sphere.tsx"

import CheckeredBox from "./components/CheckeredBox";
import { Leva, useControls } from "leva";
import { Barrel, Cannonball } from "./components/ModelLibrary";
import { BouncingBall, BouncingBallTwin, BouncingBallTriplet } from "./components/BouncingBalls";
import { Wall, FrontWall, BackWall, SideWall } from "./components/Wall";
import Box from "./components/Box";
import SpringBoard from "./components/SpringBoard";
import Plane from "./components/Plane";

function Floor() {
  return (
    <RigidBody type="fixed">
      <CheckeredBox position={[0, -0.49, 0]} />
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[25, 1, 25]} />
        <meshStandardMaterial color="chartreuse" />
      </mesh>
    </RigidBody>
  );
}

export default function App() {
  const sphereColor = useControls({
    value: "hotpink",
  });
  const cannonballPositions = [
    [1, 15, -4],
    [2, 16, -4],
    [3, 17, -4],
    [4, 18, -4],
    [5, 19, -4],
    [6, 20, -4],
    [7, 21, -4],
    [8, 22, -4],
  ];
  const barrelPositions = [
    [1,  1.5, -5],
    [2,  1.6, -5],
    [3,  1.7, -5],
    [4,  1.8, -5],
    [5,  1.9, -5],
    [6,  2.0, -5],
    [7,  2.1, -5],
    [8,  2.2, -5],
    [10, 2.3, -5],
    [11, 2.4, -5],
    [13, 28, -5],
    [1,  5, -2],
    [2,  6, -2],
    [3,  7, -2],
    [4,  8, -2],
    [5,  9, -2],
    [6,  10, -2],
    [7,  11, -2],
    [8,  12, -2],
    [10, 13, -2],
    [11, 14, -2],
    [13, 28, -2],
    [7.2, 30, 1.5],
    [1, 45, 7],
    [-3, 48, 7],
    [3, 28, 7],
    [4, 30, 7],
    [5, 45, 7],
    [10, 48, 7],
    [11, 28, 7],
    [12, 30, 7],
    [10, 45, 2],
    [11, 48, -9],
    [13, 28, -4],
   /* [7.2, 30, 1.5],
    [1, 45, 7],
    [-3, 48, 7],
    [3, 28, 7],
    [4, 30, 7],
    [5, 45, 7],
    [10, 48, 7],
    [11, 28, 7],
    [12, 30, 7],
    [10, 45, 2],
    [11, 48, -9],
    [13, 28, -4],
    [7.2, 30, 1.5],
    [1, 45, 7],
    [-3, 48, 7],
    [3, 28, 7],
    [4, 30, 7],
    [5, 45, 7],
    [10, 48, 7],
    [11, 28, 7],
    [12, 30, 7], */
  ];

  // useControls(barrelPositions);
  return (
    <div // fix for rendering bugs on mobile browsers
      style={{
        width: "100vw",
        height: "100vh",
        background: "#111",
        border: 0,
        position: "fixed",
        transform: "scale(1.005)",
        transformOrigin: "center center",
        overflow: "hidden",
      }}
    >
      <Leva
        // theme={myTheme}  you can pass a custom theme (see the styling section)
        // fill // default = false, true makes the pane fill the parent dom node it's rendered in
        // flat // default = false, true removes border radius and shadow
        // oneLineLabels // default = false, alternative layout for labels, with labels and fields on separate rows
        // hideTitleBar  default = false, hides the GUI header
        collapsed // default = false, when true the GUI is collapsed
        // hidden // default = false, when true the GUI is hidden
        // neverHide // default = false, when true the GUI stays visible even when no controls are mounted
        // hideCopyButton // default = false, hides the copy button in the title bar
        titleBar={{
          // Configure title bar options
          title: "Debug Controls", // Custom title
          drag: true, // Enable dragging
          filter: true, // Enable filter/search
          position: { x: 0, y: 0 }, // Initial position (when drag is enabled)
          // onDrag: (position) => {// console.log(position)}, // Callback when dragged
        }}
      />

      <Canvas camera={{ position: [-6.5, 8.5, 6.5], fov: 30 }}>
        <RandomizedLight castShadow amount={3} frames={100} position={[-14, 45, 5]} />
        <RandomizedLight castShadow amount={2} frames={100} position={[10, 30, 10]} />
        <hemisphereLight intensity={0.5} color="white" groundColor="black" />
        <Environment
          files="/evening_road_01_2k.hdr"
          ground={{ height: 5, radius: 100, scale: 50 }}
        />
        {/* Wrap all interactive 3D physical entities inside the Physics context */}
        <Physics gravity={[0, -9.81, 0]}>
          <group position={[0, 0, 0]}>
            <Sphere
              color={sphereColor.value}
              amount={50}
              emissive="green"
              glow="lightgreen"
              size={0.2}
              /* @ts-expect-error: Unknown */
              position={[-0.95, 0.16, 0.95]}
            />
            {   /*
            <group scale={0.5}>


              <Sphere
                color="white"
                amount={30}
                emissive="purple"
                glow="#ff90f0"
                size={0.2}
                position={[-0.5, 0.1, -1]}
              />
              <Sphere
                color="lightpink"
                amount={20}
                emissive="orange"
                glow="#ff9f50"
                size={0.25}

                position={[-1, 0.15, 1]}
              />

            </group>
             */ }
            <group scale={0.1}>
              <BouncingBallTwin />
              <BouncingBall />
              <BouncingBallTriplet />
              {/* Spawn Cloned Physics Barrels */}
              {barrelPositions.map((pos, index) => (
                <Barrel
                  key={"barrel" + index}
                  position={pos}
                  url="/glb/barrel.glb"
                />
              ))}
              <Floor />
              <FrontWall />
              <BackWall />
              <Wall />
              <SideWall />
              <Plane />
              <Box />
              <SpringBoard />
              {cannonballPositions.map((pos, index) => (
                <Cannonball
                  key={"cannonball" + index}
                  position={pos}
                />
              ))}
              <Cannonball position={[0,20,0]} />
            </group>
          </group>
        </Physics>
        <OrbitControls
          target={[0, 0, 0]}
          autoRotateSpeed={0.85}
          zoomSpeed={0.75}
        />
      </Canvas>
      <Stats />
    </div>
  );
}
