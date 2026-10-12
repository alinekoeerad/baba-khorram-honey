import nextConfig from 'eslint-config-next';

const config = [
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
  {
    ignores: [
      'reference/**',
      'data/**',
      '.next/**',
      'node_modules/**',
      'dist/**',
      'public/**',
      'uploads/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
    },
  },
];

export default config;
