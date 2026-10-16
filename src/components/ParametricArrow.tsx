import { useMemo } from "react";
import * as THREE from "three";

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

  return ([arrowShape, extrudeSettings])
}