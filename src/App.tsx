import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Stats, OrbitControls, Preload, Environment, ContactShadows /*, Billboard,   Sky  */ } from "@react-three/drei";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useState, useRef, type ComponentRef } from "react";
// import { LayerMaterial, Color as Base, Depth, Noise as LaminaNoise } from 'lamina';
// import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import UtilWrapper from "./components/UtilWrapper.tsx";
import InvisibleContainer from "./components/InvisibleContainer.tsx";
import { BouncingBall, ImpulseMarker, type BallSpawn } from "./components/BouncingBalls.tsx";
import { AttractorField } from "./components/AttractorField.tsx";
import { DebugPanel } from "./components/DebugPanel.tsx";
// import { PortraitFov } from "./components/PortraitFov.tsx";
import { KeyboardControls, holdControl } from "./components/KeyboardControls.tsx";
import { SelectedBallAura } from "./components/SelectedBallAura.tsx";
import { Funnel, Halfpipe, Pipe90, ParametricPipe, Corner, Quarterpipe } from "./components/PropsNStuff.tsx";
import { Walls } from "./components/Walls.tsx";
import { useFrame } from '@react-three/fiber';
// import { easing } from 'maath';
// import Floor from "./components/Floor.tsx";
import { Catapult } from "./components/Catapult.tsx";
import { FLOOR_Y, lowCupWorld } from "./components/catapultLayout.ts";
import { generateSeededKey } from "./components/playfulRandomId.ts";
import { restored, saveSettings } from "./persistedSettings.ts";
import { ATTRACTOR, BALL, CATAPULT, CHUTE, SCENE, SETTINGS_DEFAULTS, WORLD_GRAVITY, GLOBAL_SCALE_OFFSET } from "./config.ts";
import { Model } from "./components/ModelLibrary.tsx";
import Flippers from "./components/Flippers.tsx";

import { matrix4 } from "./components/Matrix4Plugin.tsx";

const deg = THREE.MathUtils.degToRad;

// These values are derived from the catapult's low cup position and are used for placing the attractor and field.
const [CUP_X_AT_REST, CUP_Y_AT_REST, CUP_Z_AT_REST] = lowCupWorld(CATAPULT.position, CATAPULT.yaw);
// The Attractor lives in the catapult, in whichever cup holds the ball; at rest that's the low cup,
// just above the bowl's sphere centre. Its position here only sizes the floor rings.r
const ATTRACTOR_POSITION: [number, number, number] = [CUP_X_AT_REST, CUP_Y_AT_REST + 0.2, CUP_Z_AT_REST];
// The field visual lies on the floor under the cup, as wide as the attraction reaches at floor level.
const FIELD_POSITION: [number, number, number] = [CUP_X_AT_REST, FLOOR_Y + 0.015, CUP_Z_AT_REST];
const FIELD_RADIUS = Math.sqrt(ATTRACTOR.range ** 2 - (ATTRACTOR_POSITION[1] - FLOOR_Y) ** 2);

// The chutes slope by config.ts's CHUTE.slope. Each part tilts about the seam where it joins the next, so
// the pipe ends stay lined up at any slope; the funnel is counter-rotated to stay exactly vertical.
const CHUTE_SLOPE = CHUTE.slope;
// Seams in the chutes group's own coordinates: where pipe904 meets pipe901 (the pipe runs along z
// there), and where halfpipe1 meets pipe902 (running along x). Rotating about an axis the pipe
// runs along moves neither its end nor its direction, so these seams stay exact.
const FUNNEL_SEAM: [number, number, number] = [-4.5, 0.922, 3];
const OUTLET_SEAM: [number, number, number] = [3.5, 0.922, 0];
// Where pipe902 meets pipe903; the tube runs along z there.
const BEND_SEAM: [number, number, number] = [5.5, 0.922, 2];
const negate = ([x, y, z]: [number, number, number]): [number, number, number] => [-x, -y, -z];

const randomColor = () => `hsl(${Math.round(Math.random() * 360)}, 70%, 60%)`;

