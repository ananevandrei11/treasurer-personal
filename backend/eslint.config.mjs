import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '*.config.ts', '*.config.js', '*.config.mjs'] },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // consistent-type-imports is intentionally off: NestJS DI requires value imports for providers
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
)
