// core/state.js — máy trạng thái màn hình. Trích từ legacy (show/hideAll/SCRS).
//
// Hai khái niệm tách biệt:
//   SCREEN  màn hình LOGIC của game (map/shop/set/play/pause/result) — biến `scr`.
//   SCRS    các lớp phủ DOM (overlay) bật/tắt bằng class 'hide'.
// Lớp phủ chỉ có ở các màn không phải lúc đang chơi; 'play' = ẩn hết overlay.

export const SCREENS = ['map', 'shop', 'set', 'play', 'pause', 'result'];
export const SCRS = ['mapScr', 'shopScr', 'resScr', 'pauseScr', 'setScr'];

// Bộ điều khiển overlay. `doc` = document (thật hoặc giả). Trả API show/hideAll + màn hiện tại.
export function createScreens(doc) {
  let current = null;
  return {
    get current() {
      return current;
    },
    // Hiện đúng một overlay id (null = ẩn hết, đang chơi). Nút Tạm dừng chỉ hiện khi id===null.
    show(id) {
      SCRS.forEach((x) => doc.getElementById(x).classList.toggle('hide', x !== id));
      const pb = doc.getElementById('pauseBtn');
      if (pb) pb.style.display = id === null ? '' : 'none';
      current = id;
    },
    hideAll() {
      SCRS.forEach((x) => doc.getElementById(x).classList.add('hide'));
      const pb = doc.getElementById('pauseBtn');
      if (pb) pb.style.display = '';
      current = null;
    },
  };
}
