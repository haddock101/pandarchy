import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Attractor } from "@react-three/rapier-addons";
import { Stats, OrbitControls, Preload } from "@react-three/drei";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useState, useRef, type ComponentRef } from "react";
import UtilWrapper from "./components/UtilWrapper.tsx";
import InvisibleContainer from "./components/InvisibleContainer.tsx";
import { BouncingBall, ImpulseMarker, type BallSpawn } from "./components/BouncingBalls.tsx";
import { AttractorField } from "./components/AttractorField.tsx";
import { DebugPanel } from "./components/DebugPanel.tsx";
import { Corner, Funnel, Halfpipe, Pipe90, Quarterpipe } from "./components/PropsNStuff.tsx";
import { Walls } from "./components/Wall.tsx";
import Floor from "./components/Floor.tsx";
import { Catapult } from "./components/Catapult.tsx";
import { FLOOR_Y, RIGHT_CUP_AT_REST } from "./components/catapultLayout.ts";
import { generateSeededKey } from "./components/playfulRandomId.ts";
import { restored, saveSettings } from "./persistedSettings.ts";

const deg = THREE.MathUtils.degToRad;

// The catapult rests with its right cup on the floor, ready to launch. It sits a little left of the
// centre: at x=0 the ball clips the end of pipe903 on the way up and gets thrown straight up instead of
// into the funnel, and from about x=-0.6 the raised left end runs into pipe904 below the funnel.
const CATAPULT_POSITION: [number, number, number] = [-0.4, 0, 0];
const CUP_X_AT_REST = CATAPULT_POSITION[0] + RIGHT_CUP_AT_REST[0];
const CUP_Y_AT_REST = CATAPULT_POSITION[1] + RIGHT_CUP_AT_REST[1];
// Pulls balls into that cup, centred where a ball comes to rest in it (0.2 below the bowl's sphere centre).
const ATTRACTOR_POSITION: [number, number, number] = [CUP_X_AT_REST, CUP_Y_AT_REST + 0.2, 0];
const ATTRACTOR_RANGE = 2;
// Applied as an impulse every physics step, so even this pulls a ball at up to ~3× gravity.
const ATTRACTOR_STRENGTH = 0.35;
// After a launch the pull is switched off for a moment, or it drags the ball straight back into the cup.
const ATTRACTOR_LAUNCH_PAUSE_MS = 1500;
// The field visual lies on the floor under the cup, as wide as the attraction reaches at floor level.
const FIELD_POSITION: [number, number, number] = [CUP_X_AT_REST, FLOOR_Y + 0.015, 0];
const FIELD_RADIUS = Math.sqrt(ATTRACTOR_RANGE ** 2 - (ATTRACTOR_POSITION[1] - FLOOR_Y) ** 2);

const randomColor = () => `hsl(${Math.round(Math.random() * 360)}, 70%, 60%)`;

