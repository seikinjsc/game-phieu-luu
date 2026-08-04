// render/maze3d.js — GÓC NHÌN NHẬP VAI, dựng bằng raycasting kiểu Wolfenstein 3D.
//
// VÌ SAO RAYCASTING CHỨ KHÔNG PHẢI WebGL (docs/ME-CUNG-3D.md §2): mê cung là lưới vuông góc,
// hành lang rộng đúng một ô, tường thẳng đứng, một tầng. Bộ dựng hình chỉ cần DUY NHẤT một
// phép hỏi thế giới — "ô này có phải tường không?" — mà `systems/maze.js` đã xuất sẵn
// `isWall(x, y)`. Không lưới tam giác, không shader, không thư viện. Đúng ràng buộc dự án.
//
// GIỚI HẠN ĐÃ BIẾT, chấp nhận có chủ ý: không ngước/cúi thật, không dốc, không nhiều tầng,
// không tường xiên. Mê cung vuông góc một tầng nên không hạn chế nào ở trên thực sự cản trở.
//
// LUẬT DI CHUYỂN KHÔNG ĐỔI (phương án A1). Nhân vật vẫn đi tâm ô sang tâm ô như bản nhìn từ
// trên xuống — `maze-run.js` không phải sửa một dòng nào. Tệp này CHỈ ĐỌC `run`, không bao
// giờ ghi. Góc nhìn `yaw` là thứ thuần tuý thị giác nên sống ở đây, không nhét vào lớp logic.

import { W, H, THANH_TREN } from '../ui/mecung-ui.js';
import { MAZE_SKINS, VIEW, drawMaze } from './maze.js';

export const FOV = 75; // độ. Dưới 75 là bắt đầu gây chóng mặt cho trẻ (§5.3)
const NUA_PLANE = Math.tan(((FOV / 2) * Math.PI) / 180);

// Bề rộng một cột dựng, tính bằng điểm ảnh LOGIC. 2 nghĩa là dựng ở nửa độ phân giải rồi
// để trình duyệt phóng lên — giảm nửa số lệnh vẽ mà mắt gần như không thấy khác.
// Đây là núm vặn hiệu năng đầu tiên nếu máy yếu: 2 → 3 là giảm thêm một phần ba.
export const COT = 2;

const KHUNG_Y = THANH_TREN; // đỉnh khung nhìn 3D, ngay dưới thanh thông tin
const KHUNG_H = H - THANH_TREN;
const GIUA = KHUNG_Y + KHUNG_H / 2;

const VAN_CO = 64; // cạnh ô vân, tính bằng điểm ảnh

// ── Vân tường: SINH BẰNG MÃ lúc chạy lần đầu ────────────────────────────────
// Ràng buộc dự án cấm tệp ảnh (CLAUDE.md §2.3), nên vân phải vẽ bằng lệnh Canvas vào một
// canvas ẩn. Sinh MỘT LẦN rồi dùng lại — sinh mỗi khung thì không có máy nào chịu nổi.
const kho = new Map(); // skinKey → [vân mặt bắc–nam, vân mặt đông–tây]

// Pha đậm/nhạt một màu #rrggbb. Dùng để tạo mạch vữa và mặt tường tối.
function pha(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
  const b = Math.min(255, Math.round((n & 255) * k));
  return `rgb(${r},${g},${b})`;
}

