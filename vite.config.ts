import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // After the first visit the app opens from the device, offline. New builds install in the
    // background and apply on the next open.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,ttf,png,webmanifest}'],
        // Only the Hebrew and Latin subsets of Rubik are used.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,latin-ext,greek,vietnamese,math,symbols}-*.woff2', '**/icon-512.png', '**/icon-maskable-512.png', 'ngsw-worker.js'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: 5190,
    strictPort: true,
    allowedHosts: true,
  },
  preview: { host: '0.0.0.0', port: 5191, strictPort: true },
  build: { chunkSizeWarningLimit: 900 }, // the whole book ships in the bundle, for offline
})
