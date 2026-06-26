import baseConfig from '@repo/eslint-config/base';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/node_modules/**',
      'apps/web/src/components/ui/**',
    ],
  },
  ...baseConfig,
];