function createSpawn(seq: number, overrides: Partial<BallSpawn> = {}): BallSpawn {
  return {
    seq,
    // Drop in from above, slightly offset so stacked balls don't spawn inside each other
    position: [
      BALL.randomDrop.x + Math.random() * BALL.randomDrop.spread,
      BALL.randomDrop.height,
      BALL.randomDrop.z + Math.random() * BALL.randomDrop.spread,
    ],
    colors: [randomColor(), randomColor()],
    ...overrides,
  };
}

/** Puts a spawn in a free slot, or recycles the ball that has been in play the longest. */
function placeSpawn(spawns: (BallSpawn | null)[], size: number, spawn: BallSpawn) {
  const next = Array.from({ length: size }, (_, i) => spawns[i] ?? null);
  let slot = next.indexOf(null);
  if (slot === -1) {
    slot = next.reduce((oldest, s, i) => (s!.seq < next[oldest]!.seq ? i : oldest), 0);
  }
  next[slot] = spawn;
  return next;
}

/** Holds its flipper up while pressed, like the flipper's keys; works with a mouse, a finger or a pen. */
function FlipperButton({ name, control, children }: { name: string; control: "leftFlipper" | "rightFlipper"; children: string }) {
  const release = () => holdControl(control, false);
  return (
    <button
      name={name}
      onPointerDown={(e) => {
        // Keeps the release coming here even if the finger slides off the button
        e.currentTarget.setPointerCapture(e.pointerId);
        holdControl(control, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      // A long press would otherwise open the context menu on touch screens
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

// Matrix4.set takes the numbers row by row, as the matrix is written
const MY_MATRIX_START = new THREE.Matrix4().set(
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  -3.581, 0, 0, 1
);

const catcherMatrixTop = new THREE.Matrix4().set(
  -3.581, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
);

/* const catcherMatrix1 = new THREE.Matrix4().set(
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
);
const catcherMatrix2 = new THREE.Matrix4().set(
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
);
*/

export default function App() {


  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  // Defaults come from localStorage when saved, and every change is saved back
  const controls = useControls({
    dampCamera: { value: restored("dampCamera", false) },
    showContainer: restored("showContainer", false),
    containerOpacity: { value: restored("containerOpacity", SETTINGS_DEFAULTS.containerOpacity), min: 0, max: 1, step: 0.1 },
    impulseMultiplier: { value: restored("impulseMultiplier", SETTINGS_DEFAULTS.impulseMultiplier), min: 0.0001, max: 100, step: 0.0001 },
    maxBalls: { value: restored("maxBalls", SETTINGS_DEFAULTS.maxBalls), min: 1, max: 50, step: 1 },
    debugState: restored("debugState", false),
    showJoints: restored("showJoints", false),
    showStats: restored("showStats", false),
    hoverInfo: restored("hoverInfo", false),
    showChute: restored("showChute", false),
    showTray: restored("showTray", false),
    showCatapult: restored("showCatapult", false),
    // cameraFov: { value: restored("cameraFov", SETTINGS_DEFAULTS.cameraFov), min: 10, max: 60, step: 1 },
    // cameraPosition: { value: restored("cameraPosition", SETTINGS_DEFAULTS.cameraPosition) },
    // targetPosition: { value: SETTINGS_DEFAULTS.targetPosition },
    // cameraLookAt: { value: SETTINGS_DEFAULTS.cameraLookAt },
    // cameraZoom: { value: SETTINGS_DEFAULTS.cameraZoom },
    // Shown in the panel as written, row by row; the value itself is Matrix4.elements (column by column)
    myMatrix: matrix4({ value: MY_MATRIX_START.elements, step: 0.0005 }),
  });

  //  const myMatrix = useMemo(() => new THREE.Matrix4().fromArray(controls.myMatrix), [controls.myMatrix]);

  const showChute = controls.showChute ?? false;
  const showTray = controls.showTray ?? false;
  const showCatapult = controls.showCatapult ?? false;
/*
  const setView1 = (e: React.MouseEvent<HTMLButtonElement>) => (e.preventDefault() , setViewPosition(1));
  const setView2 = (e: React.MouseEvent<HTMLButtonElement>) => (e.preventDefault() , setViewPosition(2));
  const setView3 = (e: React.MouseEvent<HTMLButtonElement>) => (e.preventDefault() , setViewPosition(3));

  const views = [
    [1.94, 1.3, 0],
    [1.7, 2.0, 1.3],
    [-3.4, 0, 0],
  ] as [number, number, number][];

  const setViewPosition = (viewNumber: number) => {
    // controls.targetPosition = views[viewNumber - 1];
    const targetPosition = views[viewNumber - 1];
    console.log("Setting view position to:", targetPosition); 
  };
*/
  const DampCamera = () => {
    useFrame((state, delta) => {
      // Smoothly damp camera position independent of framerate
      const maxY = 45.5;
      const minY = 0;

      // Clamp the camera's Y position between minY and maxY
      console.log(minY, maxY, state.camera.position.y, state.camera.position.x, delta);
      // controls.targetPosition[1] = Math.max(minY, Math.min(maxY, state.camera.position.y));
     // controls.dampCamera && easing.damp3(state.camera.position, controls.targetPosition, 0.25, delta);
    });
    return null;
  };
  const serializedControls = JSON.stringify(controls);
  useEffect(() => saveSettings(JSON.parse(serializedControls)), [serializedControls]);

  const [isPaused, setIsPaused] = useState(false);
  const togglePausePhysics = (value?: boolean) => {
    setIsPaused((paused) => value ?? !paused);
  };
  const toggleControls = (value?: boolean) => {
    const orbit = controlsRef.current;
    if (!orbit) return;
    orbit.enabled = value ?? !orbit.enabled;
  };

  // A fixed pool of balls stays mounted (parked and hidden), so spawning one never mounts, loads or
  // compiles anything. spawns[i] says what slot i is doing; null means parked.
  const { maxBalls } = controls;
  const [spawns, setSpawns] = useState<(BallSpawn | null)[]>([]);
  const seqRef = useRef(0);
  // Stable playful names like "buddy-zippy-otter-1x3k" make the debug collision logs readable
  const slotNames = useMemo(
    () => Array.from({ length: maxBalls }, (_, i) => generateSeededKey(i, `ball${i}`)),
    [maxBalls],
  );
  const addBall = (overrides?: Partial<BallSpawn>) => {
    const spawn = createSpawn(++seqRef.current, overrides);
    setSpawns((prev) => placeSpawn(prev, maxBalls, spawn));
  };
  // Drops a ball straight into the catapult's low cup, just above where it comes to rest
//  const loadBall = () => addBall({ position: [CUP_X_AT_REST/100, CUP_Y_AT_REST/100 + 0.1, CUP_Z_AT_REST/100], friction: BALL.loadedFriction });

  const [attractorOn, setAttractorOn] = useState(true);
  const [catapultTurning, setCatapultTurning] = useState(false);
  const attractorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onLaunch = () => {
    setAttractorOn(false);
    clearTimeout(attractorTimer.current);
    attractorTimer.current = setTimeout(() => setAttractorOn(true), ATTRACTOR.launchPauseMs);
  };
  useEffect(() => () => clearTimeout(attractorTimer.current), []);

  return (
    <UtilWrapper>
      
      {/* Various control buttons for the pinball game 
      <button onClick={loadBall}>Load</button>
      */}
      <div className="buttonContainer">
        <button className="dropBallButton" onClick={() => addBall({ ballStyle: "pinball", colors: ["white", "white"] })}>Drop Ball</button>
       
        <button onClick={() => setSpawns([])}>Reset</button>        
        <button onClick={() => togglePausePhysics()}>{isPaused ? "Resume" : "Pause"}</button>
        
      </div>
      
      <div className="pinballControls">
        <FlipperButton name="leftButton" control="leftFlipper">L</FlipperButton>
        <FlipperButton name="rightButton" control="rightFlipper">R</FlipperButton>
      </div>
      {/* Leva panel for controlling various parameters */}
      <div style={{
        display: 'block',
        position: 'absolute',
        width: '100dvw',
        zIndex: 11,
        maxHeight: '100dvh',
        overflowY: 'scroll',
      }}>
        <Leva
          // fill
          // flat
          // oneLineLabels
          collapsed
          titleBar={{
            title: "",
            drag: false,
            filter: true,
            position: { x: 0, y: 0 },
          }}
          theme={{
            fontSizes: {
              root: '8px', // Default is usually around 11px
            },
            // You can also adjust sizing if the layout feels too tight
            sizes: {
              // rootWidth: '280px',
              controlWidth: '160px',
              scrubberWidth: '8px',
              scrubberHeight: '12px',
              rowHeight: '18px',
              // folderHeight: '20px',
              checkboxSize: '16px',
              joystickWidth: '100px',
              joystickHeight: '100px',
              colorPickerWidth: '160px',
              colorPickerHeight: '100px',
              monitorHeight: '60px',
              titleBarHeight: '28px',
            },
            radii: {
              xs: '2px',
              sm: '4px',
              lg: '8px',
            },
            space: {
              sm: '6px',
              md: '10px',
              rowGap: '7px',
              colGap: '7px',
            },
          }}
        />
      </div>
      <Canvas shadows="percentage" camera={{ position: [1.94, 1.30, 0], fov: 29 }}>
        {/* DampCamera smoothly moves the camera towards the target position */}
        <DampCamera />
        {/* Widens the view on portrait phone screens so the arena isn't cropped at the sides */}
        {/* <PortraitFov fov={controls.cameraFov} minAspect={0.8} /> */}
        <directionalLight position={[10, 12, 10]}
          castShadow
          // Expand the shadow map area
          intensity={0.5}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          // Make sure it goes far enough down the light's direction
          shadow-camera-near={0.1}
          shadow-camera-far={50} />
          <directionalLight position={[1, 2, 0]}
          castShadow
          intensity={0.1}
          // Expand the shadow map area
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          // Make sure it goes far enough down the light's direction
          shadow-camera-near={0.1}
          shadow-camera-far={50} />
        <hemisphereLight intensity={0.5} color="white" groundColor="black" />
        <Environment
          files="./hdr/kloofendal_48d_partly_cloudy_puresky_4k.jpeg"
          ground={{ height: 10, radius: 100, scale: 15 }}
          environmentIntensity={1} // Scales the HDRI lighting/reflections (default is 1)
          backgroundIntensity={1}    // Separately controls the background image intensity
        />

        {/*
        <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} showSunDisk={true} azimuth={-112}  />        
        <Environment background resolution={64}>
          <mesh scale={100}>
            <sphereGeometry args={[1, 64, 64]} />
            <LayerMaterial side={THREE.BackSide}>
              <Base color="blue" alpha={1} mode="normal" />
              <Depth colorA="#00ffff" colorB="#ff8f00" alpha={0.5} mode="normal" near={0} far={300} origin={[100, 100, 100]} />
              <LaminaNoise mapping="local" type="cell" scale={0.5} mode="softlight" />
            </LayerMaterial>
          </mesh>
        </Environment> */}
        {/* Everything interactive and physical lives inside the Physics context */}
        <Physics gravity={[0, WORLD_GRAVITY, 0]} debug={controls.debugState} paused={isPaused}>
          {/* W/A/S/D (or arrows) and space steer the last clicked ball, marked with an aura */}
          <KeyboardControls />
          <SelectedBallAura />
          
          
          
          {/* Suspense keeps the rest of the scene on screen while the ball textures load */}
          <Suspense fallback={null}>
            {slotNames.map((name, i) => (
              <BouncingBall
                key={i}
                name={name}
                spawn={spawns[i] ?? null}
                impulseMultiplier={controls.impulseMultiplier}
                impulseDivisor={BALL.pushDivisor}
                radius={BALL.radius}
                density={BALL.density}
                ccd
                restitution={BALL.restitution}
                friction={spawns[i]?.friction ?? BALL.friction}
                canSleep={false}
                togglePhysics={togglePausePhysics}
                toggleControls={toggleControls}
              />
            ))}
            {/* Compile every material up front (hidden balls included) so the first spawn doesn't stutter */}
            <Preload all />
          </Suspense>
          <group scale={GLOBAL_SCALE_OFFSET}>
            <Flippers showJoints={controls.showJoints} />
          
            {showCatapult && (
              <>
                <AttractorField position={FIELD_POSITION} radius={FIELD_RADIUS} active={attractorOn && !catapultTurning} />
              <Catapult
                position={CATAPULT.position}
                yaw={CATAPULT.yaw}
                impulseMultiplier={controls.impulseMultiplier}
                toggleControls={toggleControls}
                onLaunch={onLaunch}
                attractorStrength={attractorOn ? ATTRACTOR.strength : 0}
                attractorRange={ATTRACTOR.range}
                onTurn={setCatapultTurning}
              />
              </>
            )}
  
            <group name="pipeGroup">
            <Halfpipe id="toparc" position={[-18.5, 2.5 , 0]} radius={6.25} length={2} rotation={[0, deg(180), SCENE.leftSectionSlope]} />
{showTray && (
            <>
              <Corner id="corner1" position={[6.25, 2 - 0.075, 4.25]} radius={2} rotation={[deg(-180), deg(180), 0]} />
              <Quarterpipe id="quarterpipe3" position={[6.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(90), deg(-90)]} />
              <Corner id="corner2" position={[6.25, 2 - 0.075, -4.25]} radius={2} rotation={[deg(180), deg(90), 0]} />
              <group matrix={catcherMatrixTop} matrixAutoUpdate={false}>
              </group>
              <Quarterpipe id="quarterpipe3" position={[-4.75, 2 - 0.075, 4.25]} radius={2} length={22} rotation={[0, deg(0), deg(-90)]} />
              <Quarterpipe id="quarterpipe4" position={[-4.75, 2 - 0.075, -4.25]} radius={2} length={22} rotation={[0, deg(180), deg(-90)]} />
            </>
            )}

              {/* 
            <Corner id="corner3" position={[-4.25, 2 - 0.075, -4.25]} radius={2} rotation={[deg(0), deg(-180), deg(-180)]} />
            <Corner id="corner4" position={[-4.25, 2 - 0.075, 4.25]} radius={2} rotation={[deg(-180), deg(270), 0]} />
            <Quarterpipe id="quarterpipe1" position={[4.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(90), deg(-90)]} />
            <Quarterpipe id="quarterpipe2" position={[0, 2 - 0.075, -4.25]} radius={2} length={8.5} rotation={[0, deg(180), deg(-90)]} />
            <Quarterpipe id="quarterpipe3" position={[0, 2 - 0.075, 4.25]} radius={2} length={8.5} rotation={[0, deg(0), deg(-90)]} />
            <Quarterpipe id="quarterpipe4" position={[-4.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(-90), deg(-90)]} /> */}

              {/* Funnel → pipes → halfpipe, tilted by CHUTE_SLOPE so balls roll along */}
              {showChute && (
                <group name="chutes" position={[-20, 6, -4]} rotation={[0, Math.PI / 180 * 33, -CHUTE_SLOPE]}>
                  {/* Counter-rotated about its seam with pipe901, so the funnel stays exactly vertical */}
                  <group position={FUNNEL_SEAM} rotation={[0, 0, CHUTE_SLOPE]}>
                    <group position={negate(FUNNEL_SEAM)}>
                      <Funnel id="funnel1" radius={3.5} position={[-4.5, 2.422, 4]} />
                      <Pipe90
                        id="pipe904"
                        radius={1}
                        thetaLength={Math.PI * 2}
                        rotation={[0, deg(90), deg(180)]}
                        position={[-4.5, 1.922, 3]}
                      />
                    </group>
                  </group>
                  <Pipe90 id="pipe901" radius={3} rotation={[deg(270), 0, deg(90)]} position={[-1.5, 0.922, 3]} />
                  <Halfpipe id="halfpipe1" radius={1} length={5} position={[1, 0.922, 0]} rotation={[0, 0, deg(270)]} />
                  {/* pipe902 turns the run from +x to +z; tilting about its seam with the halfpipe (where the
                  tube runs along x) makes its +z end slope downhill too */}
                  <group position={OUTLET_SEAM} rotation={[CHUTE_SLOPE, 0, 0]}>
                    <group position={negate(OUTLET_SEAM)}>
                      <Pipe90 id="pipe902" radius={2} rotation={[deg(270), 0, 0]} position={[3.5, 0.922, 2]} />
                      {/* pipe903 turns back towards -x, which the chutes' tilt alone would make uphill. Turning it
                      (and halfpipe2) about its seam with pipe902, where the tube runs along z, by twice the
                      slope makes the -x run slope downhill as well */}
                      <group position={BEND_SEAM} rotation={[0, 0, 2 * CHUTE_SLOPE]}>
                        <group position={negate(BEND_SEAM)}>
                          <Pipe90 id="pipe903" radius={2} rotation={[deg(270), 0, deg(270)]} position={[3.5, 0.922, 2]} />
                          <Halfpipe id="halfpipe2" radius={1} length={5} position={[1, 0.922, 4]} rotation={[0, 0, deg(270)]} />
                        </group>
                      </group>
                    </group>
                  </group>
                  <group rotation={[0, deg(13), deg(-23)]} position={[-10, 0.2, 2]} >
                    <Halfpipe id="halfpipe3" radius={1} length={8} position={[0, 2.45, 0]} rotation={[0, 0, deg(270)]} />
                  </group>
                </group>

              )}
            </group>
            
            <group scale={25.4}>
              <group rotation={[0, deg(90), 0 ]}>
          <Model name="slingshot" key="slingshot-left" scale={[-1, 1, 1]} position={[0,0.044,-0.24]} restitution={1}/>
          </group>
          <group rotation={[0, deg(90), 0 ]}>
          <Model name="slingshot" key="slingshot-right" position={[0,0.044,-0.24]} restitution={1}/>
          </group>
              <Model name="popBumperZone" position={[-0.43, -0.954, 0]} rotation={[0, deg(90), 0]} />
              <Model name="popBumper" key="popBumper-L" position={[-0.43, -0.953, -0.1]} rotation={[0, deg(90), 0]} />
              <Model name="popBumper" key="popBumper-C" position={[-0.33, -0.963, 0]} rotation={[0, deg(90), 0]} />
              <Model name="popBumper" key="popBumper-R" position={[-0.47, -0.955, 0.03]} rotation={[0, deg(90), 0]} />
              <Model name="shoulder" key="shoulder" position={[-0.139, 0.0375, 0]} scale={[1.0203, 1, 1.0203]} rotation={[0, deg(90), 0]} />
              </group>
            <group rotation={[0, 0, -SCENE.leftSectionSlope]}  >
              <ParametricPipe id="sideboard1" color="grey" radius={3.5} arc={Math.PI / 3.75} length={1.5} position={[-15.5, 0.5, 2.75]} rotation={[0, 0, 0]} />
              <ParametricPipe id="sideboard2" color="grey" radius={3.5} arc={Math.PI / 3.25} length={1.5} position={[-13.9, 0.5, -2.75]} rotation={[deg(180), 0, 0]} />
            </group> 
            <group scale={SCENE.floorScale}>
             {/* Floor 
               <Floor /> */}
              <Walls />
            </group>
    {controls.showContainer && (        
            <group position={[0, -0.001, 0]} scale={2.5}>
              <InvisibleContainer
                visible={controls.showContainer}
                opacity={controls.containerOpacity}
                debug={controls.debugState}
              />
            </group>
    )}
          </group>
           <ContactShadows scale={10} blur={3} opacity={0.25} far={10} /> 
          <ImpulseMarker />
        </Physics>

        <OrbitControls makeDefault ref={controlsRef} /* target={controls.cameraLookAt} */ />
        {/*   <EffectComposer>
       <DepthOfField focusDistance={1} focalLength={30.02} bokehScale={2} height={1480} />
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={0.3} />
        
        
      </EffectComposer> */}
      </Canvas>
      {controls.showStats && <Stats className="statsContainer" />}
      {controls.hoverInfo && <DebugPanel />}
    </UtilWrapper>
  );
}

/*
function Striplight(props) {
  return (
    <mesh {...props}>
      <boxGeometry />
      <meshBasicMaterial color="white" />
    </mesh>
  )
} */