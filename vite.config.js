import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: { port: 5190 },
  // песочница тянет CodeMirror и компилятор SFC — крупные чанки ожидаемы
  build: { chunkSizeWarningLimit: 900 },
})
