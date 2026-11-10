import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { MESSAGES } from './src/i18n/messages'
import { buildSeoTexts } from './src/i18n/seo'

/** Writes seo.json next to the built site: the API reads it to give each page its own head. */
function seoTexts(): Plugin {
  return {
    name: 'phobos-seo-texts',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'seo.json', source: JSON.stringify(buildSeoTexts(MESSAGES)) })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoTexts()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5080',
      '/media': 'http://localhost:5080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
})
