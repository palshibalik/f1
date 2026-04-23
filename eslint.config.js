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
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Allow unused vars that start with uppercase (constants/components)
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      // Downgrade setState-in-effect to warn — these are intentional patterns
      'react-hooks/set-state-in-effect': 'warn',
      // Downgrade purity warnings — Date.now() usage is intentional
      'react-hooks/purity': 'warn',
    },
  },
])