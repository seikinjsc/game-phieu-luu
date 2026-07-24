// data/obstacles.js — bảng kích thước/thuộc tính vật cản (OBS). DỮ LIỆU THUẦN.
//
// Mỗi mục: { w, h, ...cờ }. Cờ tuỳ chọn:
//   fly   1..4  vật lơ lửng ở cao độ khác nhau (spawner tính y theo mã fly)
//   top   1     vật treo từ TRẦN xuống (nhũ đá, cọc băng, laser trên)
//   gap   1     là VỰC/khe rơi (h nhỏ, chỉ đánh dấu bề rộng vực)
//   plat  1     là BỆ đứng được lên trên (thân cây, ống bắc, phiến băng)
//   swing 1     dây leo đu được
//   soft  1     vùng mềm (xoáy nước / vùng trọng lực) — chạm chậm chứ không chết ngay
//
// Vài tên vật cản trong ST là VẬT GHÉP, KHÔNG có ở đây — spawner tự dựng từ
// các mảnh dưới: 'net'→netT/netB · 'laser'→laserT/laserB · 'bridge'→pipeRun +
// vực · 'vineGap'→gapJ3 + vine.
import { GY } from './stages.js';

export const OBS = {
  bush: { w: 64, h: 26 },
  tire: { w: 48, h: 34 },
  box: { w: 46, h: 44 },
  pipe: { w: 60, h: 60 },
  double: { w: 106, h: 34 },
  tall: { w: 60, h: 112 },
  triple: { w: 152, h: 34 },
  wall: { w: 64, h: 140 },
  bird: { w: 56, h: 40, fly: 1 },
  flybird: { w: 56, h: 40, fly: 2 },
  coral: { w: 64, h: 74 },
  rockB: { w: 72, h: 132 },
  seaw: { w: 44, h: 158 },
  clam: { w: 78, h: 48 },
  rockT: { w: 72, h: 124, top: 1 },
  mine: { w: 48, h: 48, fly: 2 },
  wreck: { w: 130, h: 112 },
  netT: { w: 56, h: 10, top: 1 },
  netB: { w: 56, h: 10 },
  whirl: { w: 120, h: 120, fly: 2, soft: 1 },
  gzone: { w: 120, h: 150, fly: 2, soft: 1 },
  gapJ1: { w: 130, h: 8, gap: 1 },
  gapJ2: { w: 220, h: 8, gap: 1 },
  gapJ3: { w: 300, h: 8, gap: 1 },
  trunkS: { w: 230, h: 20, plat: 1 },
  trunkZ: { w: 120, h: 18, plat: 1 },
  vine: { w: 26, h: 190, swing: 1 },
  branch: { w: 104, h: GY - 52 },
  thorn: { w: 76, h: 34 },
  stump: { w: 66, h: 74 },
  gapS: { w: 110, h: 8, gap: 1 },
  gapM: { w: 180, h: 8, gap: 1 },
  gapL: { w: 250, h: 8, gap: 1 },
  pipeRun: { w: 210, h: 16, plat: 1 },
  lowPipe: { w: 96, h: GY - 46 },
  valve: { w: 56, h: 78 },
  barrel: { w: 52, h: 62 },
  drip: { w: 34, h: GY - 2 },
  spikeR: { w: 70, h: 30 },
  crackS: { w: 104, h: 8, gap: 1 },
  crackM: { w: 172, h: 8, gap: 1 },
  crackL: { w: 236, h: 8, gap: 1 },
  iceBridge: { w: 190, h: 16, plat: 1 },
  drift: { w: 86, h: 46 },
  iceRock: { w: 74, h: 112 },
  iceWall: { w: 62, h: 136 },
  icicle: { w: 42, h: 96, top: 1 },
  pit: { w: 128, h: 26 },
  snowball: { w: 70, h: 70, fly: 4 },
  spike: { w: 56, h: 44 },
  crystal: { w: 60, h: 122 },
  crystalT: { w: 60, h: 118, top: 1 },
  rockS: { w: 86, h: 60 },
  meteor: { w: 58, h: 52, fly: 3 },
  sat: { w: 112, h: 64, fly: 2 },
  laserT: { w: 26, h: 10, top: 1 },
  laserB: { w: 26, h: 10 },
};

// Tên vật cản GHÉP dùng trong ST nhưng không phải khoá trực tiếp của OBS
// (spawner dựng từ nhiều mảnh). Test dữ liệu dùng danh sách này để hợp lệ hoá.
export const COMPOSITE_OBS = ['net', 'laser', 'bridge', 'vineGap'];
