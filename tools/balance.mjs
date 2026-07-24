/* ════════════════════════════════════════════════════════════════
   KIỂM TRA CÂN BẰNG TỰ ĐỘNG — chạy: npm run check:balance
   1. Cửa nào vật cản dày hơn tầm nhảy → không thể qua (BLOCKER)
   2. Trùm × 3 mức khó × 3 cấp vũ khí: thời gian hạ 15..180s
   3a. Tương phản vật cản/nền cùng thế giới ≥ 2:1
   3b. Tương phản chữ/nút ≥ 3:1
   4. Kiểm thử khói: 60 cửa không lỗi âm thanh (BLOCKER)
   ════════════════════════════════════════════════════════════════ */
import { fileURLToPath } from 'node:url';
import { createHarness } from './harness.mjs';
import { TH, MCT, SEAT, SPT, ICET, SEWT, JGT } from '../src/data/palettes.js';

const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

const V0 = 640,
  G_FALL = 1900,
  G_HOLD = 950;
const airTimeShort = (2 * V0) / G_FALL; // nhả sớm
const apex = (V0 * V0) / (2 * G_HOLD);
const airTimeLong = V0 / G_HOLD + Math.sqrt((2 * apex) / G_FALL); // giữ nút

const DIFFS = [
  { n: 'Bé', sp: 0.88, gap: 1.18, boss: 0.8 },
  { n: 'Thường', sp: 1, gap: 1, boss: 1 },
  { n: 'Người lớn', sp: 1.2, gap: 0.84, boss: 1.4 },
];

// ── Tương phản màu (WCAG) ──────────────────────────────────────────
function lum(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const h = await createHarness(GAME);
const ST = h.stages();
let blocker = 0,
  warn = 0;

console.log('\n═══ 1. TỐC ĐỘ / KHOẢNG CÁCH VẬT CẢN (tầm nhảy) ═══');
console.log(
  `  tầm nhảy nhả sớm ×tốc độ = ${airTimeShort.toFixed(2)}s · giữ nút = ${airTimeLong.toFixed(2)}s`,
);
for (const d of DIFFS) {
  let bad = 0;
  for (const s of ST) {
    if (s.boss) continue;
    const sp = s.sp[2] * d.sp;
    const gapMin = (sp * s.gapK * 0.86 + 140) * d.gap;
    const reachShort = airTimeShort * sp;
    if (gapMin < reachShort * 0.55) {
      bad++;
      blocker++;
      console.log(
        `  ✗ cửa ${s.n} (${d.n}): k/c ${gapMin.toFixed(0)} < tầm nhảy tối thiểu ${(reachShort * 0.55).toFixed(0)} → KHÔNG QUA ĐƯỢC`,
      );
    }
  }
  if (!bad) console.log(`  ✓ mức ${d.n}: mọi cửa đều qua được`);
}

console.log('\n═══ 2. THỜI GIAN HẠ TRÙM — 3 mức khó × 3 cấp vũ khí (nên 15..180s) ═══');
const CYCLE = 4.2; // giây trung bình cho MỖI cơ hội đánh trúng (trùm lao xuống)
console.log('  trùm            mức khó     máu   vũ khí①   vũ khí②   vũ khí③');
for (const s of ST) {
  if (!s.boss) continue;
  for (let di = 0; di < DIFFS.length; di++) {
    h.settings().diff = di;
    h.startStage(s.n - 1);
    const max = h.state().boss.max;
    const times = [1, 2, 3].map((dmg) => (max / dmg) * CYCLE);
    const flag = times.map((x) => (x > 180 || x < 15 ? '✗' : '✓'));
    if (flag.includes('✗')) warn++;
    console.log(
      `  ${(s.name || '').padEnd(14)} ${DIFFS[di].n.padEnd(10)} ${String(max).padStart(4)}   ` +
        times.map((x, i) => `${x.toFixed(0)}s${flag[i]}`.padStart(8)).join('  '),
    );
  }
}

console.log('\n═══ 3a. TƯƠNG PHẢN VẬT CẢN / NỀN cùng thế giới (WCAG ≥ 2:1) ═══');
// Cặp đại diện (màu vật cản/viền vs màu nền chính) lấy từ data/palettes.js, skin 0.
const obsPairs = [
  ['🌍 đất: viền vật cản / trời', '#1E1E28', TH[0].sky[0]],
  ['🌍 đất(MC): đất / trời', MCT.dirtD, MCT.sky[0]],
  ['🌊 biển: san hô / nước sâu', SEAT[0].coral[0], SEAT[0].bot],
  ['🚀 vũ trụ: pha lê / trời tối', SPT[0].edge, SPT[0].sky[0]],
  ['❄️ băng: thông / trời sáng', ICET[0].tree, ICET[0].sky[1]],
  ['🕳️ cống: ống sáng / tường tối', SEWT[0].pipeL, SEWT[0].bot],
  ['🌴 rừng: thân cây / trời sáng', JGT[0].trunk, JGT[0].sky[1]],
];
for (const [n, fg, bg] of obsPairs) {
  const r = ratio(fg, bg);
  if (r < 2) {
    blocker++;
    console.log(`  ✗ ${n.padEnd(30)} ${r.toFixed(2)}:1 (cần ≥ 2:1)`);
  } else console.log(`  ✓ ${n.padEnd(30)} ${r.toFixed(2)}:1`);
}

console.log('\n═══ 3b. TƯƠNG PHẢN CHỮ / NÚT (WCAG ≥ 3:1 cho chữ lớn) ═══');
const btnPairs = [
  ['Nút chính', '#FFFFFF', '#E8447F'],
  ['Nút viền', '#22306E', '#FFFFFF'],
  ['Nút thoát', '#FFFFFF', '#E8544F'],
  ['Công tắc BẬT', '#FFFFFF', '#2F7A36'],
  ['Công tắc TẮT', '#4A5464', '#D8DEE8'],
  ['Nút NHẢY', '#FFFFFF', '#3F7BD6'],
  ['Nút ĐÁNH', '#FFFFFF', '#2FA84F'],
];
for (const [n, fg, bg] of btnPairs) {
  const r = ratio(fg, bg);
  if (r < 3) {
    blocker++;
    console.log(`  ✗ ${n.padEnd(16)} ${r.toFixed(2)}:1 (cần ≥ 3:1)`);
  } else console.log(`  ✓ ${n.padEnd(16)} ${r.toFixed(2)}:1`);
}

console.log('\n═══ 4. KIỂM THỬ KHÓI (60 cửa) ═══');
h.progress().unlocked = ST.length;
h.resetAudioErrors();
for (let si = 0; si < ST.length; si++) {
  h.startStage(si);
  for (let i = 0; i < 120; i++) {
    h.frames(1);
    if (h.screen() !== 'play') break;
    if (i % 9 === 0) h.jump();
  }
}
const ae = h.audioErrors();
if (ae.length) {
  blocker++;
  console.log('  ✗ lỗi âm thanh:', ae[0]);
} else console.log(`  ✓ ${ST.length} cửa chạy sạch, không lỗi âm thanh`);

console.log('');
if (warn) console.log(`⚠ ${warn} lưu ý cân bằng trùm (vũ khí yếu/mức khó cao — xem bảng mục 2)`);
if (blocker) console.log(`✗ CÓ ${blocker} LỖI CHẶN\n`);
else console.log('✓ KHÔNG CÓ LỖI CHẶN\n');
process.exit(blocker ? 1 : 0);
