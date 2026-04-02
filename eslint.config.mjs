import nextVitals from 'eslint-config-next/core-web-vitals'

export default [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'public/**',
      'node_modules/**',
      'src/app/daily/api/markdown/[...slug]/route.ts.backup',
    ],
  },
]
