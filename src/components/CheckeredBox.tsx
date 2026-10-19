import { useEffect, useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

function createCheckeredTexture(width = 512, height = 256, squares = [16,8]) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const squareSizeX = width / squares[0];
    const squareSizeY = height / squares[1];
    for (let i = 0; i < squares[0]; i++) {
      for (let j = 0; j < squares[1]; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? "#ffffff" : "skyblue";
        ctx.fillRect(i * squareSizeX, j * squareSizeY, squareSizeX, squareSizeY);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  // Crisp pixels instead of blurry ones when viewed up close
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

/** A box with a checkered top face. Wrap it in a RigidBody to give it physics. */
export default function CheckeredBox(props: ThreeElements["mesh"]) {
  const texture = useMemo(() => createCheckeredTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh receiveShadow {...props}>
      <boxGeometry args={[50, 1, 25]} />
      <meshBasicMaterial attach="material-0" color="#ffffff" />
      <meshBasicMaterial attach="material-1" color="#ffffff" />
      <meshStandardMaterial
        attach="material-2"
        bumpMap={texture}
        map={texture}
        transparent
      />
      <meshBasicMaterial attach="material-3" color="#ffffff" />
      <meshBasicMaterial attach="material-4" color="#ffffff" />
      <meshBasicMaterial attach="material-5" color="#ffffff" />
    </mesh>
  );
}
