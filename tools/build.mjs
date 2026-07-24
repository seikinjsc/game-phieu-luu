// tools/build.mjs — đóng gói game CHƠI ĐƯỢC thành dist/game.html (một tệp, chạy offline).
//
// Hiện tại bản chơi được là legacy/ (đã có đủ 60 cửa + cơ chế lưu mới). Bản module src/
// còn đang lắp ráp; khi xong sẽ chuyển build sang Vite (xem script "build:app").
// Bước này chỉ sao tệp một-file của legacy và nhúng số phiên bản từ package.json vào tiêu đề.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root)));
const src = readFileSync(new URL('legacy/game-be-phieu-luu-v32.html', root), 'utf8');

// Nhúng phiên bản vào <title> (chỉ đổi bản xuất bản, KHÔNG sửa tệp legacy gốc).
const html = src.replace(
  /<title>[^<]*<\/title>/,
  `<title>Bé Phiêu Lưu — 60 Cửa Ải · v${pkg.version}</title>`,
);

mkdirSync(new URL('dist/', root), { recursive: true });
writeFileSync(new URL('dist/game.html', root), html);
console.log(
  `✓ dist/game.html (v${pkg.version}, ${(html.length / 1024).toFixed(0)} KB) — mở bằng trình duyệt là chơi được.`,
);
