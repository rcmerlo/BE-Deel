module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  extends: ['eslint:recommended', 'prettier', 'plugin:prettier/recommended'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 12,
  },
  rules: {
    'no-unused-vars': ['error', { args: 'none' }],
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
}
