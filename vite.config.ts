import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { appIcons } from './scripts/appIcons.ts'

// https://vite.dev/config/
export default defineConfig({
  // appIcons renders public/favicon.svg into the home-screen and install icons whenever it changes
  plugins: [react(), appIcons()],
  build: {
    // The Rapier chunk embeds its physics WASM as base64 and can't get smaller.
    chunkSizeWarningLimit: 2500,
    rolldownOptions: {
      output: {
        // Split large libraries into their own chunks so a code change
        // doesn't make browsers re-download three.js and Rapier.
        codeSplitting: {
          groups: [
            { name: 'rapier', test: /node_modules[\\/]@dimforge/ },
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
})
