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

Click a ball to push it away from the camera. The **Debug Controls** panel
(top) toggles the Rapier collider view, the invisible container walls and the
bounce strength. With `debugState` on, sensor hits are logged to the console.

## Layout

- `src/App.tsx` – the scene: lights, environment, physics world and its contents
- `src/components/` – scene pieces (balls, pipes, floor, walls, GLB models)
- `public/` – runtime assets loaded by URL: `hdr/`, `textures/`, `glb/`

## Assets

- GLB models in `public/glb/` are from [Kenney](https://kenney.nl/assets) (CC0).
- `evening_road_01_2k.hdr` is from [Poly Haven](https://polyhaven.com/a/evening_road_01) (CC0).
