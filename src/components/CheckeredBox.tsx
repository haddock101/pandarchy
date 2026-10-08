import { useMemo } from 'react';
import * as THREE from 'three';
// @ts-ignore
export default function CheckeredBox(props) {
  // 1. Generate the checkered texture procedurally inside useMemo
  const checkeredTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const numSquares = 8; // 8x8 grid
    const squareSize = size / numSquares;

    for (let i = 0; i < numSquares; i++) {
      for (let j = 0; j < numSquares; j++) {
        // @ts-ignore
        ctx.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#000000';
        // @ts-ignore
        ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;

    // Optional: Make the pixels crisp instead of blurry when close up
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  return (
    <mesh {...props}>
      <boxGeometry args={[25, 0.01, 25]} />
      <meshStandardMaterial
        map={checkeredTexture}
        roughness={0.5}
        metalness={0.0}
      />
    </mesh>
  );
}