function taoVan(mau, sang) {
  const c = document.createElement('canvas');
  c.width = VAN_CO;
  c.height = VAN_CO;
  const g = c.getContext('2d');
  if (!g) return c; // môi trường không có DOM thật (harness test) — trả canvas rỗng
  g.fillStyle = mau;
  g.fillRect(0, 0, VAN_CO, VAN_CO);
  // Gạch xây so le: mạch ngang mỗi 16px, mạch dọc lệch nửa viên ở hàng lẻ.
  g.fillStyle = pha(mau, 0.62);
  for (let y = 0; y < VAN_CO; y += 16) {
    g.fillRect(0, y, VAN_CO, 2);
    const lech = (y / 16) % 2 ? 16 : 0;
    for (let x = 0; x < VAN_CO; x += 32) g.fillRect((x + lech) % VAN_CO, y, 2, 16);
  }
  // Vệt sáng mép trên mỗi viên → mắt đọc ra chiều dày, không phẳng lì.
  g.fillStyle = sang;
  g.globalAlpha = 0.28;
  for (let y = 2; y < VAN_CO; y += 16) g.fillRect(0, y, VAN_CO, 1);
  g.globalAlpha = 1;
  return c;
}

function vanCua(skinKey) {
  let v = kho.get(skinKey);
  if (!v) {
    const sk = MAZE_SKINS[skinKey] || MAZE_SKINS.khoivuong;
    // HAI BẢN ĐẬM NHẠT cho hai hướng mặt tường. Đây là mẹo chiếu sáng rẻ nhất của
    // raycasting: mặt quay theo trục này sáng, mặt quay theo trục kia tối, thế là góc
    // tường hiện ra rõ mà không tốn thêm một lệnh vẽ nào.
    v = [taoVan(sk.wall, sk.wallTop), taoVan(pha(sk.wall, 0.68), sk.wallTop)];
    kho.set(skinKey, v);
  }
  return v;
}

// ── Camera ──────────────────────────────────────────────────────────────────
// `run.facing` chỉ có bốn hướng và nhảy tức thì. Quay phắt 90° trong một khung làm người
// chơi mất phương hướng, nên góc nhìn phải ĐUỔI THEO hướng đó chứ không bám cứng vào nó.
// Kéo ngang hết bề ngang màn hình thì quay khoảng 150°, tức là hai lần góc nhìn. Nhạy hơn
// nữa là chỉ khẽ động tay đã quay tít, bé không ngắm nổi vào hành lang muốn đi.
export const DO_NHAY = (150 * Math.PI) / 180 / W;

// Bốn hướng đi được, chốt từ góc nhìn tự do. Nhân vật chỉ đi được bốn hướng (mô hình A1),
// nên nhìn chếch 30° vẫn phải quy về đúng một hướng — lấy hướng gần nhất.
export function huongNhin(yaw) {
  const g = Math.round(yaw / (Math.PI / 2)) & 3; // & 3 gói cả góc âm về 0..3
  return [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ][g];
}

export function makeCam(run) {
  let yaw = Math.atan2(run.facing.y, run.facing.x);
  // Người chơi vừa tự xoay → THÔI kéo về hướng nhân vật, nếu không thì vừa buông tay là
  // camera bật ngược lại chỗ cũ, coi như không nhìn quanh được.
  let tuDo = false;
  return {
    get yaw() {
      return yaw;
    },
    // Kéo chuột. Không kẹp góc: xoay tròn vô hạn, đúng như mọi game góc nhìn thứ nhất.
    xoay(d) {
      yaw += d;
      tuDo = true;
    },
    // Ra lệnh ĐI là camera bám lại hướng đi. Nhờ vậy nhìn quanh xong bấm đi một cái là mọi
    // thứ tự thẳng hàng lại, người chơi không bao giờ kẹt ở một góc nhìn chếch.
    bamTheo() {
      tuDo = false;
    },
    update(r, dt) {
      if (tuDo) return;
      const muc = Math.atan2(r.facing.y, r.facing.x);
      let d = muc - yaw;
      // Đi theo cung NGẮN NHẤT. Không có bước này thì quay từ 170° sang −170° sẽ chạy
      // ngược hết 340°, người chơi thấy màn hình xoay tít một vòng.
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      // Tiến 1 − e^(−k·dt): độc lập nhịp khung (máy nhanh và máy chậm quay hết một góc
      // trong cùng khoảng thời gian) và không bao giờ vọt quá đích.
      yaw += d * (1 - Math.exp(-12 * dt));
    },
  };
}

