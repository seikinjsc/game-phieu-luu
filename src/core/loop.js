// core/loop.js — vòng lặp requestAnimationFrame. Trích từ legacy, giữ nguyên cách kẹp dt.
//
// dt luôn kẹp ≤ 0.033 (≈30fps): nếu tab bị treo/ẩn rồi quay lại, một bước dt
// khổng lồ sẽ làm nhân vật xuyên qua vật cản. Khung đầu tiên dùng 0.016.

export const MAX_DT = 0.033;
export const dtOf = (ts, last) => Math.min(MAX_DT, last ? (ts - last) / 1000 : 0.016);

// step(dt) được gọi mỗi khung. Trả về {start, stop}.
export function createLoop(step) {
  let last = 0,
    running = false;
  function frame(ts) {
    const dt = dtOf(ts, last);
    last = ts;
    step(dt);
    if (running) requestAnimationFrame(frame);
  }
  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    },
  };
}
