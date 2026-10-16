import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
// @ts-ignore
export default function CheckeredBox(props) {
  // 1. Generate the checkered texture procedurally inside useMemo
  const checkeredTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    const numSquares = 8; // 8x8 grid
    const squareSize = size / numSquares;

    for (let i = 0; i < numSquares; i++) {
      for (let j = 0; j < numSquares; j++) {
        // @ts-ignore
        ctx.fillStyle = (i + j) % 2 === 0 ? "#ffffff" : "skyblue";
        // @ts-ignore
        ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);

    // Optional: Make the pixels crisp instead of blurry when close up
     texture.magFilter = THREE.NearestFilter;
    //
    return texture;
  }, []);

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow {...props}>
        <boxGeometry args={[25, 1, 25]} />
        <meshBasicMaterial attach="material-0"  color="0xffffff" />
        <meshBasicMaterial attach="material-1" color="0xffffff" />
        <meshStandardMaterial attach="material-2" bumpMap={checkeredTexture} map={checkeredTexture} transparent />
        <meshBasicMaterial attach="material-3" color="0xffffff" />
        <meshBasicMaterial attach="material-4" color="0xffffff" />
        <meshBasicMaterial attach="material-5" color="0xffffff" />
      </mesh>
    </RigidBody>
  );
}
