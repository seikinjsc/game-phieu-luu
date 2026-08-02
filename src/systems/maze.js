// systems/maze.js — sinh mê cung từ HẠT GIỐNG. Logic thuần, không vẽ, không DOM.
//
// Vì sao gieo hạt chứ không Math.random(): cùng hạt → cùng mê cung → test được, và
// hai bố con nhập cùng một mã là đi CHUNG một mê cung (giống mã đua của chế độ versus).
//
// LƯỚI: ô lẻ = lối đi/tường xen kẽ. Kích thước LUÔN LẺ.
//   - "ô lưới" (block) là thứ người chơi nhìn thấy: 0 = tường, 1 = lối đi.
//   - "phòng" (cell) là đơn vị của thuật toán, nằm ở toạ độ lẻ (2c+1).
//   Lưới 21 ô → 10×10 phòng. Cỡ này vừa canvas logic 900×500 của dự án.
//
// BA BƯỚC:
//   1. Quay lui theo chiều sâu (recursive backtracker) → mê cung "hoàn hảo", không vòng lặp.
//   2. ĐỤC THÊM TƯỜNG (braid) → tạo vòng lặp. Mê cung hoàn hảo bắt trẻ đi vào ngõ cụt
//      liên tục rất chán; có vòng lặp thì luôn còn đường khác, dễ chịu hơn nhiều.
//   3. Đặt cửa ra + các cửa khoá bằng LẤY MẪU ĐIỂM XA NHẤT → rải đều, không dồn một góc
//      (yêu cầu ở ME-CUNG-DESIGN.md §2).

import { makeRng } from '../core/rng.js';

export const WALL = 0;
export const FLOOR = 1;

// Theo mức khó 0 Dễ / 1 Vừa / 2 Khó. Số ô lưới mỗi chiều và số cửa khoá.
// (Bản thiết kế ghi 11/15/21 mà không nói rõ đơn vị; đọc theo Ô LƯỚI thì mức Dễ chỉ còn
//  5×5 phòng — quá nhỏ để ra cảm giác mê cung. Đã nâng lên 15/21/31 ô = 7×7 / 10×10 / 15×15
//  phòng, vẫn lọt canvas 900×500.)
export const MAZE_SIZE = [15, 21, 31];
export const MAZE_GATES = [3, 5, 7];

const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

// Loang rộng từ một điểm, trả mảng khoảng cách (−1 = không tới được / là tường).
export function bfs(m, sx, sy) {
  const { size, grid } = m;
  const dist = new Int32Array(size * size).fill(-1);
  if (grid[sy * size + sx] !== FLOOR) return dist;
  dist[sy * size + sx] = 0;
  let q = [sy * size + sx];
  while (q.length) {
    const next = [];
    for (const i of q) {
      const x = i % size,
        y = (i / size) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        const j = ny * size + nx;
        if (grid[j] !== FLOOR || dist[j] !== -1) continue;
        dist[j] = dist[i] + 1;
        next.push(j);
      }
    }
    q = next;
  }
  return dist;
}

// Đường đi ngắn nhất từ a đến b, gồm cả hai đầu. Trả [] nếu không có đường.
// Dùng cho la bàn chỉ hướng tới cửa gần nhất (mức Dễ/Vừa).
export function solve(m, ax, ay, bx, by) {
  const { size, grid } = m;
  const dist = bfs(m, bx, by); // loang từ ĐÍCH → đi ngược dốc là ra đường ngắn nhất
  let i = ay * size + ax;
  if (dist[i] < 0) return [];
  const path = [{ x: ax, y: ay }];
  while (dist[i] > 0) {
    const x = i % size,
      y = (i / size) | 0;
    let best = -1;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const j = ny * size + nx;
      if (grid[j] === FLOOR && dist[j] === dist[i] - 1) {
        best = j;
        break;
      }
    }
    if (best < 0) return []; // lưới hỏng — không được xảy ra, test canh việc này
    i = best;
    path.push({ x: i % size, y: (i / size) | 0 });
  }
  return path;
}

