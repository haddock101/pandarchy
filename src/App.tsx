// import * as THREE from "three";
import React, { useRef, /* createContext, useContext */ } from "react";
import { RigidBody, useRopeJoint, RapierRigidBody } from "@react-three/rapier";
// import { DragControls } from "@react-three/drei";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  // ContactShadows, useGLTF, Billboard, DragControls, BakeShadows,
  Stats,
  RandomizedLight,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Leva, useControls } from "leva";
// import Band from "./components/LineJoint";
// import Beam from "./components/Beam.tsx";
import Sphere from "./components/Sphere.tsx";
import {
  Barrel,
  Cannonball,
  Dock,
  PirateFlag,
  Tower,
  CastleDoor,
  CastleGate,
  CastleWall,
  CastleWindow,
  PalmBent,
  PalmStraight,
  PalmStraightAlt,
  PatchSandFoliage,
  PatchGrassFoliage,
  PatchSand,
 //  PatchGrass,
} from "./components/ModelLibrary";
import {
  BouncingBall,
  BouncingBallTwin,
  BouncingBallTriplet,
} from "./components/BouncingBalls";
import { Wall, FrontWall, BackWall, SideWall } from "./components/Wall";
import Box from "./components/Box";
// import Anchor from "./components/Anchor";
import SpringBoard from "./components/SpringBoard";
import Plane from "./components/Plane";
import Mound from "./components/Mound.tsx";
import Floor from "./components/Floor";
import InvisibleContainer from "./components/InvisibleContainer";

