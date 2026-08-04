// render/maze.js — vẽ mê cung. Mọi hình bằng lệnh Canvas, không tệp ảnh (ràng buộc #3).
// Nhận `ctx` làm tham số đầu như các mô-đun render khác → test được bằng ctx giả.
//
// Bố cục trên canvas logic 900×640 của TRANG MÊ CUNG (khác 900×500 của game chạy vượt
// chướng ngại — trang này độc lập, và mê cung vuông nên cần khung cao hơn):
//   [ 0 .. 52 ]   thanh thông tin phủ trên đỉnh (tim, chìa, xu, giờ, nút)
//   [ 60 .. 628 ] khung mê cung vuông 568×568, canh giữa — CHIẾM GẦN HẾT màn hình
// Nguyên tắc lấy từ game Phiêu Lưu: sân chơi là chính, số liệu là phụ và nằm đè lên.

import { rr } from './layers.js';
import { MAU, NAVY, nutCauHoi, W, H, THANH_TREN, MENU_Y, COT } from '../ui/mecung-ui.js';

// Nút kiểu game Phiêu Lưu: viên thuốc, chữ đậm, BÓNG ĐỔ KHỐI phía dưới (0 4px 0).
// `nhan` đè lên b.nhan khi cần. Nút đang bấm thì lún xuống, đúng cảm giác nút thật.
// BỌC TRONG save/restore. Trước đây hàm này kết thúc bằng `textAlign = 'left'` — tức là
// nó ĐỔI TRẠNG THÁI CỦA NGƯỜI GỌI. Hậu quả: mọi dòng chữ vẽ SAU nút đều bị canh trái,
// chữ chạy từ giữa màn hình sang phải và đè lên nút. Hàm vẽ không được để lại dấu vết.
export function drawButton(ctx, b, { lun = false } = {}) {
  const [mat, bong] = MAU[b.mau] || MAU.xam;
  const dy = lun ? 3 : 0;
  const day = lun ? 1 : 4;
  const r = Math.min(b.h / 2, 26);
  ctx.save();
  ctx.globalAlpha = b.tat ? 0.35 : 1;
  ctx.fillStyle = bong; // khối bóng dưới đáy
  rr(ctx, b.x, b.y + dy + day, b.w, b.h, r);
  ctx.fill();
  ctx.fillStyle = b.chon ? MAU.vang[0] : mat; // đang chọn thì đổi sang vàng
  rr(ctx, b.x, b.y + dy, b.w, b.h, r);
  ctx.fill();
  ctx.fillStyle = b.mau === 'trang' || b.chon ? NAVY : '#fff';
  ctx.font = `900 ${b.lon ? 26 : 19}px system-ui,sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.nhan, b.x + b.w / 2, b.y + dy + b.h / 2 + 1);
  ctx.restore();
}

export function drawButtons(ctx, nut, dangBam) {
  for (const b of nut) drawButton(ctx, b, { lun: b.id === dangBam });
}

// Ngắt một câu thành nhiều dòng vừa bề ngang `rong`, đo bằng phông ĐANG đặt trên ctx.
// Đây là thứ bắt buộc phải có: co cỡ chữ thôi thì câu dài vẫn tràn ra ngoài mép.
// Từ nào dài hơn cả dòng (hiếm — địa danh, công thức) thì để tràn còn hơn cắt đôi chữ.
export function ngatDong(ctx, chu, rong) {
  const tu = String(chu).split(/\s+/).filter(Boolean);
  const dong = [];
  let d = '';
  for (const t of tu) {
    const thu = d ? d + ' ' + t : t;
    if (d && ctx.measureText(thu).width > rong) {
      dong.push(d);
      d = t;
    } else d = thu;
  }
  if (d) dong.push(d);
  return dong.length ? dong : [''];
}

// Mê cung chiếm GẦN HẾT khung, canh giữa. Thông tin gom vào thanh phủ trên đỉnh thay vì
// bảng bên phải: bảng bên phải ăn mất 390 điểm ảnh bề ngang mà chỉ để hiện mấy con số.
export const VIEW = { x: (W - 568) / 2, y: THANH_TREN + 8, s: 568 };

// Bảng màu theo phiên bản. Thêm phiên bản = thêm một mục, không sửa hàm vẽ.
export const MAZE_SKINS = {
  khoivuong: {
    n: '🟫 Xứ Khối Vuông',
    bg: '#151b26',
    wall: '#5a7a3e',
    wallTop: '#79a052',
    floor: '#2b3242',
    hero: '#7ec8ff',
    r: 0.12,
  },
  phuchu: {
    n: '🟣 Học Viện Phù Chú',
    bg: '#14101f',
    wall: '#4a3a6e',
    wallTop: '#6a55a9',
    floor: '#241d38',
    hero: '#ffd35c',
    r: 0.35,
  },
  khobau: {
    n: '🟠 Quần Đảo Kho Báu',
    bg: '#0e1a24',
    wall: '#2f6d7a',
    wallTop: '#43929f',
    floor: '#16303c',
    hero: '#ffca6b',
    r: 0.3,
  },
};

// Ô nào được vẽ sáng / mờ / không vẽ. Trả 0 chưa thấy · 1 đã thấy (mờ) · 2 đang trong tầm nhìn.
function visOf(run, x, y, sight) {
  const c = run.cell;
  if (sight >= 99) return 2;
  if (Math.abs(x - c.x) <= sight && Math.abs(y - c.y) <= sight) return 2;
  return run.seen[y * run.maze.size + x] ? 1 : 0;
}

export function drawMaze(ctx, run, skinKey = 'khoivuong', sight = 99) {
  const sk = MAZE_SKINS[skinKey] || MAZE_SKINS.khoivuong;
  const { maze } = run;
  const n = maze.size;
  const u = VIEW.s / n; // cạnh một ô, tính bằng điểm ảnh logic
  // HAI TRỤC LỆCH NHAU: khung mê cung canh giữa theo chiều ngang nhưng bắt đầu ngay dưới
  // thanh thông tin theo chiều dọc. Dùng chung một hàm cho cả hai trục là lệch cả bản vẽ.
  const px = (v) => VIEW.x + v * u; // trục NGANG
  const py = (v) => VIEW.y + v * u; // trục DỌC

  ctx.fillStyle = sk.bg;
  ctx.fillRect(0, 0, W, H);

  // Nền khung mê cung
  ctx.fillStyle = '#0a0d14';
  rr(ctx, VIEW.x - 4, VIEW.y - 4, VIEW.s + 8, VIEW.s + 8, 10);
  ctx.fill();

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = visOf(run, x, y, sight);
      if (!v) continue;
      ctx.globalAlpha = v === 2 ? 1 : 0.32; // đã đi qua nhưng ngoài tầm nhìn → mờ đi
      if (maze.isWall(x, y)) {
        ctx.fillStyle = sk.wall;
        rr(ctx, px(x), py(y), u, u, u * sk.r);
        ctx.fill();
        ctx.fillStyle = sk.wallTop; // vệt sáng trên đỉnh cho khối có chiều dày
        ctx.fillRect(px(x) + u * 0.14, py(y) + u * 0.1, u * 0.72, u * 0.16);
      } else {
        ctx.fillStyle = sk.floor;
        ctx.fillRect(px(x), py(y), u + 0.5, u + 0.5);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Xu ở ngõ cụt
  for (const p of maze.coins) {
    if (!run.hasCoin(p.y * n + p.x) || !visOf(run, p.x, p.y, sight)) continue;
    ctx.fillStyle = '#ffd257';
    ctx.beginPath();
    ctx.arc(px(p.x) + u / 2, py(p.y) + u / 2, u * 0.19, 0, 6.3);
    ctx.fill();
  }

  // Ô "?" THƯỞNG — hình tròn vàng có dấu hỏi. Đã lấy rồi thì xỉn hẳn đi.
  for (const b of maze.bonus) {
    if (!visOf(run, b.x, b.y, sight)) continue;
    const roi = run.isOpen(b.id);
    const cx0 = px(b.x) + u / 2,
      cy0 = py(b.y) + u / 2;
    ctx.fillStyle = roi ? '#3d4a5c' : '#ffb300';
    ctx.beginPath();
    ctx.arc(cx0, cy0, u * 0.36, 0, 6.3);
    ctx.fill();
    if (!roi) {
      ctx.fillStyle = '#4a2f00';
      ctx.font = `900 ${Math.round(u * 0.5)}px system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', cx0, cy0 + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }

  // Cửa khoá — đã mở thì xỉn đi, chưa mở thì sáng và có số
  for (const g of maze.gates) {
    if (!visOf(run, g.x, g.y, sight)) continue;
    const mo = run.isOpen(g.id);
    ctx.fillStyle = mo ? '#3d4a5c' : '#ff7a59';
    ctx.save();
    ctx.translate(px(g.x) + u / 2, py(g.y) + u / 2);
    ctx.rotate(Math.PI / 4);
    rr(ctx, -u * 0.3, -u * 0.3, u * 0.6, u * 0.6, u * 0.12);
    ctx.fill();
    ctx.restore();
    if (!mo && u > 15) {
      ctx.fillStyle = '#2a1206';
      ctx.font = `bold ${Math.round(u * 0.44)}px system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(g.id + 1), px(g.x) + u / 2, py(g.y) + u / 2 + 1);
    }
  }

  // Cửa ra — đỏ khi còn thiếu chìa, xanh khi đã mở được
  if (visOf(run, maze.exit.x, maze.exit.y, sight)) {
    const san = run.keys >= run.needKeys;
    ctx.fillStyle = san ? '#3ddc84' : '#8c3b3b';
    rr(ctx, px(maze.exit.x) + u * 0.12, py(maze.exit.y) + u * 0.08, u * 0.76, u * 0.84, u * 0.14);
    ctx.fill();
    ctx.fillStyle = san ? '#0d3a20' : '#e8c07a';
    ctx.beginPath();
    ctx.arc(px(maze.exit.x) + u * 0.66, py(maze.exit.y) + u * 0.5, u * 0.08, 0, 6.3);
    ctx.fill();
  }

  // LA BÀN — vòng tròn nhấp nháy đặt THẲNG TRÊN mục tiêu cần tới (cửa khoá gần nhất,
  // hoặc cửa ra khi đã đủ chìa). Trước đây la bàn vẽ thành mũi tên cạnh nhân vật, đâm ra
  // xung đột với mũi tên chỉ hướng nhìn: hai mũi tên chỉ hai đằng, người chơi rối.
  // Nay hai thứ hai kiểu ký hiệu khác hẳn nhau: vòng tròn = "đích ở đây", mũi tên = "đang nhìn lối này".
  const g = run.goal && run.goal();
  if (g && visOf(run, g.x, g.y, sight)) {
    const nhip = 1 + 0.12 * Math.sin(run.time * 4);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#ffd257';
    ctx.lineWidth = Math.max(2, u * 0.1);
    ctx.beginPath();
    ctx.arc(px(g.x) + u / 2, py(g.y) + u / 2, u * 0.46 * nhip, 0, 6.3);
    ctx.stroke();
    ctx.restore();
  }

  // MŨI TÊN HƯỚNG NHÌN — đuôi đứt khúc, gắn liền với nhân vật, chỉ đúng hướng vừa bấm.
  // Dùng `run.facing` chứ KHÔNG dùng `run.dir`: dir về null mỗi khi đứng ở tâm ô, vẽ theo
  // nó thì nhân vật cứ dừng lại là quay mặt về bên phải.
  const f = run.facing || { x: 1, y: 0 };
  {
    const hx0 = px(run.x),
      hy0 = py(run.y);
    // Ngắn lại khi trước mặt là tường, để mũi tên không đâm xuyên vào khối tường.
    const c = run.cell;
    const vuong = run.maze.isWall(c.x + f.x, c.y + f.y);
    const dai = u * (vuong ? 0.62 : 1.0);
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#8fe3ff';
    ctx.fillStyle = '#8fe3ff';
    ctx.lineWidth = Math.max(2, u * 0.09);
    ctx.lineCap = 'round';
    ctx.setLineDash([u * 0.13, u * 0.12]);
    ctx.beginPath();
    ctx.moveTo(hx0 + f.x * u * 0.34, hy0 + f.y * u * 0.34);
    ctx.lineTo(hx0 + f.x * (dai - u * 0.22), hy0 + f.y * (dai - u * 0.22));
    ctx.stroke();
    ctx.setLineDash([]);
    const s = u * 0.22;
    const tx = hx0 + f.x * dai,
      ty = hy0 + f.y * dai;
    ctx.beginPath();
    ctx.moveTo(tx + f.x * s, ty + f.y * s);
    ctx.lineTo(tx - f.x * s * 0.5 - f.y * s * 0.8, ty - f.y * s * 0.5 + f.x * s * 0.8);
    ctx.lineTo(tx - f.x * s * 0.5 + f.y * s * 0.8, ty - f.y * s * 0.5 - f.x * s * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // QUÁI — thân tròn, hai mắt, một hàng răng cưa. Cố ý vẽ ngộ nghĩnh chứ không đáng sợ
  // (CLAUDE.md mục 7: người chơi là trẻ nhỏ). Máu còn lại hiện bằng vạch nhỏ trên đầu.
  for (const q of run.quai || []) {
    if (!q.song || !visOf(run, q.cx, q.cy, sight)) continue;
    const qx = px(q.x),
      qy = py(q.y);
    ctx.fillStyle = '#c94f7c';
    ctx.beginPath();
    ctx.arc(qx, qy, u * 0.34, Math.PI, 0);
    ctx.lineTo(qx + u * 0.34, qy + u * 0.3);
    for (let i = 0; i < 4; i++) {
      // viền răng cưa dưới đáy
      ctx.lineTo(qx + u * (0.34 - (i + 0.5) * 0.17), qy + u * (i % 2 ? 0.3 : 0.16));
    }
    ctx.lineTo(qx - u * 0.34, qy + u * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(qx + s * u * 0.13, qy - u * 0.06, u * 0.09, 0, 6.3);
      ctx.fill();
    }
    ctx.fillStyle = '#2a0d18';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(qx + s * u * 0.13, qy - u * 0.06, u * 0.045, 0, 6.3);
      ctx.fill();
    }
    if (q.mau < q.mauToiDa) {
      ctx.fillStyle = '#2b3242';
      ctx.fillRect(qx - u * 0.3, qy - u * 0.48, u * 0.6, u * 0.09);
      ctx.fillStyle = '#3ddc84';
      ctx.fillRect(qx - u * 0.3, qy - u * 0.48, u * 0.6 * (q.mau / q.mauToiDa), u * 0.09);
    }
  }

  // Nhân vật — vẽ ở vị trí thực (số thực) nên chuyển động mượt, không giật theo ô
  const hx = px(run.x),
    hy = py(run.y);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  // Nhấp nháy trong lúc bất tử sau khi trúng đòn — báo cho bé biết đang tạm an toàn.
  if (run.batTu) ctx.globalAlpha = 0.45 + 0.4 * Math.abs(Math.sin(run.time * 14));
  ctx.fillStyle = sk.hero;
  ctx.beginPath();
  ctx.arc(hx, hy, u * 0.33, 0, 6.3);
  ctx.fill();
  ctx.restore();
  // Hai mắt nhìn CÙNG hướng với mũi tên — dùng chung `f`, không thể lệch nhau nữa.
  ctx.fillStyle = '#10161f';
  for (const s of [-1, 1]) {
    const ex = hx + f.x * u * 0.11 + (f.x ? 0 : s * u * 0.12);
    const ey = hy + f.y * u * 0.11 + (f.y ? 0 : s * u * 0.12);
    ctx.beginPath();
    ctx.arc(ex, ey, u * 0.055, 0, 6.3);
    ctx.fill();
  }
}

const chuoiGio = (t) => {
  const s = Math.max(0, Math.floor(t));
  return `${String((s / 60) | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// Vẽ một "chip" thông tin: nhãn nhỏ + giá trị đậm, trên nền bo tròn. Trả bề ngang đã dùng
// để chip sau nối tiếp — nhờ vậy các chip không bao giờ đè nhau dù nội dung dài ngắn khác nhau.
function chip(ctx, x, nhan, giatri, mau) {
  // Đo bề ngang THẬT của chữ để chip co giãn theo nội dung — "HẾT GIỜ" rộng gấp ba "0/3".
  ctx.font = '900 17px system-ui,sans-serif';
  const wGiaTri = ctx.measureText(giatri).width;
  ctx.font = '15px system-ui,sans-serif';
  const w = 16 + ctx.measureText(nhan).width + 8 + wGiaTri + 10;
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  rr(ctx, x, 8, w, 36, 12);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '15px system-ui,sans-serif';
  ctx.fillStyle = '#8fa2bd';
  ctx.fillText(nhan, x + 10, 26);
  const wNhan = ctx.measureText(nhan).width;
  ctx.font = '900 17px system-ui,sans-serif';
  ctx.fillStyle = mau;
  ctx.fillText(giatri, x + 10 + wNhan + 8, 26);
  ctx.textBaseline = 'alphabetic';
  return w + 8;
}

export function drawHud(ctx, run, cfg, nhanCap, vi) {
  // THANH THÔNG TIN phủ trên đỉnh — thông tin là phụ, mê cung mới là chính.
  ctx.fillStyle = 'rgba(8,11,18,.72)';
  ctx.fillRect(0, 0, W, THANH_TREN);

  let x = 12;
  // Tim vẽ trước, sát mép trái — đây là thứ cần liếc thấy nhanh nhất khi bị quái đuổi.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '17px system-ui,sans-serif';
  for (let i = 0; i < run.timToiDa; i++) {
    ctx.globalAlpha = i < run.tim ? 1 : 0.22;
    ctx.fillText('❤️', x + i * 21, 27);
  }
  ctx.globalAlpha = 1;
  x += run.timToiDa * 21 + 10;

  const conGio = run.left !== Infinity;
  x += chip(
    ctx,
    x,
    '🔑',
    `${run.keys}/${run.needKeys}`,
    run.keys >= run.needKeys ? '#3ddc84' : '#ffd257',
  );
  x += chip(ctx, x, '🪙', String(run.coins), '#ffd257');
  x += chip(
    ctx,
    x,
    conGio ? '⏳' : '⏱',
    run.timeUp ? 'HẾT GIỜ' : conGio ? chuoiGio(run.left) : chuoiGio(run.time),
    run.timeUp ? '#ff7a59' : conGio && run.left < 60 ? '#ffb300' : '#e8eef7',
  );
  if (vi) x += chip(ctx, x, '💰', String(vi.xu), '#ffd257');

  // Mức + lớp nằm sát dưới thanh, chữ nhỏ — thông tin tham chiếu, không cần nổi bật.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '13px system-ui,sans-serif';
  ctx.fillStyle = '#7b8798';
  ctx.fillText(`${cfg.n} · 📘 ${nhanCap || ''}`, 12, THANH_TREN + 16);
  ctx.textAlign = 'right';
  ctx.fillText(
    run.keys >= run.needKeys ? 'Đủ chìa — tìm cửa xanh!' : 'PHÍM CÁCH chém · bấm ô để đi',
    W - 12,
    THANH_TREN + 16,
  );
  ctx.textAlign = 'left';
}

// Màn CỬA HÀNG — mua vũ khí bằng xu tích luỹ.
export function drawShop(ctx, mon, nut, viXu, dangBam) {
  ctx.fillStyle = 'rgba(8,11,18,.94)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8eef7';
  ctx.font = '900 34px system-ui,sans-serif';
  ctx.fillText('🛒 Cửa hàng', W / 2, 62);
  ctx.fillStyle = '#ffd257';
  ctx.font = '900 20px system-ui,sans-serif';
  ctx.fillText(`💰 ${viXu} xu`, W / 2, 96);

  ctx.textAlign = 'left';
  ctx.font = '13px system-ui,sans-serif';
  for (const m of mon) {
    const b = nut.find((n) => n.id === 'mua_' + m.id);
    if (!b) continue;
    ctx.fillStyle = m.daCo ? '#3ddc84' : viXu >= m.gia ? '#93a3b8' : '#6b7280';
    ctx.fillText(m.mo, b.x + 8, b.y + b.h + 16);
  }
  drawButtons(ctx, nut, dangBam);
  ctx.textAlign = 'left';
}

// Màn hình CÂU HỎI ở cửa khoá.
//   cau   {q, a[4], k, why} từ bộ sinh câu
//   sai   danh sách chỉ số đã chọn sai
//   loiGiai  true khi đã sai 3 lần → hiện đáp án + lời giải, và vẫn cho qua
// Màn CHỌN — hai trục hiện thành hai khối riêng, mỗi khối có nút bấm được.
export function drawMenu(ctx, st, nut, dangBam) {
  ctx.fillStyle = 'rgba(8,11,18,.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';

  const Y = MENU_Y;

  // KHUNG NHÓM cho mục ② — bộ đề + cấp độ + mô tả là MỘT lựa chọn, không phải ba thứ rời.
  // Vẽ trước mọi thứ khác để nằm dưới cùng.
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  rr(ctx, COT.x - 16, Y.nhan2 - 22, COT.w + 32, Y.moBoDe - Y.nhan2 + 36, 18);
  ctx.fill();

  ctx.fillStyle = '#e8eef7';
  ctx.font = '900 32px system-ui,sans-serif';
  ctx.fillText('🧭 Mê Cung Tri Thức', W / 2, Y.tieuDe);

  // Nhãn mục: chữ nhỏ, mờ, viết hoa — là nhãn hướng dẫn chứ không phải tiêu đề, để nút
  // mới là thứ nổi bật. Bản trước dùng chữ đậm 17px màu xanh sáng nên tranh chỗ với nút.
  const nhanMuc = (t, y) => {
    ctx.font = '600 13px system-ui,sans-serif';
    ctx.fillStyle = '#6f7f95';
    ctx.fillText(t, W / 2, y);
  };
  nhanMuc('① ĐỘ KHÓ MÊ CUNG', Y.nhan1);
  nhanMuc('② NGÂN HÀNG CÂU HỎI', Y.nhan2);
  nhanMuc('③ TUỲ CHỌN', Y.nhan3);

  // Ô nền của cấp độ — vẽ TRƯỚC nút để hai nút ◀ ▶ nổi lên trên.
  ctx.fillStyle = 'rgba(255,255,255,.07)';
  rr(ctx, 316, Y.hangCap, 268, 52, 16);
  ctx.fill();

  drawButtons(ctx, nut, dangBam);

  // Tên cấp độ nằm GIỮA hai nút ◀ ▶. textAlign phải đặt lại NGAY ĐÂY: đừng tin trạng thái
  // còn nguyên sau khi gọi hàm khác — chính chỗ này từng làm chữ đè lên nút ▶.
  const cap = st.capList.find((c) => c.id === st.cap) || st.capList[0];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd257';
  ctx.font = '900 22px system-ui,sans-serif';
  // Cấp độ có thể dài ("✏️ Đồ dùng học tập") → co chữ cho vừa ô 268, không để tràn ra nút.
  while (ctx.measureText(cap.ten).width > 244 && parseInt(ctx.font) > 13)
    ctx.font = `900 ${parseInt(ctx.font) - 1}px system-ui,sans-serif`;
  ctx.fillText(cap.ten, W / 2, Y.hangCap + 26);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#93a3b8';
  ctx.font = '13px system-ui,sans-serif';
  ctx.fillText(st.moBoDe || '', W / 2, Y.moBoDe);

  const mo = st.mucList[st.muc];
  ctx.fillStyle = '#7b8798';
  ctx.font = '13px system-ui,sans-serif';
  ctx.fillText(
    `${mo.size}×${mo.size} ô · ${mo.gates} cửa khoá · ${mo.quai} quái · ${mo.tim} tim`,
    W / 2,
    Y.ghiChu,
  );
  ctx.fillStyle = '#5b6a80';
  ctx.fillText('Bấm chuột để chọn — hoặc phím 1·2·3 · L · B · S · ENTER', W / 2, Y.nhacPhim);
  ctx.textAlign = 'left';
}

// Màn TẠM DỪNG. Vẽ ĐÈ LÊN mê cung đang mờ đi chứ không xoá hẳn — nhìn thấy mình đang ở
// đâu thì mới nhớ được là đang chơi dở cái gì.
export function drawPause(ctx, dong, nut, dangBam) {
  ctx.fillStyle = 'rgba(8,11,18,.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8eef7';
  ctx.font = '900 40px system-ui,sans-serif';
  ctx.fillText('⏸ TẠM DỪNG', W / 2, 140);
  ctx.font = '16px system-ui,sans-serif';
  ctx.fillStyle = '#93a3b8';
  dong.forEach((t, i) => ctx.fillText(t, W / 2, 184 + i * 24));
  ctx.fillStyle = '#5b6a80';
  ctx.font = '13px system-ui,sans-serif';
  // 604 chứ không phải 580: nút "Hiện FPS" kết thúc ở 568 và còn bóng đổ 4px nữa.
  ctx.fillText('Bấm ESC hoặc P để chơi tiếp', W / 2, 612);
  ctx.textAlign = 'left';
  drawButtons(ctx, nut, dangBam);
}

export function drawWin(ctx, dong, nut, dangBam) {
  ctx.fillStyle = 'rgba(8,11,18,.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8eef7';
  ctx.font = '900 44px system-ui,sans-serif';
  ctx.fillText('🎉 Qua mê cung!', W / 2, 190);
  ctx.font = '20px system-ui,sans-serif';
  dong.forEach((t, i) => {
    ctx.fillStyle = i === 0 ? '#8fe3ff' : '#c3cede';
    ctx.fillText(t, W / 2, 262 + i * 40);
  });
  ctx.textAlign = 'left';
  drawButtons(ctx, nut, dangBam);
}

export function drawQuestion(ctx, cau, sai, loiGiai, run = null) {
  ctx.fillStyle = 'rgba(8,11,18,.93)';
  ctx.fillRect(0, 0, W, H);

  // TIM PHẢI THẤY ĐƯỢC NGAY Ở ĐÂY. Màn câu hỏi phủ kín HUD, mà từ nay sai là mất tim —
  // không thấy tim vơi đi thì hình phạt trở nên vô hình, bé cứ bấm bừa rồi đột ngột bị đưa
  // về chỗ xuất phát mà không hiểu vì sao.
  if (run) {
    ctx.textAlign = 'left';
    ctx.font = '17px system-ui,sans-serif';
    for (let i = 0; i < run.timToiDa; i++) {
      ctx.globalAlpha = i < run.tim ? 1 : 0.22;
      ctx.fillText('❤️', 40 + i * 21, 62);
    }
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = cau.thuong ? '#ffd257' : '#8fe3ff';
  ctx.font = 'bold 17px system-ui,sans-serif';
  ctx.fillText(
    cau.thuong ? '⭐ CÂU THƯỞNG — sai vẫn mất tim nhé' : '🔶 CỬA KHOÁ — trả lời đúng mới qua được',
    W / 2,
    56,
  );
  // ĐỀ BÀI — NGẮT DÒNG THEO BỀ NGANG THẬT. Co cỡ chữ thôi là không đủ: câu đố Trạng Nguyên
  // dài 78 ký tự vẫn tràn ra ngoài CẢ HAI mép, mất luôn chữ đầu và chữ cuối.
  const cQ = cau.q.length > 90 ? 22 : cau.q.length > 46 ? 26 : 32;
  ctx.fillStyle = '#e8eef7';
  ctx.font = `bold ${cQ}px system-ui,sans-serif`;
  const dongQ = ngatDong(ctx, cau.q, W - 140).slice(0, 3);
  const cao = cQ + 8;
  const y0 = 150 - ((dongQ.length - 1) * cao) / 2; // khối chữ canh giữa quanh y=150
  dongQ.forEach((d, i) => ctx.fillText(d, W / 2, y0 + i * cao));

  // Bốn lựa chọn xếp 2×2 — nay là NÚT BẤM ĐƯỢC, vị trí lấy từ ui/mecung-ui.js nên
  // chỗ vẽ và chỗ bắt chuột không bao giờ lệch nhau.
  const nut = nutCauHoi({ dapAn: cau.a, k: cau.k, sai, loiGiai, thuong: cau.thuong });
  for (const b of nut) {
    if (!b.id.startsWith('dapAn')) continue;
    ctx.fillStyle = b.dung ? '#1d6b40' : b.sai ? '#4a2530' : '#2b3446';
    rr(ctx, b.x, b.y + 4, b.w, b.h, 14); // bóng khối dưới đáy, đúng lối nút của Phiêu Lưu
    ctx.fill();
    ctx.fillStyle = b.dung ? '#2FA84F' : b.sai ? '#3d2028' : '#3a4557';
    rr(ctx, b.x, b.y, b.w, b.h, 14);
    ctx.fill();
    // số thứ tự trong ô tròn — vừa là phím tắt, vừa là chỗ bấm
    ctx.fillStyle = b.dung ? '#eafff2' : b.sai ? '#6b4550' : '#8fa2bd';
    ctx.beginPath();
    ctx.arc(b.x + 34, b.y + b.h / 2, 17, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = b.dung ? '#1d6b40' : '#1a2130';
    ctx.font = '900 19px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(b.so), b.x + 34, b.y + b.h / 2 + 1);
    // Chữ đáp án phải VỪA chỗ trống còn lại của nút, không được đè lên ô số. Co cỡ chữ cho
    // tới khi vừa — đáp án dài như "Tổ chức Y tế Thế giới" ở cỡ 24 sẽ tràn cả ra ngoài nút.
    ctx.fillStyle = b.sai && !b.dung ? '#8a7078' : '#e8eef7';
    const oChu = b.w - 74;
    let co = 24;
    ctx.font = `900 ${co}px system-ui,sans-serif`;
    while (ctx.measureText(b.nhan).width > oChu && co > 12) {
      co -= 1;
      ctx.font = `900 ${co}px system-ui,sans-serif`;
    }
    ctx.fillText(b.nhan, b.x + 62 + oChu / 2, b.y + b.h / 2 + 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
  }
  if (loiGiai)
    drawButtons(
      ctx,
      nut.filter((b) => b.id === 'tiepTuc'),
    );

  ctx.textAlign = 'center';
  ctx.font = '16px system-ui,sans-serif';
  if (loiGiai) {
    ctx.fillStyle = '#ffd257';
    // Ngắt theo BỀ NGANG THẬT, không theo số ký tự: "iii" và "MMM" cùng 3 ký tự nhưng
    // rộng khác nhau gấp ba lần.
    ngatDong(ctx, cau.why, W - 140)
      .slice(0, 3)
      .forEach((t, i) => ctx.fillText(t, W / 2, 434 + i * 26));
    ctx.fillStyle = '#8fe3ff';
    ctx.fillText(
      cau.thuong
        ? 'Ô thưởng xong rồi — đi tiếp thôi!'
        : 'Cửa này vẫn khoá — nhớ câu này rồi quay lại nhé!',
      W / 2,
      528,
    );
  } else {
    ctx.fillStyle = sai.length ? '#ff9d7a' : '#7b8798';
    const nhac = [
      'Bấm 1 · 2 · 3 · 4 để chọn',
      'Sai rồi, mất một tim — còn 2 lượt',
      'Mất thêm một tim nữa — còn 1 lượt cuối',
    ][sai.length];
    ctx.fillText(nhac, W / 2, 448);
    if (sai.length) {
      ctx.fillStyle = '#7b8798';
      ctx.fillText(
        cau.thuong
          ? 'Hết 3 lượt là mất ô thưởng này'
          : 'Hết 3 lượt thì cửa vẫn khoá, phải quay lại thử câu khác',
        W / 2,
        482,
      );
    }
  }
  ctx.textAlign = 'left';
}

// Màn hình phủ (chọn mức / thắng). Trả về để entry vẽ chồng lên.
export function drawOverlay(ctx, tieude, dong) {
  ctx.fillStyle = 'rgba(8,11,18,.86)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8eef7';
  ctx.font = 'bold 40px system-ui,sans-serif';
  ctx.fillText(tieude, W / 2, 190);
  ctx.font = '20px system-ui,sans-serif';
  dong.forEach((t, i) => {
    ctx.fillStyle = i === 0 ? '#8fe3ff' : '#c3cede';
    ctx.fillText(t, W / 2, 262 + i * 40);
  });
  ctx.textAlign = 'left';
}
