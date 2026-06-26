import nestConfig from '@repo/eslint-config/nest';

export default [
  ...nestConfig,
  {
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
];
