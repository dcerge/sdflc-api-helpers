import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import jest from 'eslint-plugin-jest';

export default [
  {
    ignores: ['build/**/*', 'node_modules/**/*'],
  },
  js.configs.recommended,
  {
    // Config for jest.config.ts and other config files
    files: ['*.config.ts'],
    plugins: {
      '@typescript-eslint': typescript,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  {
    // Config for test files
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: {
      '@typescript-eslint': typescript,
      jest: jest,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Add Jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-undef': 'off', // Turn off no-undef for test files
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: [
      // dotfiles
      // '.eslintrc.js',
      // '.huskyrc.js',
      // '.lintstagedrc.js',
      // '.prettierrc.js',
      // '.babelrc.js',
      // '.stylelintrc.js',
      // // webpack configs
      // 'webpack.*.config.js',
      // // directories
      // 'public/**/*',
      // 'static/**/*',
      // '.cache/**/*',
      // 'dist/**/*',
      // 'content/**/*',
      // 'config/**/*',
      // 'scripts/**/*'
    ],
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
      jest: jest,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        setImmediate: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'prettier/prettier': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Disable all eslint-disable related warnings
      '@typescript-eslint/no-unused-disable': 'off',
      'eslint-comments/no-unused-disable': 'off',
      'unused-imports/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-unused-disable': 'off',
      // Turn off warning about directives
      'eslint-comments/no-unused-enable': 'off',
    },
  },
];