function createSpawn(seq: number, overrides: Partial<BallSpawn> = {}): BallSpawn {
  return {
    seq,
    // Drop in from above, slightly offset so stacked balls don't spawn inside each other
    position: [(Math.random() - 0.5) * 2, 8, (Math.random() - 0.5) * 2],
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
    containerOpacity: { value: restored("containerOpacity", 0.4), min: 0, max: 1, step: 0.1 },
    impulseMultiplier: { value: restored("impulseMultiplier", 10), min: 0.0001, max: 100, step: 0.0001 },
    maxBalls: { value: restored("maxBalls", 12), min: 1, max: 50, step: 1 },
    debugState: restored("debugState", false),
    showStats: restored("showStats", false),
    hoverInfo: restored("hoverInfo", true),
    cameraFov: { value: restored("cameraFov", 49  ), min: 10, max: 100, step: 1 },
    cameraPosition: { value: restored("cameraPosition", [14.5, 13.5, 24.5] as [number, number, number]) }, 
    cameraLookAt: { value: restored("cameraLookAt",  [0, 0, 0] as [number, number, number]) },
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
  // Drops a ball straight into the catapult's right cup, just above where it comes to rest
  const loadBall = () => addBall({ position: [CUP_X_AT_REST, CUP_Y_AT_REST + 0.1, 0], friction: 0.25 });

  const [attractorOn, setAttractorOn] = useState(true);
  const attractorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onLaunch = () => {
    setAttractorOn(false); 
    clearTimeout(attractorTimer.current);
    attractorTimer.current = setTimeout(() => setAttractorOn(true), ATTRACTOR_LAUNCH_PAUSE_MS);
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
      <Leva
        fill
        flat
        //oneLineLabels
        collapsed
        titleBar={{
          title: "",
          drag: true,
          filter: true,
          position: { x: 0, y: 0 },
        }}
      />

      <Canvas shadows="percentage" camera={{ position: controls.cameraPosition, fov: controls.cameraFov, near: 0.1 }}>
        <directionalLight castShadow position={[10, 30, 10]} />
        <hemisphereLight intensity={1} color="white" groundColor="black" />

        {/* Everything interactive and physical lives inside the Physics context */}
        <Physics gravity={[0, -9.81, 0]} debug={controls.debugState} paused={isPaused}>
          {/* Suspense keeps the rest of the scene on screen while the ball textures load */}
          <Suspense fallback={null}>
            {slotNames.map((name, i) => (
              <BouncingBall
                key={i}
                name={name}
                spawn={spawns[i] ?? null}
                impulseMultiplier={controls.impulseMultiplier}
                impulseDivisor={1}
                radius={0.5}
                density={1}
                ccd
                restitution={0.1}
                friction={spawns[i]?.friction ?? 0}
                canSleep={false}
                togglePhysics={togglePausePhysics}
                toggleControls={toggleControls}
              />
            ))}
            {/* Compile every material up front (hidden balls included) so the first spawn doesn't stutter */}
            <Preload all />
          </Suspense>

          {/* Gently pulls balls towards the catapult's right cup */}
          <Attractor
            position={ATTRACTOR_POSITION}
            strength={attractorOn ? ATTRACTOR_STRENGTH : 0}
            range={ATTRACTOR_RANGE}
            type="linear"
          />
          <AttractorField position={FIELD_POSITION} radius={FIELD_RADIUS} active={attractorOn} />

          <Catapult
            position={CATAPULT_POSITION}
            impulseMultiplier={controls.impulseMultiplier}
            toggleControls={toggleControls}
            onLaunch={onLaunch}
          />

          <group name="pipeGroup">
            <Corner id="corner1" position={[4.25, 2 - 0.075, 4.25]} radius={2} rotation={[deg(-180), deg(180), 0]} />
            <Corner id="corner2" position={[4.25, 2 - 0.075, -4.25]} radius={2} rotation={[deg(180), deg(90), 0]} />
            <Corner id="corner3" position={[-4.25, 2 - 0.075, -4.25]} radius={2} rotation={[deg(0), deg(-180), deg(-180)]} />
            <Corner id="corner4" position={[-4.25, 2 - 0.075, 4.25]} radius={2} rotation={[deg(-180), deg(270), 0]} />
            <Quarterpipe id="quarterpipe1" position={[4.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(90), deg(-90)]} />
            <Quarterpipe id="quarterpipe2" position={[0, 2 - 0.075, -4.25]} radius={2} length={8.5} rotation={[0, deg(180), deg(-90)]} />
            <Quarterpipe id="quarterpipe3" position={[0, 2 - 0.075, 4.25]} radius={2} length={8.5} rotation={[0, deg(0), deg(-90)]} />
            <Quarterpipe id="quarterpipe4" position={[-4.25, 2 - 0.075, 0]} radius={2} length={8.5} rotation={[0, deg(-90), deg(-90)]} />

            {/* Funnel → pipes → halfpipe, tilted slightly so balls roll along */}
            <group name="chutes" position={[0, 2, -4]} rotation={[0, 0, -0.0325]}>
              <group rotation={[0, 0, 0.035]} position={[0.028, 0.155, 0]}>
                <Funnel id="funnel1" radius={3.5} position={[-4.5, 2.422, 4]} />
                <Pipe90
                  id="pipe904"
                  radius={1}
                  thetaLength={Math.PI * 2}
                  rotation={[0, deg(90), deg(180)]}
                  position={[-4.5, 1.922, 3]}
                />
              </group>
              <Pipe90 id="pipe901" radius={3} rotation={[deg(270), 0, deg(90)]} position={[-1.5, 0.922, 3]} />
              <Halfpipe id="halfpipe1" radius={1} length={5} position={[1, 0.922, 0]} rotation={[0, 0, deg(270)]} />
              <group rotation={[0.0325, 0, 0]} position={[0, 0, -0.0325]}>
                <Pipe90 id="pipe902" radius={2} rotation={[deg(270), 0, 0]} position={[3.5, 0.922, 2]} />
                <Pipe90 id="pipe903" radius={2} rotation={[deg(270), 0, deg(270)]} position={[3.5, 0.922, 2]} />
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
