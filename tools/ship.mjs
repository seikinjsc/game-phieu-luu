// tools/ship.mjs — đưa bản hiện tại lên GitHub (kích hoạt Deploy Pages).
//   npm run ship                → commit với thông điệp mặc định + push
//   npm run ship -- "đổi nút X" → commit với thông điệp của bạn + push
// Cổng an toàn: test + build phải XANH mới đẩy. Không đẩy được bản lỗi.
import { execSync, execFileSync } from 'node:child_process';

const npm = (c) => execSync(c, { stdio: 'inherit' });
const git = (args) => execFileSync('git', args, { stdio: 'inherit' });
const gitOut = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const msg = process.argv.slice(2).join(' ') || `deploy: cập nhật ${stamp}`;

try {
  console.log('▶ Chạy test…');
  npm('npm test');
  console.log('▶ Build…');
  npm('npm run build');
} catch {
  console.error('\n❌ Test/build HỎNG — KHÔNG đẩy lên. Sửa xong chạy lại nhé.');
  process.exit(1);
}

// Cho bạn thấy chính xác những gì sắp đưa lên (repo dùng chung — kiểm trước khi push).
const changes = gitOut(['status', '--porcelain']);
if (changes) {
  console.log('\n📦 Sẽ đưa lên GitHub:\n' + changes + '\n');
  git(['add', '-A']);
  try {
    git(['commit', '-m', msg]);
  } catch {
    console.log('(không có gì để commit)');
  }
} else {
  console.log('\n(không có thay đổi mới trong file)');
}

console.log('▶ Push lên main…');
git(['push', 'origin', 'main']);
console.log('\n✅ Đã đẩy lên GitHub. Pages cập nhật sau ~30 giây.');
console.log('   Link: https://seikinjsc.github.io/game-phieu-luu/  (nhớ Ctrl+F5)');