/* @ts-expect-error: Unknown */
const RopeJointConnection = ({ bodyA, bodyB, anchorA, anchorB, length }) => {
  useRopeJoint(bodyA, bodyB, [anchorA, anchorB, length]);
  return null;
};

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
      value: 1,
      min: 0.0001,
      max: 10,
      step: 0.0001,
    },
    debugState: false,
    sphereColor: "hotpink",
    moundColor: "#8da8bc",
    reset: false,
  });

  const cannonballPositions = [
    [1, 15, -4],
    [2, 16, -4],
    [3, 17, -4],
    [4, 18, -4],
    /* [5, 19, -4],
    [6, 20, -4],
    [7, 21, -4],
    [8, 22, -4],
    [1, 15, -4],
    [2, 16, -4],
    [3, 17, -4],
    [4, 18, -4],
    [5, 19, -4],
    [6, 20, -4],
    [7, 21, -4],
    [8, 22, -4],
    [1, 15, -4],
    [2, 16, -4],
    [3, 17, -4],
    [4, 18, -4],
    [5, 19, -4],
    [6, 20, -4],
    [7, 21, -4],
    [8, 22, -4],
    [1, 15, -4],
    [2, 16, -4],
    [3, 17, -4],
    [4, 18, -4],
    [5, 19, -4],
    [6, 20, -4],
    [7, 21, -4],
    [8, 22, -4],
    [1, 15, -4],
    [2, 16, -4],
    [3, 17, -4],
    [4, 18, -4],
    [5, 19, -4],
    [6, 20, -4],
    [7, 21, -4],
    [8, 22, -4], */
  ];

  const barrelPositions = [
    [1, 1.5, -5],
    [2, 1.6, -5],
    [3, 1.7, -5],
    /*  [4, 1.8, -5],
    [5, 1.9, -5],
    [6, 2.0, -5],
    [7, 2.1, -5],
    [8, 2.2, -5],
    [10, 2.3, -5],
    [11, 2.4, -5],
    [13, 28, -5],
    [1, 5, -2],
    [2, 6, -2],
    [3, 7, -2],
    [4, 8, -2],
    [5, 9, -2],
    [6, 10, -2],
    [7, 11, -2],
    [8, 12, -2],
    [10, 13, -2],
    [11, 14, -2],
    [13, 28, -2],
    [7, 20, -3],
    [1, 15, 7],
    [-3, 18, 7],
    [3, 18, 7],
    [4, 10, 7],
    [5, 15, 7],
    [10, 18, 7],
    [11, 18, 7],
    [12, 10, 7],
    [10, 15, 2],
    [11, 18, -9],
    [13, 18, -4],
    [1, 5, -2],
    [2, 6, -2],
    [3, 7, -2],
    [4, 8, -2],
    [5, 9, -2],
    [6, 10, -2],
    [7, 11, -2],
    [8, 12, -2],
    [10, 13, -2],
    [11, 14, -2],
    [13, 18, -2],
    [7, 10, -3],
    [1, 15, 7],
    [-3, 18, 7],
    [3, 18, 7],
    [4, 10, 7],
    [5, 15, 7],
    [10, 18, 7],
    [11, 18, 7],
    [12, 10, 7],
    [10, 15, 2],
    [11, 18, -9],
    [13, 18, -4],
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
  // console.log(barrelPositions.length + cannonballPositions.length);

  const totalSegments = 10;
  const segmentRefs = useRef(
    [...Array(totalSegments)].map(() => React.createRef()),
  );

  const ref = useRef<RapierRigidBody>(null!);

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
        fill // default = false, true makes the pane fill the parent dom node it's rendered in
        flat // default = false, true removes border radius and shadow
        oneLineLabels // default = false, alternative layout for labels, with labels and fields on separate rows
        // hideTitleBar  default = false, hides the GUI header
        collapsed // default = false, when true the GUI is collapsed
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
        <Suspense fallback={null}>
          <RandomizedLight
            castShadow
            amount={3}
            frames={100}
            position={[-14, 45, 5]}
          />
          <RandomizedLight
            castShadow
            amount={2}
            frames={100}
            position={[10, 30, 10]}
          />
          <hemisphereLight intensity={0.5} color="white" groundColor="black" />
          <Environment
            files="/hdr/evening_road_01_2k.hdr"
            ground={{ height: 5, radius: 100, scale: 50 }}
          />
          {/* Wrap all interactive 3D physical entities inside the Physics context */}
          <Physics
            gravity={[0, -9.81, 0]}
            debug={controls.debugState} /* interpolate timeStep={1 / 60} */
          >
            {/* <group position={[0, 3, 4]} >
              <Band />
            </group> */}

            <group position={[3, 0, -3]}>
              <RigidBody
                name="anchorbeam"
                /* @ts-expect-error: Unknown */
                ref={segmentRefs.current[0]}
                type="fixed"
                position={[0, 8, 0]}
              >
                <mesh>
                  <boxGeometry args={[0.8, 0.8, 0.8]} />
                  <meshStandardMaterial color="#8da8bc" />
                </mesh>
              </RigidBody>
              {/* Dynamic Rope Segments */}
              {[...Array(totalSegments - 1)].map((_, index) => {
                const currentIdx = index + 1;
                // Space segments downward vertically
                const position = [0, 8 - currentIdx * 0.65, 0];

                return (
                  <RigidBody
                    key={currentIdx}
                    /* @ts-expect-error: Unknown */
                    ref={segmentRefs.current[currentIdx]}
                    /* @ts-expect-error: Unknown */
                    position={position}
                    linearDamping={0.1}
                    angularDamping={0.1}
                  >
                    <mesh
                      onClick={(e) => {
                        console.log(e);
                        console.log(ref);
                        if (ref.current) {
                          console.log("is");
                          ref.current.applyImpulse(
                            {
                              x: 0.5 - Math.random() * 1,
                              y: 0.5 - Math.random() * 1,
                              z: 0.5 - Math.random() * 1,
                            },
                            true,
                          );
                        }
                      }}
                    >
                      <capsuleGeometry args={[0.05, 0.65, 4, 8]} />
                      <meshStandardMaterial color="#8da8bc" />
                    </mesh>
                  </RigidBody>
                );
              })}

              {/* Instantiating the Joints between successive segment pairs */}
              {[...Array(totalSegments - 1)].map((_, index) => (
                <RopeJointConnection
                  key={index}
                  bodyA={segmentRefs.current[index]}
                  bodyB={segmentRefs.current[index + 1]}
                  anchorA={[0, -0.25, 0]} // Bottom anchor of upper segment
                  anchorB={[0, 0.3, 0]} // Top anchor of lower segment
                  length={0.22} // Maximum separating distance allowable
                />
              ))}
              <RopeJointConnection
                key={totalSegments - 1}
                bodyA={segmentRefs.current[totalSegments - 1]}
                bodyB={ref}
                anchorA={[0, -0.3, 0]} // Bottom anchor of upper segment
                anchorB={[0, 0.23, 0]} // Top anchor of lower segment
                length={0.1} // Maximum separating distance allowable
              />
              <RigidBody
                ref={ref}
                type="dynamic"
                position={[0, 0.4, 0]}
                mass={1}
              >
                {/* <DragControls ref={ref}
                    matrix={matrix}
                    autoTransform={false}
                    onDrag={(localMatrix) => matrix.copy(localMatrix)}> */}
                <mesh
                  onClick={(e) => {
                    console.log(e);
                    console.log(segmentRefs);
                    if (ref.current) {
                      console.log("is");
                      // ref.current.applyTorqueImpulse({ x: (0.5-Math.random()*1), y: (0.5-Math.random()*1), z: (0.5-Math.random()*1) }, true);
                      ref.current.applyImpulse(
                        {
                          x: 0.5 - Math.random() * 1,
                          y: 0.5 - Math.random() * 0,
                          z: 0.5 - Math.random() * 1,
                        },
                        true,
                      );
                    }
                  }}
                >
                  <sphereGeometry args={[0.25, 8, 8]} />
                  <meshStandardMaterial color="#384650" />
                </mesh>
                {/*</DragControls>*/}
              </RigidBody>
            </group>
            <group scale={[3,3,3]}>
            <InvisibleContainer
              visible={controls.showContainer}
              opacity={controls.containerOpacity}
              />
            </group>
            <group position={[0, 0, 0]}>
              <Sphere
                color={controls.sphereColor}
                amount={50}
                emissive="green"
                glow="lightgreen"
                size={0.2}
                /* @ts-expect-error: Unknown */
                position={[-0.95, 0.17, 0.95]}
              />
              <group scale={0.1}>
                <BouncingBallTwin
                  bounceMultiplier={controls.bounceMultiplier}
                />
                <BouncingBall bounceMultiplier={controls.bounceMultiplier} />
                <BouncingBallTriplet
                  bounceMultiplier={controls.bounceMultiplier}
                />
                <CastleDoor
                  name={"castleDoor"}
                  key={"castleDoor"}
                  cansleep={false}
                  visible={false}
                  position={[12.5, -0.5, 0]}
                  rotation={[0, (Math.PI / 180) * 270, 0]}
                />
                <group scale={[1.5, 1.5, 1.5]} position={[7, 0.125, 0]}>
                  <Tower
                    name={"tower1"}
                    key={"tower1"}
                    position={[-12.75, -0.5, 8.25]}
                    rotation={[0, (Math.PI / 180) * 135, 0]}
                  />
                  <Tower
                    name={"tower2"}
                    key={"tower2"}
                    position={[-12.75, -0.5, -8.25]}
                    rotation={[0, (Math.PI / 180) * 45, 0]}
                  />
                </group>
                <group scale={[1, 1.5, 1.5]} position={[0.25, 0.125, 0]}>
                  <CastleWall
                    name={"castleWall4"}
                    key={"castleWall4"}

                    position={[-12.5, -0.5, -6]}
                    rotation={[0, (Math.PI / 180) * 270, 0]}
                  />
                  <CastleWindow
                    name={"castleWindow"}
                    key={"castleWindow"}

                    position={[-12.5, -0.5, -4]}
                    rotation={[0, (Math.PI / 180) * 270, 0]}
                  />
                  <CastleWall
                    name={"castleWall6"}
                    key={"castleWall6"}

                    position={[-12.5, -0.5, -2]}
                    rotation={[0, (Math.PI / 180) * 270, 0]}
                  />
                  <CastleGate
                    name={"castleGate"}
                    key={"castleGate"}

                    position={[-12.5, -0.5, 0]}
                    rotation={[0, (Math.PI / 180) * 270, 0]}
                  />
                  <CastleWall
                    name={"castleWall0"}
                    key={"castleWall0"}

                    position={[-12.5, -0.5, 2]}
                    rotation={[0, (Math.PI / 180) * 270, 0]}
                  />
                  <CastleWindow
                    name={"castleWindow2"}
                    key={"castleWindow2"}

                    position={[-12.5, -0.5, 4]}
                    rotation={[0, (Math.PI / 180) * 270, 0]}
                  />
                  <CastleWall
                    name={"castleWall3"}
                    key={"castleWall3"}

                    position={[-12.5, -0.5, 6]}
                    rotation={[0, (Math.PI / 180) * 270, 0]}
                  />
                </group>

                <Tower
                  name={"tower"}
                  key={"tower"}
                  position={[7.75, -0.5, -7.75]}
                  rotation={[0, (Math.PI / 180) * 135, 0]}
                />
                <Dock
                  name={"dock"}
                  key={"dock"}
                  cansleep={false}
                  position={[4.65, -0.5, 1.575]}
                />
                <PirateFlag
                  name={"flag"}
                  key={"flag"}
                  position={[1.625, -0.35, 1.625]}
                />
                <group scale={[10, 2.5, 9]} position={[0, -1.6, 0]}>
                  <PatchSand
                    name={"patchsand"}
                    key={"patchsand"}
                    position={[0, 0, 0]}
                  />
                </group>
                <PatchGrassFoliage
                  name={"patchgrassfoliage"}
                  key={"patchgrassfoliage"}
                  position={[22, -0.85, -16]}
                  scale={[2.2,1.2,2.2]}
                  rotation={[0, (Math.PI / 180) * 30, 0]}
                />
                <group position={[-17, -1, 17]}>
                  <PatchSandFoliage
                    name={"patchsandfoliage"}
                    key={"patchsandfoliage"}
                    position={[-1, -0.35, -1]}
                  />
                  <PatchGrassFoliage
                    name={"patchgrassfoliage"}
                    key={"patchgrassfoliage"}
                    position={[1, -0.05, -1]}
                    scale={[1.5,1.5,1.2]}
                    rotation={[0, (Math.PI / 180) * 130, 0]}
                  />
                  <PalmBent
                    name={"palmbent"}
                    key={"palmbent"}
                    position={[0, -0.05, -2]}
                  />
                  <PalmStraight
                    name={"palmstraight"}
                    key={"palmstraight"}
                    position={[1.5, -0.05, -0.7]}
                  />
                  <PalmStraightAlt
                    name={"palmstraightalt"}
                    key={"palmstraightalt"}
                    position={[1.1, -0.05, 1.0]}
                    scale={[0.9, 0.85, 0.9]}
                    rotation={[0, (Math.PI / 180) * 30, 0]}
                  />
                </group>
                {/* Spawn Cloned Barrels */}
                {barrelPositions.map((pos, index) => (
                  <Barrel
                    name={"barrel" + index}
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
                <Plane bounceMultiplier={controls.bounceMultiplier} />
                <Box bounceMultiplier={controls.bounceMultiplier} />
                <SpringBoard />
                {/* Spawn Cloned Cannonballs */}
                {cannonballPositions.map((pos, index) => (
                  <Cannonball
                    key={"cannonball" + index}
                    name={"cannonball" + index}
                    position={pos}
                  />
                ))}
              </group>
            </group>
            <Mound color={controls.moundColor} />
          </Physics>

          <OrbitControls
            target={[0, 0, 0]}
            autoRotateSpeed={0.85}
            zoomSpeed={0.75}
            minPolarAngle={0}
            maxPolarAngle={controls.maxPolarAngle}
          />
        </Suspense>
      </Canvas>
      <Stats className="statsContainer" />
    </div>
  );
}
