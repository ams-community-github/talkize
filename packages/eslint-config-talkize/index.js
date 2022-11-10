module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint/eslint-plugin'],
    extends: [
      'turbo',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
    ],
    root: true,
    env: {
      node: true,
    },
    ignorePatterns: ['package.json', 'package-lock.json', 'tsconfig.json', '**/*.specs.ts'],
    rules: {
      'no-return-await': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_.*$',
          varsIgnorePattern: '^_.*$',
        },
      ],
    },
  };
  