// ── Ảnh dán đứng (billboard) ────────────────────────────────────────────────
// Quái, cửa, rương, xu đều là ảnh phẳng luôn quay mặt về phía người chơi. Raycasting không
// dựng được vật thể khối, nhưng trong hành lang một ô thì mắt không phân biệt nổi — DOOM
// cũng vẽ hệt như vậy suốt cả trò chơi.
// VẼ BẰNG MÃ vào canvas ẩn, một lần lúc khởi động, đúng ràng buộc "không tệp ảnh".
const khoAnh = new Map();
const AC = 64; // cạnh ô ảnh dán

function tao(ve) {
  const c = document.createElement('canvas');
  c.width = c.height = AC;
  const g = c.getContext('2d');
  if (g) ve(g); // môi trường không có DOM thật (harness test) → trả canvas rỗng, không vỡ
  return c;
}

const tron = (g, x, y, rx, ry, mau) => {
  g.fillStyle = mau;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, 6.3);
  g.fill();
};

// CẤM NỘI DUNG ĐÁNG SỢ (CLAUDE.md §7). Ở góc nhìn nhập vai một con quái hiện ra trong hành
// lang tối đáng sợ hơn hẳn nhìn từ trên xuống, nên tạo hình phải tròn trịa, màu tươi, mắt to
// hiền — không răng nanh, không bóng tối trên mặt, không mắt đỏ.
const VE = {
  quai: (g) => {
    tron(g, 32, 57, 8, 5, '#7d2bb0'); // bóng dưới chân
    tron(g, 22, 52, 7, 6, '#8e33c8');
    tron(g, 42, 52, 7, 6, '#8e33c8');
    tron(g, 32, 34, 21, 23, '#b45cf0'); // thân
    tron(g, 32, 41, 13, 14, '#dbaaff'); // bụng sáng
    g.fillStyle = '#8e33c8'; // hai sừng nhỏ cho vui mắt
    for (const [x1, x2, x3] of [
      [17, 24, 28],
      [47, 40, 36],
    ]) {
      g.beginPath();
      g.moveTo(x1, 20);
      g.lineTo(x2, 8);
      g.lineTo(x3, 22);
      g.closePath();
      g.fill();
    }
    tron(g, 25, 30, 7.5, 8, '#fff'); // mắt to hiền
    tron(g, 40, 30, 7.5, 8, '#fff');
    tron(g, 26, 31, 3.4, 3.6, '#1a2130');
    tron(g, 41, 31, 3.4, 3.6, '#1a2130');
    tron(g, 27, 29, 1.3, 1.3, '#fff'); // đốm sáng trong mắt → nhìn có hồn, bớt vô cảm
    tron(g, 42, 29, 1.3, 1.3, '#fff');
  },

  // CỬA KHOÁ — chắn ngang hành lang, có dấu hỏi phát sáng. Sau luật "hết 3 lượt cửa vẫn
  // khoá", hình cánh cửa ĐÓNG lúc quay lưng đi chính là phản hồi mà bản 2D còn thiếu.
  cua: (g) => {
    g.fillStyle = '#3a2a18';
    g.fillRect(2, 2, 60, 62); // khung cửa
    g.fillStyle = '#8a5a2b';
    g.fillRect(6, 6, 52, 58); // cánh gỗ
    g.fillStyle = '#6d4520';
    for (let y = 12; y < 62; y += 12) g.fillRect(6, y, 52, 2); // vân ván
    g.fillStyle = '#ffb300'; // ô kính dấu hỏi
    g.fillRect(16, 14, 32, 30);
    g.fillStyle = '#4a2f00';
    g.font = '900 26px system-ui,sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('?', 32, 30);
    tron(g, 32, 54, 4, 4, '#2a1a0c'); // ổ khoá
    g.fillStyle = '#2a1a0c';
    g.fillRect(30, 54, 4, 7);
  },

  cuaMo: (g) => {
    g.fillStyle = '#3a2a18';
    g.fillRect(2, 2, 60, 62);
    g.fillStyle = '#141a24'; // cánh mở ra: chỉ còn khung và lối tối phía sau
    g.fillRect(8, 8, 48, 56);
    g.fillStyle = '#8a5a2b';
    g.fillRect(8, 8, 10, 56); // cánh gập sát mép
  },

  ruong: (g) => {
    g.fillStyle = '#6d4520';
    g.fillRect(10, 30, 44, 28); // thân rương
    g.fillStyle = '#8a5a2b';
    g.fillRect(10, 22, 44, 12); // nắp
    g.fillStyle = '#ffb300';
    g.fillRect(10, 33, 44, 3); // đai vàng
    g.fillStyle = '#4a2f00';
    g.font = '900 20px system-ui,sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('?', 32, 46);
  },

  // XU — đĩa vàng có ngôi sao nổi. Vừa khớp biểu tượng 🪙 trên thanh thông tin, vừa dễ
  // nhận ra ở xa hơn một đĩa trơn.
  xu: (g) => {
    tron(g, 32, 32, 20, 22, '#c98a12');
    tron(g, 32, 32, 16, 18, '#ffd257');
    g.fillStyle = '#c98a12';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 ? 5 : 11;
      g[i ? 'lineTo' : 'moveTo'](32 + Math.cos(a) * r, 32 + Math.sin(a) * r * 1.1);
    }
    g.closePath();
    g.fill();
  },

  raDong: (g) => {
    g.fillStyle = '#5a2020';
    g.fillRect(4, 4, 56, 60);
    g.fillStyle = '#8c3b3b';
    g.fillRect(9, 9, 46, 55);
    tron(g, 44, 38, 4, 4, '#e8c07a');
  },
  raMo: (g) => {
    g.fillStyle = '#14512f';
    g.fillRect(4, 4, 56, 60);
    g.fillStyle = '#3ddc84';
    g.fillRect(9, 9, 46, 55);
    g.fillStyle = '#0d3a20';
    g.font = '900 30px system-ui,sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('→', 32, 36);
  },
};

