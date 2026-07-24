// tools/hud-check.mjs — dò các ô HUD có chồng nhau không, cho MỌI loại cửa và số tim 2..9.
// Bắt lại lỗi lịch sử #9 (thanh máu trùm & thanh tài nguyên đè nhau). Chạy: npm run check:hud
import { layoutHUD, hudOverlaps } from '../src/render/hud.js';

const WORLDS = ['land', 'sea', 'space', 'ice', 'sewer', 'jungle'];
// bộ chip xấu nhất: vũ trụ hiện chip trọng lực + 3 bảo bối
const CHIPSETS = [[], ['shield'], ['gv', 'shield', 'balloon', 'boots']];

let checks = 0;
const fails = [];
for (const world of WORLDS)
  for (const boss of [false, true])
    for (const chips of CHIPSETS)
      for (let hearts = 2; hearts <= 9; hearts++) {
        // maxH biến thiên: bằng tim, và trường hợp giáp đầy (maxH=6)
        for (const maxH of [hearts, Math.max(hearts, 6)]) {
          checks++;
          const cells = layoutHUD({ world, boss, hearts, maxH, chips });
          const bad = hudOverlaps(cells);
          if (bad.length)
            fails.push(
              `world=${world} boss=${boss} tim=${hearts} maxH=${maxH} chip=[${chips}] → ${bad
                .map((p) => p.join('×'))
                .join(', ')}`,
            );
        }
      }

if (fails.length) {
  console.log('❌ HUD CHỒNG Ô (' + fails.length + '/' + checks + ' cấu hình):');
  fails.slice(0, 40).forEach((f) => console.log('  ' + f));
  process.exit(1);
} else {
  console.log(
    '✅ HUD sạch: ' +
      checks +
      ' cấu hình (6 thế giới × trùm × chip × tim 2..9), không ô nào chồng nhau.',
  );
}
