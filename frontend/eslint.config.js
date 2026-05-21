/**
 * ESLint конфигурация (flat config format, ESLint 9+).
 *
 * ESLint анализира кода за грешки и не-добри практики ПРЕДИ да го пуснем.
 * Пример: `console.log` останал в production код, неизползвани променливи,
 * dependency arrays с грешки в useEffect, и т.н.
 *
 * Plugin-и:
 * - @eslint/js                          - core JS правила
 * - typescript-eslint                   - TypeScript-aware правила
 * - eslint-plugin-react-hooks           - правилата на React Hooks
 *                                          (rules-of-hooks, exhaustive-deps)
 * - eslint-plugin-react-refresh         - предупреждава за неща, които
 *                                          чупят HMR в Vite
 *
 * Пуска се с: npm run lint
 *
 * За production бихме добавили:
 * - tseslint.configs.strictTypeChecked  - по-стриктни правила, type-aware
 * - eslint-plugin-react-x               - React-specific lint rules
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist/ е build output - не го lint-вай
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
