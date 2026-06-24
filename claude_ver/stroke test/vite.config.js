import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'
import path from 'path'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const pwa = VitePWA({
    injectRegister: 'auto',
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'audio/**', 'level-bg/**', 'vendor/**'],
    manifest: {
      name: '行行出狀元',
      short_name: '狀元',
      start_url: '/',
      display: 'standalone',
      background_color: '#fffbeb',
      theme_color: '#f59e0b',
    },
    workbox: {
      globIgnores: ['**/hanzi-data/*.json'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.includes('/hanzi-data/') && url.pathname.endsWith('.json'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'hanzi-data',
            expiration: {
              maxEntries: 60000,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
          },
        },
      ],
    },
  })

  const base = {
    plugins: [react(), pwa],
  }

  if (mode !== 'debug') return base

  return {
    ...base,
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(rootDir, 'index.html'),
          bleUartDebug: path.resolve(rootDir, 'ble-uart-debug.html'),
          bleRwTest: path.resolve(rootDir, 'ble-rw-test.html'),
          bleDiagnosis: path.resolve(rootDir, 'ble-diagnosis.html'),
        },
      },
    },
  }
})
