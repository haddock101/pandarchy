import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";


import { Stats, OrbitControls, Preload } from "@react-three/drei";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useState, useRef, type ComponentRef } from "react";
import UtilWrapper from "./components/UtilWrapper.tsx";
import InvisibleContainer from "./components/InvisibleContainer.tsx";
import { BouncingBall, ImpulseMarker, type BallSpawn } from "./components/BouncingBalls.tsx";
import { AttractorField } from "./components/AttractorField.tsx";
import { DebugPanel } from "./components/DebugPanel.tsx";
import { PortraitFov } from "./components/PortraitFov.tsx";
import { KeyboardControls } from "./components/KeyboardControls.tsx";
import { SelectedBallAura } from "./components/SelectedBallAura.tsx";
import { Funnel, Halfpipe, Pipe90, /* Corner, Quarterpipe */ } from "./components/PropsNStuff.tsx";
import { Walls } from "./components/Wall.tsx";
import Floor from "./components/Floor.tsx";
import { Catapult } from "./components/Catapult.tsx";
import { FLOOR_Y, lowCupWorld } from "./components/catapultLayout.ts";
import { generateSeededKey } from "./components/playfulRandomId.ts";
import { restored, saveSettings } from "./persistedSettings.ts";
import { ATTRACTOR, BALL, CATAPULT, CHUTE, SETTINGS_DEFAULTS } from "./config.ts";

const deg = THREE.MathUtils.degToRad;

// The catapult (placed by config.ts's CATAPULT.position and .yaw) rests with its low cup on the floor,
// ready to launch; the raised cup sits under the end of halfpipe2, so a ball coming down the chute lands in it.
const [CUP_X_AT_REST, CUP_Y_AT_REST, CUP_Z_AT_REST] = lowCupWorld(CATAPULT.position, CATAPULT.yaw);
// The Attractor lives in the catapult, in whichever cup holds the ball; at rest that's the low cup,
// just above the bowl's sphere centre. Its position here only sizes the floor rings.
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

export default function App() {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  // Defaults come from localStorage when saved, and every change is saved back
  const controls = useControls({
    showContainer: restored("showContainer", false),
    containerOpacity: { value: restored("containerOpacity", SETTINGS_DEFAULTS.containerOpacity), min: 0, max: 1, step: 0.1 },
    impulseMultiplier: { value: restored("impulseMultiplier", SETTINGS_DEFAULTS.impulseMultiplier), min: 0.0001, max: 100, step: 0.0001 },
    maxBalls: { value: restored("maxBalls", SETTINGS_DEFAULTS.maxBalls), min: 1, max: 50, step: 1 },
    debugState: restored("debugState", false),
    showStats: restored("showStats", false),
    hoverInfo: restored("hoverInfo", true),
    cameraFov: { value: restored("cameraFov", SETTINGS_DEFAULTS.cameraFov), min: 10, max: 100, step: 1 },
    cameraPosition: { value: restored("cameraPosition", SETTINGS_DEFAULTS.cameraPosition) },
    cameraLookAt: { value: restored("cameraLookAt", SETTINGS_DEFAULTS.cameraLookAt) },
  });
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
  const loadBall = () => addBall({ position: [CUP_X_AT_REST, CUP_Y_AT_REST + 0.1, CUP_Z_AT_REST], friction: BALL.loadedFriction });
  
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
      
      <div className="buttonContainer">
        <button onClick={loadBall}>Load</button>
        <button onClick={() => addBall()}>Random</button>
        <button onClick={() => setSpawns([])}>Reset</button>
        <button onClick={() => togglePausePhysics()}>{isPaused ? "Resume" : "Pause"}</button>
      </div>
      <div style={{
        display: 'block',
        position: 'absolute',
        width: '100dvw',
        zIndex: 11,
        maxHeight: '100dvh',
        overflowY: 'scroll',
      }}>
        <Leva


          fill
          flat
          oneLineLabels
          collapsed
          titleBar={{
            title: "",
            drag: false,
            filter: true,
            position: { x: 0, y: 0 },
          }}
        />
      </div>
      <Canvas shadows="percentage" camera={{ position: controls.cameraPosition, fov: controls.cameraFov, near: 0.1 }}>
        {/* Widens the view on portrait phone screens so the arena isn't cropped at the sides */}
        <PortraitFov fov={controls.cameraFov} minAspect={0.8} />
        <directionalLight castShadow position={[10, 30, 10]} />
        <hemisphereLight intensity={1} color="white" groundColor="black" />

        {/* Everything interactive and physical lives inside the Physics context */}
        <Physics gravity={[0, -9.81, 0]} debug={controls.debugState} paused={isPaused}>
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

          {/* The rings mark the low cup, where the Attractor holds a ball; they fade while it moves */}
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

          <group name="pipeGroup">
            {/* 
            <Corner id="corner1" position={[4.25, 2 - 0.075, 4.25]} radius={2} rotation={[deg(-180), deg(180), 0]} />
            <Corner id="corner2" position={[4.25, 2 - 0.075, -4.25]} radius={2} rotation={[deg(180), deg(90), 0]} />
            <Corner id="corner3" position={[-4.25, 2 - 0.075, -4.25]} radius={2} rotation={[deg(0), deg(-180), deg(-180)]} />
            <Corner id="corner4" position={[-4.25, 2 - 0.075, 4.25]} radius={2} rotation={[deg(-180), deg(270), 0]} />
            <Quarterpipe id="quarterpipe1" position={[4.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(90), deg(-90)]} />
            <Quarterpipe id="quarterpipe2" position={[0, 2 - 0.075, -4.25]} radius={2} length={8.5} rotation={[0, deg(180), deg(-90)]} />
            <Quarterpipe id="quarterpipe3" position={[0, 2 - 0.075, 4.25]} radius={2} length={8.5} rotation={[0, deg(0), deg(-90)]} />
            <Quarterpipe id="quarterpipe4" position={[-4.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(-90), deg(-90)]} /> */}

            {/* Funnel → pipes → halfpipe, tilted by CHUTE_SLOPE so balls roll along */}
            <group name="chutes" position={[0, 3, -4]} rotation={[0, 0, -CHUTE_SLOPE]}>
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

        <OrbitControls makeDefault ref={controlsRef} target={controls.cameraLookAt} />
      </Canvas>
      {controls.showStats && <Stats className="statsContainer" />}
      {controls.hoverInfo && <DebugPanel />}
    </UtilWrapper>
  );
}
