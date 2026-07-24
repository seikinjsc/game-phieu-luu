// data/gear.js — trang bị 6 thế giới + bảng độ bền. DỮ LIỆU THUẦN, không đổi số nào.
//
// Mỗi thế giới có bộ RIÊNG, KHÔNG dùng chung chỉ số giữa các thế giới:
//   land (0)  WEAP/ARMOR   sea (1)  SWEAP/SARMOR   space (2)  AWEAP/AARMOR
//   ice (3)   IWEAP/IARMOR sewer(4) GWEAP/GARMOR   jungle(5)  JWEAP/JARMOR
//
// Vũ khí {n tên, dmg sát thương, rng tầm chém, cost giá xu, ico biểu tượng}.
// Giáp   {n tên, hp máu cộng thêm, cost giá xu, ico, c màu}.
// Cấp 0 = mặc định miễn phí (tay không / áo thường).

export const WEAP = [
  { n: 'Tay không', dmg: 0, rng: 0, cost: 0, ico: '✋' },
  { n: 'Gậy gỗ', dmg: 1, rng: 76, cost: 60, ico: '🪵' },
  { n: 'Kiếm sắt', dmg: 2, rng: 92, cost: 170, ico: '🗡️' },
  { n: 'Kiếm kim cương', dmg: 3, rng: 108, cost: 360, ico: '⚔️' },
];
export const ARMOR = [
  { n: 'Áo thường', hp: 0, cost: 0, ico: '👕', c: '#26356F' },
  { n: 'Áo da', hp: 1, cost: 90, ico: '🥋', c: '#8A5A2E' },
  { n: 'Giáp sắt', hp: 2, cost: 210, ico: '🛡️', c: '#8B94A6' },
  { n: 'Giáp rồng', hp: 3, cost: 400, ico: '🐲', c: '#C79A2E' },
];

export const SWEAP = [
  { n: 'Tay không', dmg: 0, rng: 0, cost: 0, ico: '✋' },
  { n: 'Giáo tre', dmg: 1, rng: 78, cost: 70, ico: '🎋' },
  { n: 'Đinh ba sắt', dmg: 2, rng: 94, cost: 190, ico: '🔱' },
  { n: 'Đinh ba ngọc trai', dmg: 3, rng: 112, cost: 390, ico: '💠' },
];
export const SARMOR = [
  { n: 'Áo bơi', hp: 0, cost: 0, ico: '🩱', c: '#1E7FA8' },
  { n: 'Đồ lặn', hp: 1, cost: 100, ico: '🤿', c: '#15556E' },
  { n: 'Giáp vảy cá', hp: 2, cost: 230, ico: '🐟', c: '#2E9E86' },
  { n: 'Giáp mai rùa', hp: 3, cost: 430, ico: '🐢', c: '#7A9C2E' },
];

export const AWEAP = [
  { n: 'Tay không', dmg: 0, rng: 0, cost: 0, ico: '✋' },
  { n: 'Súng laser nhỏ', dmg: 1, rng: 86, cost: 90, ico: '🔫' },
  { n: 'Kiếm plasma', dmg: 2, rng: 100, cost: 230, ico: '🗡️' },
  { n: 'Búa sao băng', dmg: 3, rng: 118, cost: 460, ico: '🔨' },
];
export const AARMOR = [
  { n: 'Áo thường', hp: 0, cost: 0, ico: '👕', c: '#3B3F6E' },
  { n: 'Đồ phi hành', hp: 1, cost: 120, ico: '🧑‍🚀', c: '#D8DEE8' },
  { n: 'Giáp titan', hp: 2, cost: 270, ico: '🛰️', c: '#8E9AAE' },
  { n: 'Giáp năng lượng', hp: 3, cost: 500, ico: '⚡', c: '#5E3FA8' },
];

