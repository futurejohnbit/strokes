import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const base = {
    plugins: [react()],
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
