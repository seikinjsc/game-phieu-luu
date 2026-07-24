// render/hud.js — bố cục HUD. Tách hình học khỏi mã vẽ (drawHUD của legacy).
//
// layoutHUD() trả về DANH SÁCH Ô {name,x,y,w,h} để tools/hud-check.mjs kiểm không ô nào
// chồng nhau (lỗi lịch sử #9: thanh máu trùm và thanh tài nguyên cùng ở giữa đáy → đè nhau;
// và thanh trùm đè ô tim khi có 9 tim). Vẽ thật sẽ dùng chính bố cục này khi ghép game.
//
// Bố cục 3 dải:
//   TRÊN   : điểm/xu (trái) · thanh máu trùm HOẶC thanh tiến độ (giữa) · tim (phải)
//   GIỮA   : hàng chip bảo bối
//   DƯỚI   : độ bền (trái) · thanh tài nguyên o2/ấm/năng lượng (giữa, chỉ biển/băng/rừng)

export function layoutHUD(opts = {}) {
  const W = opts.W ?? 900,
    H = opts.H ?? 500;
  const hearts = opts.hearts ?? 3,
    maxH = opts.maxH ?? hearts;
  const boss = !!opts.boss;
  const world = opts.world || 'land';
  const chips = opts.chips || [];

  const cells = [];
  const score = { name: 'score', x: 14, y: 12, w: 236, h: 46 };
  const slots = Math.max(maxH, hearts);
  const bwH = Math.min(300, 54 + slots * 24);
  const heartsCell = { name: 'hearts', x: W - 14 - bwH, y: 12, w: bwH, h: 46 };
  cells.push(score, heartsCell);

  if (boss) {
    // Co thanh trùm vào GIỮA khoảng trống điểm↔tim, chừa lề 8px hai bên → không bao giờ đè.
    const availL = score.x + score.w + 8;
    const availR = heartsCell.x - 8;
    const avail = Math.max(0, availR - availL);
    const panelW = Math.min(Math.max(190, Math.min(320, avail - 32)) + 32, avail);
    cells.push({ name: 'bossbar', x: availL + (avail - panelW) / 2, y: 12, w: panelW, h: 52 });
  } else {
    const bw = 280;
    cells.push({ name: 'progress', x: W / 2 - bw / 2 - 14, y: 12, w: bw + 28, h: 46 });
  }

  chips.forEach((nm, i) =>
    cells.push({ name: 'chip:' + nm, x: 18 + i * 148, y: 66, w: 140, h: 34 }),
  );

  cells.push({ name: 'durability', x: 14, y: H - 56, w: 262, h: 44 });

  if (world === 'water' || world === 'ice' || world === 'jungle') {
    const ow = 250;
    cells.push({ name: 'resource', x: W / 2 - ow / 2 - 10, y: H - 56, w: ow + 20, h: 44 });
  }
  return cells;
}

// Hai ô chữ nhật có chồng nhau không (chạm biên KHÔNG tính là chồng).
export const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Trả về danh sách cặp ô chồng nhau (rỗng = HUD sạch).
export function hudOverlaps(cells) {
  const bad = [];
  for (let i = 0; i < cells.length; i++)
    for (let j = i + 1; j < cells.length; j++)
      if (overlaps(cells[i], cells[j])) bad.push([cells[i].name, cells[j].name]);
  return bad;
}
