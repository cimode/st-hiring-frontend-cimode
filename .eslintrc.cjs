module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'coverage', '.eslintrc.cjs', 'jest.config.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      files: ['src/**/*.test.{ts,tsx}', 'src/setupTests.ts', 'src/test-utils/**'],
      env: { jest: true },
      extends: ['plugin:testing-library/react', 'plugin:jest-dom/recommended'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
}
