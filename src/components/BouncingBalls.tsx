import { useRef, useState, useMemo } from "react";
import {
  useFrame,
  type ThreeEvent,
  type Vector3,
} from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useCursor, useTexture } from "@react-three/drei";
import * as THREE from "three";


// Scratch vector shared by all handlers, so clicks and frames don't allocate.
const forward = new THREE.Vector3();
const impulseDirection = new THREE.Vector3(0, 1, 0); // Upwards impulse direction


// Ball meshes are also on this layer so the marker can raycast only against them.
const BALL_LAYER = 1;
// Gap between the marker's tip and the hovered surface.
const MARKER_GAP = 0.000005;
const MARKER_SIZE = 0.5;

// The marker's own raycaster; R3F's shared one drives pointer events and must stay on all layers.
const ballRaycaster = new THREE.Raycaster();
ballRaycaster.layers.set(BALL_LAYER);
const hitNormal = new THREE.Vector3();

type BouncingBallProps = {
  name: string;
  position: Vector3;
  bounceMultiplier: number;
  radius: number;
  mass: number;
  restitution: number;
  friction: number;
  /** Click impulse is bounceMultiplier / impulseDivisor. */
  impulseDivisor: number;
  /** Clicking toggles between these two colors. */
  colors: [string, string];
  /** Color before the first click; defaults to colors[0]. */
  initialColor?: string;
  canSleep?: boolean;
};

export function BouncingBall({
  name,
  position,
  bounceMultiplier,
  radius,
  mass,
  restitution,
  friction,
  impulseDivisor,
  colors: [colorA, colorB],
  initialColor = colorA,
  canSleep = true,
}: BouncingBallProps) {
  const ballRef = useRef<RapierRigidBody>(null);
  const [hovered, setHovered] = useState(false);
  const [color, setColor] = useState(initialColor);
  useCursor(hovered);

  const textures = useTexture({
    bumpMap: "/textures/sphereMap.jpg",
    roughnessMap: "/textures/sphereMap.jpg",
    aoMap: "/textures/stripe.jpg",
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    setColor((c) => (c === colorA ? colorB : colorA));
    if (!ballRef.current) return;
    // camera.getWorldDirection(forward).multiplyScalar(bounceMultiplier / impulseDivisor);
    ballRef.current.applyImpulseAtPoint(impulseDirection.negate().multiplyScalar(bounceMultiplier / impulseDivisor), e.point, true);
  };

  return (
    <RigidBody
      name={name}
      ref={ballRef}
      colliders="ball"
      restitution={restitution}
      friction={friction}
      mass={mass}
      position={position}
      canSleep={canSleep}
    >
      <mesh
        castShadow
        onUpdate={(mesh) => mesh.layers.enable(BALL_LAYER)}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} {...textures} />
      </mesh>
    </RigidBody>
  );
}


export function ImpulseMarker() {
  const meshRef = useRef<THREE.Mesh>(null);
  console.log(forward, impulseDirection);
  useFrame(({ pointer, camera, scene }) => {
    const marker = meshRef.current;
    if (!marker) return;

    ballRaycaster.setFromCamera(pointer, camera);
    const [hit] = ballRaycaster.intersectObjects(scene.children, true);
    marker.visible = !!hit?.face;
    if (!hit?.face) return;

    // Stand the marker off the surface along the world-space normal, tip towards the hit. 
    hitNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
    marker.position
      .copy(hit.point)
      .addScaledVector(hitNormal, MARKER_GAP);
      // marker.rotateY(Math.PI/4); // Flip the arrow to point towards the hit
    marker.lookAt(hit.point);
    impulseDirection.copy(hitNormal).normalize();
  });

   const halo = new THREE.SphereGeometry(MARKER_SIZE, 32, 32, 0, (Math.PI * 2), Math.PI/8, Math.PI / 16);
   halo.translate(0, -MARKER_SIZE/1.1, 0) // Move the halo so that it aligns with the center of the sphere
   halo.rotateX(-Math.PI/2)
  
  
  // const halo = new THREE.ExtrudeGeometry([{arrowShape, extrudeSettings}]);
  return (
    <group>
    <mesh geometry={halo} name="marker" castShadow ref={meshRef} visible={false}>      
      <meshStandardMaterial 
        color="white"
        emissive="white" emissiveIntensity={2}
      />
    </mesh>
    </group>
  );
}

export function Halo() {
  const halo = new THREE.SphereGeometry(MARKER_SIZE, 32, 32, 0, (Math.PI * 2), Math.PI/8, Math.PI / 16);
  halo.translate(0, -MARKER_SIZE/1.1, 0) // Move the halo so that the tip of the arrow is at the center of the sphere
  halo.rotateX(-Math.PI/2)
  return (
    <mesh castShadow geometry={halo} />
  )
}

export function parametricArrow({ 
  stemWidth = 0.2, 
  stemLength = 0.5, 
  headWidth = 0.4, 
  headLength = 0.5, 
  length = 2,
  depth = 0.2
}) {
  
  // Calculate and memorize the arrow shape whenever dimensions change
  const arrowShape = useMemo(() => {
    const shape = new THREE.Shape()
    stemLength = length * (stemLength/(stemLength+headLength)); // Scale stemLength to fit within the total length of the arrow
    headLength = length * (headLength/(stemLength+headLength));
    
    shape.moveTo(0, 0)
    shape.lineTo(headWidth, stemLength)
    shape.lineTo(stemWidth / 2, stemLength)
    shape.lineTo(stemWidth / 2, headLength + stemLength)
    shape.lineTo( -stemWidth / 2, headLength + stemLength)
    shape.lineTo( -stemWidth / 2, stemLength )
    shape.lineTo(-headWidth, stemLength )    
    return shape;    
  }, [stemWidth, stemLength, headWidth, headLength])

  // Extrusion settings (depth, bevels, etc.)
  const extrudeSettings = useMemo(() => ({
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3
  }), [depth])

  return (
   <extrudeGeometry args={[arrowShape, extrudeSettings]}  />  
  )
}