const anhCua = (ten) => {
  let a = khoAnh.get(ten);
  if (!a) khoAnh.set(ten, (a = tao(VE[ten])));
  return a;
};

// Bộ đệm ĐỘ SÂU: khoảng cách tới tường ở từng cột. Không có nó thì quái đứng sau tường vẫn
// hiện ra lù lù — lỗi kinh điển nhất của raycasting.
let zbuf = new Float32Array(0);

// ── Bắn một tia, thuật toán DDA ─────────────────────────────────────────────
// Nhảy từ mép ô sang mép ô nên số bước bằng số ô đi qua, không phụ thuộc độ phân giải.
function ban(maze, px, py, dx, dy) {
  let mx = Math.floor(px),
    my = Math.floor(py);
  const ddx = Math.abs(1 / dx),
    ddy = Math.abs(1 / dy); // dx = 0 → Infinity, trục đó không bao giờ tới lượt: đúng ý
  let sx, sy, bx, by;
  if (dx < 0) {
    sx = -1;
    bx = (px - mx) * ddx;
  } else {
    sx = 1;
    bx = (mx + 1 - px) * ddx;
  }
  if (dy < 0) {
    sy = -1;
    by = (py - my) * ddy;
  } else {
    sy = 1;
    by = (my + 1 - py) * ddy;
  }
  let mat = 0,
    buoc = 0;
  // Chặn 96 bước: mê cung to nhất 31×31 nên đường chéo chưa tới 62 ô. Thà thấy một cột
  // hỏng còn hơn treo cả vòng lặp game nếu có ngày mê cung sinh ra lỗi hở viền.
  while (buoc++ < 96) {
    if (bx < by) {
      bx += ddx;
      mx += sx;
      mat = 0;
    } else {
      by += ddy;
      my += sy;
      mat = 1;
    }
    if (maze.isWall(mx, my)) break;
  }
  // Khoảng cách VUÔNG GÓC với mặt phẳng chiếu, không phải khoảng cách thẳng tới tường —
  // lấy khoảng cách thẳng thì hành lang bị phình ra như mắt cá (hiệu ứng fisheye).
  return { kc: Math.max(0.0001, mat === 0 ? bx - ddx : by - ddy), mat };
}

