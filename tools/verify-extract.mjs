// Kiểm chứng: dữ liệu tách ra src/data/ khớp 100% bản gốc legacy (không đổi số nào).
// Trích literal từ legacy, eval, deep-compare với module đã tách. Dùng một lần.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url), 'utf8');
const GY = 408,
  CEIL = 92,
  CEIL3 = 118,
  VTOP = 74; // hằng để eval OBS

// Trích chuỗi literal của `const NAME=` bằng cách khớp ngoặc cân bằng.
function grab(name) {
  const m = src.indexOf('const ' + name + '=');
  if (m < 0) throw new Error('không thấy ' + name);
  let i = src.indexOf('=', m) + 1;
  while (' \n\t'.includes(src[i])) i++;
  const open = src[i],
    close = open === '[' ? ']' : '}';
  let depth = 0,
    out = '';
  for (; i < src.length; i++) {
    const c = src[i];
    out += c;
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) break;
    }
  }
  return out;
}

const evalLit = (name) =>
  new Function('GY', 'CEIL', 'CEIL3', 'VTOP', 'return (' + grab(name) + ')')(GY, CEIL, CEIL3, VTOP);

const stages = await import('../src/data/stages.js');
const obstacles = await import('../src/data/obstacles.js');
const mobs = await import('../src/data/mobs.js');
const gear = await import('../src/data/gear.js');
const palettes = await import('../src/data/palettes.js');
const difficulty = await import('../src/data/difficulty.js');

const checks = {
  ST: stages.ST,
  OBS: obstacles.OBS,
  MOB: mobs.MOB,
  DIFF: difficulty.DIFF,
  DUR: gear.DUR,
  WEAP: gear.WEAP,
  ARMOR: gear.ARMOR,
  SWEAP: gear.SWEAP,
  SARMOR: gear.SARMOR,
  AWEAP: gear.AWEAP,
  AARMOR: gear.AARMOR,
  IWEAP: gear.IWEAP,
  IARMOR: gear.IARMOR,
  GWEAP: gear.GWEAP,
  GARMOR: gear.GARMOR,
  JWEAP: gear.JWEAP,
  JARMOR: gear.JARMOR,
  TH: palettes.TH,
  MCT: palettes.MCT,
  SEAT: palettes.SEAT,
  SPT: palettes.SPT,
  ICET: palettes.ICET,
  SEWT: palettes.SEWT,
  JGT: palettes.JGT,
  DORA: palettes.DORA,
  VNP: palettes.VNP,
  HAZE: palettes.HAZE,
};

let fail = 0;
for (const [name, mine] of Object.entries(checks)) {
  const orig = evalLit(name);
  const a = JSON.stringify(orig),
    b = JSON.stringify(mine);
  if (a !== b) {
    fail++;
    console.log('❌ ' + name + ' KHÁC bản gốc');
    // in vị trí ký tự đầu tiên khác nhau
    for (let k = 0; k < Math.max(a.length, b.length); k++)
      if (a[k] !== b[k]) {
        console.log(
          '   tại ~' + k + ': gốc=…' + a.slice(k, k + 40) + ' | mới=…' + b.slice(k, k + 40),
        );
        break;
      }
  } else {
    console.log('✅ ' + name);
  }
}
console.log(fail ? '\n' + fail + ' bảng KHÁC bản gốc!' : '\nTất cả khớp 100% bản gốc.');
process.exit(fail ? 1 : 0);
