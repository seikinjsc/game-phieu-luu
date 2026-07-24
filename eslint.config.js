import js from '@eslint/js';

// Cấu hình phẳng tối giản (ESLint 9). Chỉ bật bộ khuyến nghị + môi trường trình duyệt.
export default [
  { ignores: ['dist/**', 'legacy/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    // Mã game chạy trên trình duyệt.
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        requestAnimationFrame: 'readonly',
        AudioContext: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        globalThis: 'readonly',
        __APP_VERSION__: 'readonly',
      },
    },
  },
  {
    // Công cụ, kiểm thử, tệp cấu hình chạy trên Node.
    files: ['**/*.mjs', 'tools/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        globalThis: 'readonly',
      },
    },
  },
];
