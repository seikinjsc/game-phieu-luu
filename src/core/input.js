// core/input.js — bản đồ phím. Trích từ legacy, giữ nguyên mọi phím.
//
// Gộp mọi cách bấm quen thuộc: mũi tên • WASD • Z/X • J/K • Space • Shift •
// Ctrl • bàn phím số. Thêm/bớt phím = sửa KEYMAP (và KEYLABEL để hiện trong Cài đặt).
// Việc định tuyến theo màn hình (pause/mute/retry…) là của lớp ghép game, không phải ở đây.

export const KEYMAP = {
  jump: ['Space', 'ArrowUp', 'KeyW', 'KeyZ', 'Numpad8'],
  atk: ['KeyF', 'KeyJ', 'KeyK', 'KeyX', 'KeyE', 'ShiftLeft', 'ShiftRight', 'Numpad0'],
  left: ['ArrowLeft', 'KeyA', 'KeyQ', 'Numpad4'],
  right: ['ArrowRight', 'KeyD', 'Numpad6'],
  down: ['ArrowDown', 'KeyS', 'KeyC', 'ControlLeft', 'ControlRight', 'Numpad2'],
  pause: ['Escape', 'KeyP'],
  retry: ['KeyR'],
  mute: ['KeyM'],
  ok: ['Enter', 'NumpadEnter'],
};

export const KEYLABEL = [
  ['⬆️ Nhảy', 'PHÍM CÁCH · W · Z · ↑ · num8'],
  ['⚔️ Đánh', 'J · K · F · X · E · SHIFT · num0'],
  ['◀ Lùi lại', 'A · Q · ← · num4'],
  ['▶ Tiến lên', 'D · → · num6'],
  ['▼ Ngồi / xuống', 'S · C · CTRL · ↓ · num2'],
  ['⏸ Tạm dừng', 'ESC · P'],
  ['🔄 Chơi lại cửa', 'R'],
  ['🔇 Tắt/bật tiếng', 'M'],
  ['✔️ Xác nhận', 'ENTER'],
];

export const inMap = (list, c) => list.indexOf(c) >= 0;

// Mã phím `code` thuộc nhóm hành động nào (jump/atk/left/…)? null nếu không thuộc.
export function keyAction(code) {
  for (const act in KEYMAP) if (inMap(KEYMAP[act], code)) return act;
  return null;
}