// ── Vẽ một khung ────────────────────────────────────────────────────────────
export function drawMaze3D(ctx, run, cam, skinKey = 'khoivuong', sight = 99) {
  const sk = MAZE_SKINS[skinKey] || MAZE_SKINS.khoivuong;
  const { maze } = run;
  const van = vanCua(skinKey);

  const yaw = cam.yaw;
  const dirX = Math.cos(yaw),
    dirY = Math.sin(yaw);
  const planeX = -dirY * NUA_PLANE,
    planeY = dirX * NUA_PLANE;

  // Trần và sàn: DẢI MÀU CHUYỂN SẮC, không vẽ từng điểm ảnh. Vẽ sàn kiểu chiếu ngược
  // (floorcasting) tốn ~675 000 điểm ảnh mỗi khung — máy đích không chịu nổi (§5.1).
  const tran = ctx.createLinearGradient(0, KHUNG_Y, 0, GIUA);
  tran.addColorStop(0, pha(sk.bg, 1.6));
  tran.addColorStop(1, sk.bg);
  ctx.fillStyle = tran;
  ctx.fillRect(0, KHUNG_Y, W, KHUNG_H / 2);

  const san = ctx.createLinearGradient(0, GIUA, 0, KHUNG_Y + KHUNG_H);
  san.addColorStop(0, sk.bg);
  san.addColorStop(1, pha(sk.floor, 1.5));
  ctx.fillStyle = san;
  ctx.fillRect(0, GIUA, W, KHUNG_H / 2);

  // Tầm nhìn theo mức khó chuyển thẳng thành độ dày sương: mức Dễ (sight 99) sáng gần hết
  // mê cung, mức Khó (sight 4) chỉ thấy vài ô quanh mình. Kẹp 14 vì xa hơn thế thì mắt
  // cũng không phân biệt được nữa, mà để nguyên 99 thì mức Dễ không còn chiều sâu.
  const tam = Math.min(sight, 14);

  const cx = run.x,
    cy = run.y;
  const soCot = Math.ceil(W / COT);
  if (zbuf.length !== soCot) zbuf = new Float32Array(soCot);

  for (let i = 0; i < soCot; i++) {
    // −1 ở mép trái, +1 ở mép phải màn hình
    const camX = (2 * (i + 0.5)) / soCot - 1;
    const dx = dirX + planeX * camX,
      dy = dirY + planeY * camX;
    const h = ban(maze, cx, cy, dx, dy);
    zbuf[i] = h.kc; // ghi độ sâu TRƯỚC mọi phép cắt — ảnh dán cần đúng khoảng cách tường

    const cao = KHUNG_H / h.kc;
    let dinh = GIUA - cao / 2;
    // Cắt phần tràn ra ngoài khung nhìn TRƯỚC khi vẽ, và cắt cả trên ảnh gốc theo đúng tỉ
    // lệ — không thì đứng sát tường sẽ vẽ một cột cao 3000px, phần lớn nằm ngoài màn hình.
    let sTop = 0,
      sCao = VAN_CO;
    if (dinh < KHUNG_Y) {
      const bo = (KHUNG_Y - dinh) / cao;
      sTop = bo * VAN_CO;
      sCao -= sTop;
      dinh = KHUNG_Y;
    }
    let cuoi = GIUA + cao / 2;
    if (cuoi > KHUNG_Y + KHUNG_H) {
      const bo = (cuoi - (KHUNG_Y + KHUNG_H)) / cao;
      sCao -= bo * VAN_CO;
      cuoi = KHUNG_Y + KHUNG_H;
    }
    if (sCao <= 0 || cuoi <= dinh) continue;

    // Toạ độ ngang trên vân: điểm tia chạm, lấy phần lẻ trong ô.
    const cham = h.mat === 0 ? cy + h.kc * dy : cx + h.kc * dx;
    let tx = Math.floor((cham - Math.floor(cham)) * VAN_CO);
    if (tx < 0) tx = 0;
    else if (tx >= VAN_CO) tx = VAN_CO - 1;

    ctx.drawImage(van[h.mat], tx, sTop, 1, sCao, i * COT, dinh, COT, cuoi - dinh);

    // Sương phủ theo khoảng cách. Mũ 1,35 để chỗ gần trong trẻo hẳn rồi mới tối nhanh về xa
    // — tuyến tính thì cả hành lang xám đều một màu, mất hết chiều sâu.
    const mo = Math.min(0.9, Math.pow(h.kc / tam, 1.35));
    if (mo > 0.03) {
      ctx.globalAlpha = mo;
      ctx.fillStyle = sk.bg;
      ctx.fillRect(i * COT, dinh, COT, cuoi - dinh);
      ctx.globalAlpha = 1;
    }
  }

  veVatThe(ctx, run, { cx, cy, dirX, dirY, planeX, planeY, tam, soCot });
}

