const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const FRAMEWORKS = [
  'react',
  'react-native',
  'react-native-*',
  'expo',
  'expo-*',
  '@expo/*',
  '@supabase/*',
  '@tanstack/*',
];

module.exports = defineConfig([
  expoConfig,
  globalIgnores([
    'dist/**',
    '.expo/**',
    'node_modules/**',
    'expo-env.d.ts',
    'src/infrastructure/supabase/database.types.ts',
  ]),
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/application/*',
                '@/infrastructure/*',
                '@/features/*',
                '@/app/*',
                '@/shared/*',
              ],
              message: 'Domena nie może zależeć od innych warstw.',
            },
            { group: FRAMEWORKS, message: 'Domena musi być niezależna od frameworków.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/infrastructure/*', '@/features/*', '@/app/*', '@/shared/*'],
              message: 'Warstwa aplikacji zależy tylko od domeny i własnych portów.',
            },
            { group: FRAMEWORKS, message: 'Warstwa aplikacji musi być niezależna od frameworków.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/infrastructure/*', '!@/infrastructure/container'],
              message:
                'Prezentacja korzysta z infrastruktury tylko przez @/infrastructure/container.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*', '@/infrastructure/*', '@/application/*'],
              message: 'Wspólne UI nie zależy od modułów ani infrastruktury.',
            },
          ],
        },
      ],
    },
  },
]);
