import nextConfig from '@repo/eslint-config/next';

export default [
  {
    ignores: ['next-env.d.ts', '**/components/ui/**'],
  },
  ...nextConfig,
];
