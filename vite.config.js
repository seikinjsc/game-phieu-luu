import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Số phiên bản đọc từ package.json → tiêm vào code qua hằng __APP_VERSION__ (hiện ở tiêu đề game).
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// Gộp toàn bộ JS/CSS vào MỘT tệp dist/index.html (script build đổi tên thành game.html).
// Mở bằng file:// vẫn chạy vì mọi thứ đã inline, không còn tải file rời.
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [viteSingleFile()],
  build: {
    // Không tách file, không băm tên — tất cả nằm trong một trang.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    target: 'es2020',
    // Chỉ dựng trang MÊ CUNG. Game 60 cửa vẫn là bản legacy một tệp, do tools/build.mjs
    // sao thẳng sang dist — không đi qua Vite (xem đầu tệp đó).
    // `emptyOutDir: false` vì build.mjs chạy TRƯỚC và đã đặt game.html vào dist rồi.
    rollupOptions: { input: 'mecung.html' },
    emptyOutDir: false,
  },
  // Vitest đọc chính tệp cấu hình này.
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
