import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Allow context + constants to share a file with the provider — moving
      // them out for HMR alone is not worth the indirection in a small app.
      'react-refresh/only-export-components': 'off',
      // The "set-state-in-effect" rule (eslint-plugin-react-hooks v7) is too
      // strict for the patterns we use here (one-shot completion, count-up
      // animations) and would force unidiomatic refactors. Off by design.
      'react-hooks/set-state-in-effect': 'off',
      // Same — `Date.now()`/`Math.random()` in render is fine when the value
      // is only used for non-rendered state initialization or display formatting.
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      // The exhaustive-deps rule occasionally fires on memoized callbacks we
      // know are stable — keep it as a warning so it surfaces real issues.
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