// ── Lượt vẽ VẬT THỂ ─────────────────────────────────────────────────────────
// Gom mọi thứ nhìn thấy được, xếp XA TRƯỚC GẦN SAU rồi mới vẽ. Không xếp thì con quái ở xa
// vẽ sau sẽ đè lên cái rương ở gần, nhìn lộn ngược chiều sâu ngay lập tức.
function veVatThe(ctx, run, o) {
  const { maze } = run;
  const ds = [];
  const them = (x, y, ten, k, nang) => {
    // Đưa về hệ toạ độ camera. `sau` là khoảng cách theo hướng nhìn — cũng chính là thứ
    // đem so với bộ đệm độ sâu của tường.
    const ex = x - o.cx,
      ey = y - o.cy;
    const det = o.planeX * o.dirY - o.dirX * o.planeY;
    if (!det) return;
    const inv = 1 / det;
    const ngang = inv * (o.dirY * ex - o.dirX * ey);
    const sau = inv * (o.planeX * ey - o.planeY * ex);
    if (sau <= 0.15 || sau > o.tam + 1) return; // sau lưng, hoặc đã chìm hẳn vào sương
    ds.push({ ngang, sau, ten, k, nang });
  };

  for (const q of run.quai) if (q.song) them(q.x, q.y, 'quai', 0.78, 0);
  for (const g of maze.gates) them(g.x + 0.5, g.y + 0.5, run.isOpen(g.id) ? 'cuaMo' : 'cua', 1, 0);
  for (const b of maze.bonus) if (!run.isOpen(b.id)) them(b.x + 0.5, b.y + 0.5, 'ruong', 0.5, 0);
  for (const p of maze.coins)
    if (run.hasCoin(p.y * maze.size + p.x))
      // Lơ lửng và dập dềnh theo thời gian — đứng yên trên sàn thì lẫn vào nền, khó thấy.
      them(p.x + 0.5, p.y + 0.5, 'xu', 0.32, 0.32 + 0.05 * Math.sin(run.time * 3));
  them(maze.exit.x + 0.5, maze.exit.y + 0.5, run.keys >= run.needKeys ? 'raMo' : 'raDong', 1, 0);

  ds.sort((a, b) => b.sau - a.sau);
  for (const v of ds) veAnhDan(ctx, v, o);
}

