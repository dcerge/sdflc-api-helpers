/*
    // 'plugin:@typescript-eslint/eslint-recommended',
    // 'plugin:@typescript-eslint/recommended',
    //'plugin:prettier/recommended',
    // 'prettier/@typescript-eslint',
    //'prettier/react',
    //'tslint-config-prettier'
*/
module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'plugin:react/recommended',
    'eslint:recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    'filenames/match-regex': 'off',
    '@typescript-eslint/camelcase': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': 'off',
    'react/display-name': [0, { ignoreTranspilerName: true }],
    'react/no-string-refs': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
