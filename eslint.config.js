import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off',
      'no-empty': 'off'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'scratch/**', 'supabase/**']
  }
];