function veAnhDan(ctx, v, o) {
  const anh = anhCua(v.ten);
  const h = KHUNG_H / v.sau; // chiều cao MỘT Ô trên màn hình ở khoảng cách này
  const giua = W / 2 + (W / 2) * (v.ngang / v.sau);
  const caoPx = h * v.k;
  const rong = caoPx * (anh.width / anh.height);
  const day = GIUA + h / 2 - h * v.nang; // mép dưới vật, tính từ mặt sàn
  const dinh = day - caoPx;
  const trai = giua - rong / 2;

  // Mờ dần theo khoảng cách y như tường, để vật thể chìm vào sương cùng nhịp với hành lang.
  ctx.globalAlpha = Math.max(0, 1 - Math.pow(v.sau / o.tam, 1.35));
  if (ctx.globalAlpha < 0.04) return void (ctx.globalAlpha = 1);

  // Vẽ theo TỪNG CỘT để so được với bộ đệm độ sâu — cột nào có tường gần hơn thì bỏ, nhờ
  // vậy vật thể bị tường che đúng một nửa thay vì hiện nguyên hình đè lên tường.
  const tu = Math.max(0, Math.floor(trai / COT)),
    den = Math.min(o.soCot, Math.ceil((trai + rong) / COT));
  const sRong = (COT / rong) * anh.width;
  for (let i = tu; i < den; i++) {
    if (v.sau >= zbuf[i]) continue;
    const sx = ((i * COT - trai) / rong) * anh.width;
    if (sx < 0 || sx >= anh.width) continue;
    ctx.drawImage(anh, sx, 0, sRong, anh.height, i * COT, dinh, COT, caoPx);
  }
  ctx.globalAlpha = 1;
}

// ── Bấm vào thế giới 3D để đi ───────────────────────────────────────────────
// Chia khung nhìn làm bốn vùng và quy về hướng TƯƠNG ĐỐI với hướng đang nhìn, không phải
// theo trục bản đồ: bấm bên trái màn hình là rẽ trái SO VỚI MÌNH, đúng như mắt đang thấy.
// Quy theo trục bản đồ thì quay lưng lại là mọi thứ đảo ngược, không ai chơi nổi.
export const VUNG_TRAI = 300; // x < 300 → rẽ trái
export const VUNG_PHAI = 600; // x > 600 → rẽ phải
export const VUNG_LUI = 520; // ở giữa mà bấm thấp → quay lại

// Đổi dấu mà KHÔNG sinh ra −0. `-0` chạy vẫn đúng nhưng khác `0` khi so sâu, nên nó lẻn
// vào bản lưu ván và vào phép so trong test rồi báo sai ở chỗ chẳng liên quan gì.
const am = (v) => -v || 0;

// Trục màn hình có y hướng XUỐNG, nên quay trái 90° là (x,y) → (y,−x). Nhầm dấu ở đây là
// bấm trái thì đi phải, mà nhìn code thì không thấy sai — chỉ chơi mới biết. Có test canh.
// Bốn hướng TƯƠNG ĐỐI với hướng đang nhìn. Một nguồn duy nhất cho cả chuột lẫn bàn phím —
// tách đôi là có ngày bấm phím trái đi một đằng, bấm chuột bên trái đi một nẻo.
export function huongTuongDoi(f) {
  const fx = f.x || 0,
    fy = f.y || 0;
  return {
    thang: { x: fx, y: fy },
    lui: { x: am(fx), y: am(fy) },
    trai: { x: fy, y: am(fx) },
    phai: { x: am(fy), y: fx },
  };
}

export function huongTuDiemBam(p, f) {
  const r = huongTuongDoi(f);
  if (p.x < VUNG_TRAI) return r.trai;
  if (p.x > VUNG_PHAI) return r.phai;
  if (p.y > VUNG_LUI) return r.lui;
  return r.thang;
}

