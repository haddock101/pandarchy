import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

// Vite copies everything in public/ into the build. This removes the models and textures the app never
// loads, so they aren't uploaded. A file is kept when:
//  - the built code names it (comments and dead code are already gone by then), or
//  - it's a Model Library entry that some <Model name="…"> places, or
//  - a kept .gltf/.glb loads it (its .bin buffers and textures).
// Only the folders below are pruned; icons, favicon and the manifest are left alone.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET_DIRS = ['gltf', 'glb', 'textures', 'hdr'];
const MODEL_LIBRARY = join(ROOT, 'src/components/ModelLibrary.tsx');

const ASSET_PATH = new RegExp(`(?:\\./|/)?((?:${ASSET_DIRS.join('|')})/[^"'\`\\s)?#]+)`, 'g');

const stripComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const filesUnder = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
      )
    : [];

/** How many times the built code names each asset path, e.g. "glb/barrel.glb". */
function countReferences(code: string) {
  const counts = new Map<string, number>();
  for (const [, path] of code.matchAll(ASSET_PATH)) counts.set(path, (counts.get(path) ?? 0) + 1);
  return counts;
}

/** Model Library entries nothing places: their names, and the asset paths only they mention. */
function unplacedModels() {
  const library = stripComments(readFileSync(MODEL_LIBRARY, 'utf8'));
  const entries = [...library.matchAll(/(\w+):\s*\{\s*url:\s*["']\.?\/?([^"']+)["']/g)].map(([, name, url]) => ({ name, url }));

  const placed = new Set<string>();
  let dynamic = false;
  for (const file of filesUnder(join(ROOT, 'src')).filter((f) => /\.[jt]sx?$/.test(f) && f !== MODEL_LIBRARY)) {
    const code = stripComments(readFileSync(file, 'utf8'));
    for (const [tag] of code.matchAll(/<Model\b[^>]*>/g)) {
      const name = tag.match(/\bname=["'](\w+)["']/)?.[1];
      if (name) placed.add(name);
      else dynamic = true; // name={something}: can't tell which, so keep them all
    }
  }
  return { unplaced: dynamic ? [] : entries.filter((entry) => !placed.has(entry.name)), dynamic };
}

/** Files a .gltf or .glb loads by relative path (buffers and images), as paths next to it. */
function modelDependencies(file: string, path: string): string[] {
  let json: { buffers?: { uri?: string }[]; images?: { uri?: string }[] };
  try {
    if (file.endsWith('.glb')) {
      const data = readFileSync(file);
      // GLB: 12-byte header, then the JSON chunk's length (4 bytes), type (4 bytes) and the JSON itself
      json = JSON.parse(data.toString('utf8', 20, 20 + data.readUInt32LE(12)));
    } else {
      json = JSON.parse(readFileSync(file, 'utf8'));
    }
  } catch {
    return [];
  }
  return [...(json.buffers ?? []), ...(json.images ?? [])]
    .map((item) => item.uri)
    .filter((uri): uri is string => !!uri && !uri.startsWith('data:'))
    .map((uri) => posix.normalize(posix.join(posix.dirname(path), decodeURIComponent(uri))));
}

const megabytes = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;

export function pruneAssets(): Plugin {
  let outDir = '';
  return {
    name: 'prune-assets',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      const builtCode = filesUnder(outDir)
        .filter((file) => /\.(js|css|html)$/.test(file))
        .map((file) => readFileSync(file, 'utf8'))
        .join('\n');
      const counts = countReferences(builtCode);

      // The library names every model, placed or not; take back the mentions of the unplaced ones
      const { unplaced, dynamic } = unplacedModels();
      for (const { url } of unplaced) counts.set(url, (counts.get(url) ?? 0) - 1);
      if (dynamic) this.warn('a <Model> has a non-literal name, so every Model Library entry is kept');

      const keep = new Set([...counts].filter(([, count]) => count > 0).map(([path]) => path));
      for (const path of [...keep]) {
        if (/\.(gltf|glb)$/.test(path)) {
          for (const dependency of modelDependencies(join(outDir, path), path)) keep.add(dependency);
        }
      }

      let removedBytes = 0;
      let keptBytes = 0;
      const removed: string[] = [];
      for (const file of ASSET_DIRS.flatMap((dir) => filesUnder(join(outDir, dir)))) {
        const path = relative(outDir, file).split('\\').join('/');
        const size = statSync(file).size;
        if (keep.has(path)) {
          keptBytes += size;
        } else {
          removedBytes += size;
          removed.push(path);
          rmSync(file);
        }
      }
      // Leave no empty folders behind
      for (const dir of ASSET_DIRS.map((d) => join(outDir, d))) {
        const prune = (d: string): boolean => {
          if (!existsSync(d)) return true;
          const empty = readdirSync(d).every((name) => {
            const child = join(d, name);
            return statSync(child).isDirectory() && prune(child);
          });
          if (empty) rmSync(d, { recursive: true });
          return empty;
        };
        prune(dir);
      }

      for (const path of keep) {
        if (!existsSync(join(outDir, path))) this.warn(`referenced but missing from public/: ${path}`);
      }
      if (unplaced.length) this.info(`unplaced models left out: ${unplaced.map((m) => m.name).join(', ')}`);
      this.info(
        `assets: kept ${keep.size} files (${megabytes(keptBytes)}), left out ${removed.length} unused (${megabytes(removedBytes)})`,
      );
    },
  };
}
