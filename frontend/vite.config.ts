/**
 * Vite конфигурация.
 *
 * Vite е build tool и dev server. Той замества webpack/CRA с много
 * по-бърз dev experience (благодарение на native ESM в браузъра).
 *
 * Plugin-и:
 * - @vitejs/plugin-react: компилира JSX/TSX, дава HMR (Hot Module
 *   Replacement - промени се виждат веднага без full reload).
 * - @tailwindcss/vite: Tailwind v4 official plugin - сканира файловете,
 *   намира кои Tailwind класове ползваме и генерира съответния CSS.
 *
 * Може да добавим още плъгини за:
 * - SVG като компоненти (vite-plugin-svgr)
 * - PWA (vite-plugin-pwa)
 * - Bundle analyzer (rollup-plugin-visualizer)
 *
 * Документация: https://vite.dev/config/
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