// Gợi ý bốn vùng bấm. BẮT BUỘC PHẢI VẼ: vùng bấm vô hình thì với trẻ con coi như không tồn
// tại. Hướng nào là tường thì mờ hẳn đi — nhìn là biết đi được hay không, khỏi bấm thử.
export function veHuongBam(ctx, run, cam) {
  // Lấy theo GÓC NHÌN, không theo hướng nhân vật: đang kéo chuột nhìn quanh thì mũi tên
  // phải đổi theo mắt, nếu không bấm "tiến" sẽ đi về phía chẳng liên quan gì tới thứ đang thấy.
  const f = huongNhin(cam.yaw),
    c = run.cell;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 34px system-ui,sans-serif';
  ctx.fillStyle = '#e8eef7';
  // HÌNH MŨI TÊN VẼ THEO MẮT, cố định theo màn hình: ▲ luôn là tiến, ◀ luôn là quay trái,
  // bất kể đang nhìn hướng nào. Nhờ vậy nó khớp với bàn phím (↑ tiến, ← quay trái) và người
  // chơi không phải nhẩm quy đổi gì cả.
  // ĐÁNH ĐỔI ĐÃ BIẾT: nhìn bản đồ nhỏ thấy cần đi lên thì phải tự nhẩm "lên là bên nào so
  // với mình". Đổi lại được sự nhất quán tuyệt đối giữa mắt, tay và bàn phím.
  for (const [ch, x, y] of [
    ['◀', 46, GIUA],
    ['▶', W - 46, GIUA],
    ['▲', W / 2, KHUNG_Y + 56],
    ['▼', W / 2, KHUNG_Y + KHUNG_H - 34],
  ]) {
    // Độ mờ vẫn lấy hướng THẬT (bằng chính hàm bắt chuột, tại chính chỗ vẽ) — hướng nào là
    // tường thì mờ hẳn, nhìn là biết đi được hay không.
    const d = huongTuDiemBam({ x, y }, f);
    ctx.globalAlpha = run.maze.isWall(c.x + d.x, c.y + d.y) ? 0.1 : 0.4;
    ctx.fillText(ch, x, y);
  }
  ctx.restore();
}

// ── Bản đồ nhỏ ở góc ────────────────────────────────────────────────────────
// DÙNG LẠI NGUYÊN hàm vẽ 2D, chỉ thu nhỏ và cắt gọn. Ở góc nhìn nhập vai người chơi mất
// cái nhìn tổng thể; với bé 6 tuổi thì bản đồ này không phải trang trí mà là trợ năng (§5.2).
export const BAN_DO_K = 0.3;

// Điểm trên canvas rơi vào ô nào của bản đồ nhỏ? Trả null nếu bấm ra ngoài bản đồ.
// Ở góc nhìn nhập vai đây là ĐƯỜNG DUY NHẤT để bấm-chọn-ô: toạ độ khung 2D (`VIEW`) không
// còn ý nghĩa gì nữa, quy đổi qua nó sẽ ra một ô bừa nằm đâu đó trong mê cung.
export function oTuBanDo(p, size, k = BAN_DO_K) {
  const s = VIEW.s * k;
  const mx = W - s - 12,
    my = H - s - 12;
  if (p.x < mx || p.y < my || p.x >= mx + s || p.y >= my + s) return null;
  const u = s / size;
  return { x: Math.floor((p.x - mx) / u), y: Math.floor((p.y - my) / u) };
}

export function veBanDoNho(ctx, run, skinKey = 'khoivuong', sight = 99, k = BAN_DO_K) {
  const s = VIEW.s * k;
  const mx = W - s - 12,
    my = H - s - 12;
  ctx.save();
  // Cắt TRƯỚC khi thu nhỏ: drawMaze tô nền kín cả khung 900×640, không cắt thì nó phủ
  // đè lên toàn bộ khung nhìn 3D vừa dựng xong.
  ctx.beginPath();
  ctx.rect(mx - 5, my - 5, s + 10, s + 10);
  ctx.clip();
  ctx.translate(mx - VIEW.x * k, my - VIEW.y * k);
  ctx.scale(k, k);
  drawMaze(ctx, run, skinKey, sight);
  ctx.restore();
}