export function makeMaze(seed, opts = {}) {
  const rng = makeRng(seed);
  let size = opts.size || MAZE_SIZE[1];
  if (size % 2 === 0) size++; // lưới phải lẻ, nếu không viền ngoài hở
  const gateCount = opts.gates ?? MAZE_GATES[1];
  const bonusCount = opts.bonus ?? 0;
  const braid = opts.braid ?? 0.1; // tỉ lệ tường bị đục thêm để tạo vòng lặp

  const grid = new Uint8Array(size * size); // mặc định toàn tường
  const cn = (size - 1) / 2; // số phòng mỗi chiều
  const at = (cx, cy) => (2 * cy + 1) * size + (2 * cx + 1);

  // ── Bước 1: quay lui theo chiều sâu (dùng ngăn xếp, không đệ quy → không tràn) ──
  const seen = new Uint8Array(cn * cn);
  const stack = [[0, 0]];
  seen[0] = 1;
  grid[at(0, 0)] = FLOOR;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const open = [];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx,
        ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < cn && ny < cn && !seen[ny * cn + nx]) open.push([nx, ny]);
    }
    if (!open.length) {
      stack.pop();
      continue;
    }
    const [nx, ny] = open[rng.int(0, open.length - 1)];
    seen[ny * cn + nx] = 1;
    grid[at(nx, ny)] = FLOOR;
    grid[(cy + ny + 1) * size + (cx + nx + 1)] = FLOOR; // đục tường GIỮA hai phòng
    stack.push([nx, ny]);
  }

  // ── Bước 2: đục thêm tường tạo vòng lặp ──
  // Chỉ đục tường NGĂN GIỮA hai lối đi đối diện nhau. Cột góc (toạ độ chẵn–chẵn)
  // không bao giờ đục — đục vào là thủng thành phòng trống, mất hình mê cung.
  const cand = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      // Tường NGĂN GIỮA hai phòng luôn có đúng một toạ độ chẵn. Toạ độ chẵn–chẵn là
      // CỘT GÓC: đục vào là thủng ra ô trống 2×2, mê cung biến thành cái sân.
      // (Chỉ kiểm tra hai ô hai bên là không đủ — cột góc cũng thoả điều kiện đó khi
      //  hai tường kế bên đã bị bước 1 mở ra.)
      if ((x % 2 === 0) === (y % 2 === 0)) continue;
      if (grid[y * size + x] !== WALL) continue;
      const ngang = grid[y * size + x - 1] === FLOOR && grid[y * size + x + 1] === FLOOR;
      const doc = grid[(y - 1) * size + x] === FLOOR && grid[(y + 1) * size + x] === FLOOR;
      if (ngang !== doc) cand.push(y * size + x); // đúng MỘT trục thông → là tường ngăn
    }
  }
  for (let i = cand.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [cand[i], cand[j]] = [cand[j], cand[i]];
  }
  for (let i = 0; i < Math.floor(cand.length * braid); i++) grid[cand[i]] = FLOOR;

  const m = { size, grid, seed };

  // ── Bước 3: xuất phát, cửa ra, các cửa khoá ──
  const start = { x: 1, y: 1 };
  const dStart = bfs(m, start.x, start.y);
  let far = -1,
    fi = -1;
  for (let i = 0; i < dStart.length; i++)
    if (dStart[i] > far) {
      far = dStart[i];
      fi = i;
    }
  const exit = { x: fi % size, y: (fi / size) | 0 };

  // Lấy mẫu điểm xa nhất: mỗi lần chọn ô CÁCH XA NHẤT mọi thứ đã đặt → cửa rải đều.
  const gates = [];
  let dMin = bfs(m, start.x, start.y);
  const dExit = bfs(m, exit.x, exit.y);
  for (let i = 0; i < dMin.length; i++)
    if (dMin[i] >= 0 && dExit[i] >= 0) dMin[i] = Math.min(dMin[i], dExit[i]);
  for (let g = 0; g < gateCount; g++) {
    let best = -1,
      bi = -1;
    for (let i = 0; i < dMin.length; i++)
      if (dMin[i] > best) {
        best = dMin[i];
        bi = i;
      }
    if (bi < 0 || best <= 0) break; // mê cung quá nhỏ so với số cửa yêu cầu
    const gx = bi % size,
      gy = (bi / size) | 0;
    gates.push({ x: gx, y: gy, id: g, loai: 'cua' });
    const d = bfs(m, gx, gy);
    for (let i = 0; i < dMin.length; i++)
      if (dMin[i] >= 0 && d[i] >= 0) dMin[i] = Math.min(dMin[i], d[i]);
  }

  // Ngõ cụt (chỉ 1 lối ra) — chỗ đặt xu/tim để thưởng cho việc chịu khó khám phá.
  const taken = new Set([
    start.y * size + start.x,
    exit.y * size + exit.x,
    ...gates.map((g) => g.y * size + g.x),
  ]);
  const deadEnds = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      if (grid[i] !== FLOOR || taken.has(i)) continue;
      let n = 0;
      for (const [dx, dy] of DIRS) if (grid[(y + dy) * size + (x + dx)] === FLOOR) n++;
      if (n === 1) deadEnds.push({ x, y });
    }
  }

  // Ô "?" THƯỞNG — đặt ở ngõ cụt XA điểm xuất phát nhất. Cố ý nằm ngoài đường đi chính:
  // nó không bắt buộc, phải chịu đi vòng mới lấy được, nên phần thưởng mới đáng.
  // Chọn các ngõ cụt xa nhất để việc đi vòng thật sự là một quyết định, không phải tiện tay.
  // Ưu tiên NGÕ CỤT XA NHẤT (phải đi vòng mới tới → phần thưởng mới đáng). Nhưng mê cung
  // nhỏ bị đục nhiều tường có khi KHÔNG CÒN ngõ cụt nào; lúc đó vẫn phải có ô "?", nếu
  // không thì cả tính năng biến mất tuỳ hạt giống. Thiếu thì bù bằng lấy mẫu điểm xa nhất.
  const bonus = [];
  const daDung = new Set([
    start.y * size + start.x,
    exit.y * size + exit.x,
    ...gates.map((g) => g.y * size + g.x),
  ]);
  const themThuong = (x, y) => {
    daDung.add(y * size + x);
    bonus.push({ x, y, id: 'b' + bonus.length, loai: 'thuong' });
  };
  for (const p of deadEnds
    .slice()
    .sort((a, b) => dStart[b.y * size + b.x] - dStart[a.y * size + a.x])) {
    if (bonus.length >= bonusCount) break;
    if (!daDung.has(p.y * size + p.x)) themThuong(p.x, p.y);
  }
  if (bonus.length < bonusCount) {
    let dm = null;
    for (const i of daDung) {
      const d = bfs(m, i % size, (i / size) | 0);
      if (!dm) dm = d;
      else for (let j = 0; j < dm.length; j++) if (d[j] >= 0) dm[j] = Math.min(dm[j], d[j]);
    }
    while (bonus.length < bonusCount) {
      let best = 0,
        bi = -1;
      for (let i = 0; i < dm.length; i++)
        if (!daDung.has(i) && dm[i] > best) ((best = dm[i]), (bi = i));
      if (bi < 0) break; // hết chỗ đặt — mê cung quá nhỏ
      themThuong(bi % size, (bi / size) | 0);
      const d = bfs(m, bi % size, (bi / size) | 0);
      for (let j = 0; j < dm.length; j++) if (d[j] >= 0) dm[j] = Math.min(dm[j], d[j]);
    }
  }
  // XU RƠI. Ngõ cụt còn lại (thưởng cho việc chịu khó khám phá) CỘNG THÊM xu rải dọc
  // hành lang. Chỉ đặt ở ngõ cụt là không đủ: mê cung nhỏ có khi không còn ngõ cụt nào
  // sau khi ô "?" lấy phần, thế là cả ván không nhặt được đồng nào.
  const coins = deadEnds.filter((p) => !daDung.has(p.y * size + p.x));
  coins.forEach((p) => daDung.add(p.y * size + p.x));
  const soXu = Math.max(6, Math.floor(size / 2));
  const oTrong = [];
  for (let i = 0; i < grid.length; i++) if (grid[i] === FLOOR && !daDung.has(i)) oTrong.push(i);
  for (let i = oTrong.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [oTrong[i], oTrong[j]] = [oTrong[j], oTrong[i]];
  }
  for (const i of oTrong) {
    if (coins.length >= soXu) break;
    coins.push({ x: i % size, y: (i / size) | 0 });
  }

  return {
    ...m,
    start,
    exit,
    gates,
    bonus,
    coins,
    deadEnds,
    isWall: (x, y) => x < 0 || y < 0 || x >= size || y >= size || grid[y * size + x] === WALL,
  };
}
