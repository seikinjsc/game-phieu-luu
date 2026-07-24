// render/layers.js — tách lớp thị giác. Trích từ legacy (hazePass/POP/contactShadow…).
//
// Ba tầng làm vật cản NỔI khỏi nền (xem docs/ARCHITECTURE.md):
//   1. hazePass  phủ lớp sương lên NỀN → nền nhạt, lùi ra sau.
//   2. POP       bọc vật tương tác trong bóng đổ → nổi lên trước.
//   3. contactShadow  bóng tiếp đất cho vật đứng trên mặt đất.
// Màu sương lấy từ data/palettes.js (HAZE[world][skin]) — người gọi chọn rồi truyền vào.
// Mọi hàm nhận `ctx` (CanvasRenderingContext2D thật hoặc giả) làm tham số đầu.

// Phủ sương toàn nền bằng màu bán trong suốt đã chọn.
export function hazePass(ctx, hazeColor, W, H) {
  ctx.fillStyle = hazeColor;
  ctx.fillRect(0, 0, W, H);
}

// Bóng đổ "nổi khối". createPop(ctx) → { on(), off() } bọc quanh lệnh vẽ vật tương tác.
export const POP_DEFAULT = { blur: 7, ox: 0, oy: 3, col: 'rgba(12,18,32,.5)' };
export function createPop(ctx, o = POP_DEFAULT) {
  return {
    on() {
      ctx.save();
      ctx.shadowColor = o.col;
      ctx.shadowBlur = o.blur;
      ctx.shadowOffsetX = o.ox;
      ctx.shadowOffsetY = o.oy;
    },
    off() {
      ctx.restore();
    },
  };
}

// Bóng tiếp đất (ellipse mờ dưới chân vật). x tâm, w2 nửa bề rộng vật, y mặt đất.
export function contactShadow(ctx, x, w2, y) {
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath();
  ctx.ellipse(x, y, w2 * 0.55, 7, 0, 0, 6.3);
  ctx.fill();
  ctx.restore();
}

// Chữ nhật bo góc (dựng path; người gọi fill/stroke sau).
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Ô pixel (làm tròn để nét khi phóng to) — nền tảng cho phong cách Minecraft.
export function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
}
