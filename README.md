# pandarchy

For fun project - typescript on r3f with rapier, drei using vite and bun.

Sandbox 3D physics. It will evolve.

## Running it

```bash
bun install
bun run dev        # dev server, also reachable from other devices on the LAN
bun run build      # typecheck + production build into dist/
bun run lint
bun run buildpush  # build and rsync dist/ to the web server
```

## Playing

- **Press, drag and release** on a ball, or on one of the glowing green buttons on
  the catapult arm, to push it. The
  further you drag, the harder the push; the marker pulls back and turns red as
  it charges. Works with touch too.
- **W/A/S/D** push the last hovered ball across the floor (relative to the
  camera) and **space** makes it jump.
- **Load** drops a ball into the catapult's right cup, **Random** drops
  one from above, **Reset** clears all balls and **Pause** freezes physics.
- The settings panel (top, collapsed) toggles the Rapier collider view
  (`debugState`), the invisible container walls, the push strength
  (`impulseMultiplier`), how many balls can be in play (`maxBalls`; past that,
  the oldest ball is reused) and an FPS meter (`showStats`). With `debugState` on,
  collisions and sensor hits are logged to the console.
  Settings are remembered in the browser's localStorage between visits.
- With `hoverInfo` on (the default), hovering a ball or the catapult shows its
  live properties in a panel at the top right.

## Layout

- `src/App.tsx` – the scene: lights, environment, physics world and its contents
- `src/components/` – scene pieces (balls, catapult, pipes, floor, walls, GLB models)
- `src/components/impulse.ts` – the shared press–drag–release push logic
- `public/` – runtime assets loaded by URL: `hdr/`, `textures/`, `glb/`

## Assets

- GLB models in `public/glb/` are from [Kenney](https://kenney.nl/assets) (CC0).
- `evening_road_01_2k.hdr` is from [Poly Haven](https://polyhaven.com/a/evening_road_01) (CC0).
