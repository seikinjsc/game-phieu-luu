// systems/mobs.js — QUÁI TUẦN TRA. Logic thuần, không vẽ, không DOM.
//
// Quái đi y hệt cách nhân vật đi: từ tâm ô sang tâm ô, chỉ đổi hướng khi tới tâm. Dùng
// chung một mô hình di chuyển nên quái không bao giờ kẹt góc hay nửa người trong tường.
//
// CÁCH CHỌN HƯỚNG (quan trọng cho cảm giác chơi):
//   Ưu tiên ĐI THẲNG, chỉ rẽ khi hết đường. Quái đi thẳng thì trẻ đoán được nó sẽ tới đâu
//   và tính được lúc nào lách qua — đó mới là né. Quái rẽ ngẫu nhiên mỗi ô thì không ai
//   đoán nổi, va vào chỉ là xui, và trẻ học được rằng cố gắng cũng vô ích.
//   Chỉ quay đầu khi đi vào ngõ cụt.

const DIRS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export const MAU_TIM = 3; // máu mặc định của một con quái

// Đặt quái: chỉ ở ô cách xa điểm xuất phát, không đè lên cửa/ô thưởng/cửa ra.
// Xa điểm xuất phát để bé có vài giây làm quen trước khi gặp con đầu tiên.
export function datQuai(maze, rng, soLuong, dStart, { toc = 2.4, mau = MAU_TIM } = {}) {
  const { size } = maze;
  const cam = new Set([
    maze.start.y * size + maze.start.x,
    maze.exit.y * size + maze.exit.x,
    ...maze.gates.map((g) => g.y * size + g.x),
    ...maze.bonus.map((b) => b.y * size + b.x),
  ]);
  const cho = [];
  for (let i = 0; i < dStart.length; i++)
    if (dStart[i] >= 6 && !cam.has(i) && !maze.isWall(i % size, (i / size) | 0)) cho.push(i);
  for (let i = cho.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [cho[i], cho[j]] = [cho[j], cho[i]];
  }
  const quai = [];
  for (const i of cho) {
    if (quai.length >= soLuong) break;
    const cx = i % size,
      cy = (i / size) | 0;
    // đừng đặt hai con sát nhau, nhìn rất dồn cục
    if (quai.some((q) => Math.abs(q.cx - cx) + Math.abs(q.cy - cy) < 4)) continue;
    quai.push({
      cx,
      cy,
      x: cx + 0.5,
      y: cy + 0.5,
      dir: DIRS[rng.int(0, 3)],
      mau,
      mauToiDa: mau,
      song: true,
      toc,
    });
  }
  return quai;
}

// Đi một bước. Cùng mô hình tâm-ô-sang-tâm-ô như nhân vật, nên dt lớn cũng không xuyên tường.
export function diQuai(maze, q, dt, rng) {
  if (!q.song) return;
  let ngan = q.toc * dt;
  let chan = 0;
  while (ngan > 0 && chan++ < 64) {
    if (!q.dir || maze.isWall(q.cx + q.dir.x, q.cy + q.dir.y)) {
      // Hết đường thẳng: chọn hướng khác, TRÁNH quay đầu trừ khi đây là ngõ cụt.
      const mo = DIRS.filter((d) => !maze.isWall(q.cx + d.x, q.cy + d.y));
      const khongLui = mo.filter((d) => !q.dir || d.x !== -q.dir.x || d.y !== -q.dir.y);
      const chon = khongLui.length ? khongLui : mo;
      if (!chon.length) return; // bị nhốt hoàn toàn — không xảy ra với mê cung hợp lệ
      q.dir = chon[rng.int(0, chon.length - 1)];
    }
    const tx = q.cx + q.dir.x + 0.5,
      ty = q.cy + q.dir.y + 0.5;
    const con = Math.abs(tx - q.x) + Math.abs(ty - q.y);
    if (ngan < con) {
      q.x += q.dir.x * ngan;
      q.y += q.dir.y * ngan;
      return;
    }
    q.x = tx;
    q.y = ty;
    q.cx += q.dir.x;
    q.cy += q.dir.y;
    ngan -= con;
    // Tới ngã ba thì có thể rẽ; đi thẳng vẫn được ưu tiên (chỉ rẽ 25% số lần).
    const re = DIRS.filter(
      (d) => !maze.isWall(q.cx + d.x, q.cy + d.y) && (d.x !== -q.dir.x || d.y !== -q.dir.y),
    );
    if (re.length > 1 && rng.next() < 0.25) q.dir = re[rng.int(0, re.length - 1)];
  }
}

// Quái nào đang chạm vào nhân vật? Trả con đầu tiên, hoặc null.
export const CHAM = 0.68; // khoảng cách coi là chạm, tính theo ô
export function quaiCham(quai, px, py) {
  for (const q of quai) if (q.song && Math.abs(q.x - px) + Math.abs(q.y - py) < CHAM) return q;
  return null;
}

// Quái nào trong tầm chém? Rộng hơn tầm chạm một chút để đánh trước khi bị đụng.
export const TAM_CHEM = 1.35;
export function quaiTrongTam(quai, px, py) {
  let gan = null,
    d = Infinity;
  for (const q of quai) {
    if (!q.song) continue;
    const k = Math.abs(q.x - px) + Math.abs(q.y - py);
    if (k < TAM_CHEM && k < d) {
      d = k;
      gan = q;
    }
  }
  return gan;
}
