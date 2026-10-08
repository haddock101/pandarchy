import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { StatsGl, useFBO } from '@react-three/drei'

export function SceneWithFBO() {
  const statsRef = useRef(null);

  // 1. Create a custom Framebuffer Object (Render Target)
  const myRenderTarget = useFBO(512, 512)

  useEffect(() => {
    if (statsRef.current) {
      // 2. Use the stats-gl instance to add a named texture preview panel
      /* @ts-expect-error: Unreachable  */
      statsRef.current.addTexturePanel('My Buffer Target')
    }
  }, [])

  useFrame(({ gl, scene, camera }) => {
    // 3. Render scene off-screen into our target
    gl.setRenderTarget(myRenderTarget)
    gl.render(scene, camera)

    // 4. Pass the texture target down to stats-gl for real-time thumbnail updates
    if (statsRef.current) {
      /* @ts-expect-error: Unreachable  */
      statsRef.current.setTexture('My Buffer Target', myRenderTarget)
    }

    // 5. Restore default rendering to screen
    gl.setRenderTarget(null)
    gl.render(scene, camera)
  })

  return (
    <>
      <StatsGl ref={statsRef} />

    </>
  )
}