export const IWEAP = [
  { n: 'Tay không', dmg: 0, rng: 0, cost: 0, ico: '✋' },
  { n: 'Rìu băng', dmg: 1, rng: 82, cost: 120, ico: '🪓' },
  { n: 'Búa lửa', dmg: 2, rng: 98, cost: 300, ico: '🔥' },
  { n: 'Kiếm mặt trời', dmg: 3, rng: 120, cost: 560, ico: '☀️' },
];
export const IARMOR = [
  { n: 'Áo thường', hp: 0, cost: 0, ico: '👕', c: '#3F5A7A' },
  { n: 'Áo lông', hp: 1, cost: 150, ico: '🧥', c: '#8A6A4A' },
  { n: 'Giáp da gấu', hp: 2, cost: 330, ico: '🐻', c: '#5E4632' },
  { n: 'Giáp lửa vĩnh cửu', hp: 3, cost: 620, ico: '🔆', c: '#B5432A' },
];

export const GWEAP = [
  { n: 'Tay không', dmg: 0, rng: 0, cost: 0, ico: '✋' },
  { n: 'Cờ lê thép', dmg: 1, rng: 84, cost: 160, ico: '🔧' },
  { n: 'Đèn khò', dmg: 2, rng: 100, cost: 380, ico: '🔦' },
  { n: 'Gậy điện', dmg: 3, rng: 124, cost: 700, ico: '⚡' },
];
export const GARMOR = [
  { n: 'Áo thường', hp: 0, cost: 0, ico: '👕', c: '#4A5236' },
  { n: 'Áo mưa', hp: 1, cost: 190, ico: '🧥', c: '#3F7A5A' },
  { n: 'Đồ bảo hộ', hp: 2, cost: 420, ico: '🦺', c: '#C28A1E' },
  { n: 'Giáp thép chống rỉ', hp: 3, cost: 780, ico: '⚙️', c: '#7A8290' },
];

export const JWEAP = [
  { n: 'Tay không', dmg: 0, rng: 0, cost: 0, ico: '✋' },
  { n: 'Dao rựa', dmg: 1, rng: 86, cost: 220, ico: '🔪' },
  { n: 'Boomerang', dmg: 2, rng: 104, cost: 480, ico: '🪃' },
  { n: 'Nỏ săn', dmg: 3, rng: 130, cost: 900, ico: '🏹' },
];
export const JARMOR = [
  { n: 'Áo thường', hp: 0, cost: 0, ico: '👕', c: '#3E6B3A' },
  { n: 'Áo lá rừng', hp: 1, cost: 250, ico: '🍃', c: '#4E8F3A' },
  { n: 'Giáp vỏ cây', hp: 2, cost: 540, ico: '🪵', c: '#7A5230' },
  { n: 'Giáp da báo', hp: 3, cost: 980, ico: '🐆', c: '#C28A2E' },
];

// Độ bền từng ô trang bị. Mảng [_, cấp1, cấp2, cấp3] cho vũ khí (w*) và giáp (a*);
// phụ kiện (boots/charm/fins/tank/jet/mag/cramp/torch/grip/lamp/claw/coco) là 1 số.
// Tiền tố: (không) land · s sea · a space · i ice · g sewer · j jungle.
export const DUR = {
  w: [0, 40, 95, 220],
  a: [0, 12, 20, 30],
  boots: 8,
  charm: 5,
  sw: [0, 45, 100, 230],
  sa: [0, 14, 22, 32],
  fins: 10,
  tank: 6,
  aw: [0, 50, 110, 240],
  aa: [0, 15, 24, 34],
  jet: 12,
  mag: 8,
  iw: [0, 55, 120, 260],
  ia: [0, 16, 26, 36],
  cramp: 12,
  torch: 7,
  gw: [0, 60, 130, 280],
  ga: [0, 18, 28, 38],
  grip: 14,
  lamp: 7,
  jw: [0, 65, 140, 300],
  ja: [0, 20, 30, 40],
  claw: 16,
  coco: 7,
};
