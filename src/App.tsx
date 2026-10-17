import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Stats, OrbitControls,/* Environment */ } from "@react-three/drei";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import UtilWrapper from "./components/UtilWrapper.tsx";
import InvisibleContainer from "./components/InvisibleContainer.tsx";
import { BouncingBall, ImpulseMarker } from "./components/BouncingBalls.tsx";
import { Corner, /* Funnel, Halfpipe, Pipe90, */ Quarterpipe } from "./components/PropsNStuff.tsx";
import { Walls } from "./components/Wall.tsx";
import Floor from "./components/Floor.tsx";
// import { Model } from "./components/ModelLibrary.tsx";
import { Seesaw } from "./components/Seesaw.tsx";
import { useState, useRef, type ComponentRef } from "react";




const deg = THREE.MathUtils.degToRad;

export default function App() {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const controls = useControls({
    showContainer: false,
    containerOpacity: { value: 0.4, min: 0, max: 1, step: 0.1 },
    /* maxPolarAngle: { value: deg(89.9), min: 0, max: Math.PI, step: deg(1) }, */
    impulseMultiplier: { value: 10, min: 0.0001, max: 100, step: 0.0001 },
    debugState: false,
  });
  const [isPaused, setIsPaused] = useState(false);
  const togglePausePhysics = (value?: boolean) => {
    setIsPaused((paused) => value ?? !paused);
  }
  const toggleControls = (value?: boolean) => {
    const orbit = controlsRef.current;
    if (!orbit) return;
    orbit.enabled = value ?? !orbit.enabled;
  }
  // const [pointerDown, setPointerDown] = useState(false);
  const pointerDownHandler = () => {
    // setPointerDown(true);    
    // toggleControls(true);
  }
  const pointerUpHandler = () => {
    //  setPointerDown(false);
    // toggleControls(true);
    // togglePhysics(true);
  }
  type BouncyBallData = {
    id: string;
    position: [number, number, number];
    colors: [string, string];
  };
  const [bouncyBalls, setBouncyBalls] = useState<BouncyBallData[]>([]);

  const addBall = () => {
    const randomColor = () => `hsl(${Math.random() * 360}, 70%, 60%)`;
    const newBall: BouncyBallData = {
      id: crypto.randomUUID(),
      // Drop in from above, slightly offset so stacked balls don't spawn inside each other
      position: [(Math.random() - 0.5) * 2, 8, (Math.random() - 0.5) * 2],
      colors: [randomColor(), randomColor()],
    };
    setBouncyBalls((prev) => [...prev, newBall]);
  };

  return (
    <UtilWrapper>
      <div className="buttonContainer">
        <button
          onClick={addBall}
        >Add ball</button>
        <button
          onClick={() => setBouncyBalls([])}

        >Reset</button>
        <button
          onClick={() => setIsPaused(!isPaused)}

        >{isPaused ? "Resume" : "Pause"}</button>
      </div>
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
        onPointerDown={pointerDownHandler}
        onPointerUp={pointerUpHandler}
        shadows="percentage"
        camera={{ position: [14.5, 13.5, -14.5], fov: 30 }}
      >
        <directionalLight castShadow position={[10, 30, 10]} />
        <hemisphereLight intensity={1} color="white" groundColor="black" />
        {/*   <Environment
          files="/hdr/evening_road_01_2k.hdr"
          ground={{ height: 5, radius: 200, scale: 100 }}
        />
       Wrap all interactive 3D physical entities inside the Physics context */}
        <Physics gravity={[0, -9.81, 0]} debug={controls.debugState} paused={isPaused}>
          {/* Render the array of dynamic boxes */}
          {bouncyBalls.map((b) => (
            <BouncingBall
              name={b.id}
              position={b.position}
              impulseMultiplier={controls.impulseMultiplier}
              impulseDivisor={1}
              radius={0.5}
              density={1}
              restitution={0.1}
              friction={0}
              colors={b.colors}
              canSleep={false}
              togglePhysics={togglePausePhysics}
              toggleControls={toggleControls}

              key={b.id} />
          ))}
          {/*
            <group scale={0.5}>
              <BouncingBall
              name="pingball"
              position={[-6, 16.85, -7]}
              impulseMultiplier={controls.impulseMultiplier}
              radius={0.5}
              mass={1000000000}
              restitution={0.9}
              friction={0}
              
              initialColor="orange"
              colors={["orange", "hotpink"]}
              canSleep={false}
              togglePhysics={togglePausePhysics}
              toggleControls={toggleControls}
            /> 
            <BouncingBall
              name="orangeball"
              position={[-9, 6.93, 9]}
              impulseMultiplier={controls.impulseMultiplier}
              radius={0.5}
              mass={1000000}
              restitution={0.1}
              friction={0}
              
              initialColor="purple"
              colors={["orange", "hotpink"]}
              canSleep={false}
              togglePhysics={togglePausePhysics}
              toggleControls={toggleControls}
            /> 
            </group>
            */}

          <BouncingBall
            name="greenball"
            position={[0, 6.85, -1.5]}
            impulseMultiplier={controls.impulseMultiplier}
            impulseDivisor={20}
            radius={0.5}
            density={0.1}
            restitution={0.0}
            friction={13.5}
            colors={["green", "chartreuse"]}
            togglePhysics={togglePausePhysics}
            toggleControls={toggleControls}
          />

          <BouncingBall
            name="skyball"
            position={[-1.5, 3.5, 0]}
            impulseMultiplier={controls.impulseMultiplier}
            impulseDivisor={0.1}
            radius={0.5}
            density={111}
            restitution={1.8}
            friction={0.00000}
            initialColor="skyblue"
            colors={["skyblue", "orange"]}
            togglePhysics={togglePausePhysics}
            toggleControls={toggleControls}
          />

          <group>
            <Seesaw
              position={[0, 0, 0]}
              impulseMultiplier={controls.impulseMultiplier}
              toggleControls={toggleControls}
            />
            {/*   <Model type="dynamic" name="dock" position={[-7.5, 0.5, -3.5]} /> 
            <Seesaw position={[0, 0, 0]} /> */}
            <group name="pipeGroup">
              <Corner position={[4.25, 2 - 0.075, 4.25]} radius={2} rotation={[deg(-180), deg(180), 0]} />
              <Corner position={[4.25, 2 - 0.075, -4.25]} radius={2} rotation={[deg(180), deg(90), 0]} />
              <Corner position={[-4.25, 2 - 0.075, -4.25]} radius={2} rotation={[deg(0), deg(-180), deg(-180)]} />
              <Corner position={[-4.25, 2 - 0.075, 4.25]} radius={2} rotation={[deg(-180), deg(270), 0]} />
              <Quarterpipe position={[4.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(90), deg(-90)]} />
              <Quarterpipe position={[0, 2 - 0.075, -4.25]} radius={2} length={8.5} rotation={[0, deg(180), deg(-90)]} />
              <Quarterpipe position={[0, 2 - 0.075, 4.25]} radius={2} length={8.5} rotation={[0, deg(0), deg(-90)]} />
              <Quarterpipe position={[-4.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(-90), deg(-90)]} />
              {/* Halfpipe section 
            <Halfpipe radius={1} length={3} rotation={[0, 0, deg(270)]} />
            <Pipe90
              radius={3}
              rotation={[deg(270), 0, deg(90)]}
              position={[-1.5, 0.922, 3]}
            />
            <Pipe90
              radius={3}
              rotation={[deg(270), 0, 0]}
              position={[1.5, 0.922, 3]}
            />
            <Pipe90
              radius={2}
              rotation={[deg(270), 0, deg(270)]}
              position={[2.5, 0.922, 3]}
            />
            <Pipe90
              radius={1}
              thetaLength={Math.PI * 2}
              rotation={[0, deg(90), deg(180)]}
              position={[-4.5, 1.922, 3]}
            />
            <Funnel radius={1} position={[-4.5, 2.422, 4]} />
            */}
            </group>
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
          makeDefault
          ref={controlsRef}
          target={[0, 0, 0]}
        //autoRotateSpeed={0.85}
        // zoomSpeed={0.75}
        // minPolarAngle={0}
        // maxPolarAngle={controls.maxPolarAngle}
        />
      </Canvas>
      <Stats className="statsContainer" />
    </UtilWrapper>
  );
}
