import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import type { Plugin } from 'vite';

// Renders public/favicon.svg into the icons the web app manifest and iOS ask for (see index.html and
// public/manifest.webmanifest), whenever the SVG is newer than them. Replace the SVG and the icons follow.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'public/favicon.svg');
const OUT_DIR = join(ROOT, 'public/icons');
// The app's own background (index.css), behind the icons that can't be transparent
const BACKGROUND = '#111111';

type Icon = {
  file: string;
  size: number;
  /** How much of the icon's width the graphic may fill */
  fill: number;
  /** Opaque icons get the app's background behind the graphic */
  opaque?: boolean;
};

const ICONS: Icon[] = [
  // Chrome's install prompt and app launcher
  { file: 'icon-192.png', size: 192, fill: 0.9 },
  { file: 'icon-512.png', size: 512, fill: 0.9 },
  // Android crops these to its own shape, keeping only a circle 80% across; at 0.62 even a square graphic's
  // corners stay inside it
  { file: 'icon-maskable-192.png', size: 192, fill: 0.62, opaque: true },
  { file: 'icon-maskable-512.png', size: 512, fill: 0.62, opaque: true },
  // iOS fills transparency with black and rounds the corners itself
  { file: 'apple-touch-icon.png', size: 180, fill: 0.78, opaque: true },
];

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

/** The SVG, as a nested <svg> placed and scaled into a square icon of the given size. */
function iconSvg(source: string, { size, fill, opaque }: Icon) {
  const body = source.slice(source.indexOf('<svg'));
  const rootTag = body.slice(0, body.indexOf('>') + 1);
  const viewBox =
    attr(rootTag, 'viewBox') ?? `0 0 ${parseFloat(attr(rootTag, 'width') ?? '0')} ${parseFloat(attr(rootTag, 'height') ?? '0')}`;
  const box = (size * (1 - fill)) / 2;
  // Keep everything on the root tag (namespaces, styles) except where and how big it is
  const placed = rootTag
    .replace(/\s(x|y|width|height|viewBox|preserveAspectRatio)="[^"]*"/g, '')
    .replace(/^<svg/, `<svg x="${box}" y="${box}" width="${size * fill}" height="${size * fill}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet"`);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    (opaque ? `<rect width="${size}" height="${size}" fill="${BACKGROUND}"/>` : '') +
    placed +
    body.slice(rootTag.length) +
    `</svg>`
  );
}

const isStale = (file: string) => {
  const out = join(OUT_DIR, file);
  return !existsSync(out) || statSync(out).mtimeMs < statSync(SOURCE).mtimeMs;
};

/** Writes every icon that's missing or older than the SVG, and says which. */
export function generateAppIcons(force = false) {
  const stale = ICONS.filter((icon) => force || isStale(icon.file));
  if (stale.length === 0) return [];
  const source = readFileSync(SOURCE, 'utf8');
  mkdirSync(OUT_DIR, { recursive: true });
  for (const icon of stale) {
    const png = new Resvg(iconSvg(source, icon), { font: { loadSystemFonts: false } }).render().asPng();
    writeFileSync(join(OUT_DIR, icon.file), png);
  }
  return stale.map((icon) => icon.file);
}

/** Keeps the icons in step with favicon.svg, before each build and while the dev server runs. */
export function appIcons(): Plugin {
  const run = (log: (message: string) => void, force = false) => {
    const written = generateAppIcons(force);
    if (written.length) log(`app icons rendered from favicon.svg: ${written.join(', ')}`);
  };
  return {
    name: 'app-icons',
    buildStart() {
      run((message) => this.info(message));
    },
    configureServer(server) {
      server.watcher.add(SOURCE);
      server.watcher.on('change', (file) => {
        if (file === SOURCE) run((message) => server.config.logger.info(message), true);
      });
    },
  };
}

// `bun scripts/appIcons.ts` renders them all, whether or not the SVG has changed
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`rendered ${generateAppIcons(true).join(', ')}`);
}
