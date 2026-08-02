// core/audio.js — sinh âm bằng Web Audio. Trích từ legacy, GIỮ NGUYÊN cách kẹp tham số.
//
// LỖI LỊCH SỬ #2 (CLAUDE.md): một tham số âm/NaN lọt vào Web Audio sẽ ném
// RangeError và giết luôn tiếng của cả game. Vì vậy tone() PHẢI kẹp mọi tham số
// và bọc try/catch — KHÔNG được nới lỏng.

// Cờ bật/tắt tiếng — khi ghép game thì đồng bộ từ cài đặt (SET.music/SET.sfx).
// musicVol / sfxVol là HỆ SỐ NHÂN âm lượng, mặc định 1 = đúng độ to cũ. Giữ mặc định 1
// để game 60 cửa không bị đổi tiếng; trang mê cung tự đặt hệ số cao hơn khi khởi động.
export const audioCfg = { music: 1, sfx: 1, musicVol: 1, sfxVol: 1 };

let actx = null;
export function ac() {
  if (!actx) {
    try {
      const W = globalThis.window || {};
      actx = new (W.AudioContext || W.webkitAudioContext)();
    } catch {
      /* môi trường không có Web Audio */
    }
  }
  return actx;
}
// Cho kiểm thử: xoá context đã cache để nạp lại mock.
export function _resetAudio() {
  actx = null;
}

// f tần số, d thời lượng, ty dạng sóng, v âm lượng, mus=true nếu là nhạc nền.
export function tone(f, d, ty, v, mus) {
  if (mus ? !audioCfg.music : !audioCfg.sfx) return;
  const a = ac();
  if (!a) return;
  f = +f;
  d = +d;
  v = +v;
  if (!isFinite(f) || f <= 0) return;
  d = !isFinite(d) ? 0.12 : Math.max(0.03, Math.min(4, d));
  // Nhân hệ số âm lượng TRƯỚC khi kẹp. Trần nâng 0.3 → 0.6 để mức "To" thật sự to hơn;
  // mọi lời gọi cũ đều truyền v ≤ 0.09 nên với hệ số 1 chúng không đổi một chút nào.
  // LỖI LỊCH SỬ #2: vẫn PHẢI kẹp, một giá trị âm/NaN lọt vào Web Audio là chết cả tiếng.
  const he = +(mus ? audioCfg.musicVol : audioCfg.sfxVol);
  v = v * (isFinite(he) && he > 0 ? he : 1);
  v = !isFinite(v) || v <= 0 ? 0.07 : Math.min(0.6, v);
  try {
    const o = a.createOscillator(),
      g = a.createGain();
    o.type = ty || 'square';
    o.frequency.value = f;
    const t0 = a.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(v, t0 + Math.min(0.02, d * 0.4));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g);
    g.connect(a.destination);
    o.start(t0);
    o.stop(t0 + d + 0.05);
  } catch {
    /* nuốt mọi lỗi Web Audio — không để chết tiếng cả game */
  }
}

// ── Hiệu ứng âm thanh (SFX) ────────────────────────────────────────
export const sJump = () => {
  tone(520, 0.12, 'square', 0.06);
  setTimeout(() => tone(760, 0.12, 'square', 0.05), 60);
};
export const sSwing = () => {
  tone(300, 0.09, 'sawtooth', 0.05);
  setTimeout(() => tone(520, 0.07, 'sawtooth', 0.04), 50);
};
export const sKill = () => {
  tone(660, 0.09, 'square', 0.06);
  setTimeout(() => tone(440, 0.14, 'square', 0.05), 70);
};
export const sCoin = () => {
  tone(880, 0.08, 'triangle', 0.055);
  setTimeout(() => tone(1320, 0.11, 'triangle', 0.045), 45);
};
export const sPU = () =>
  [523, 659, 784, 1047, 1319].forEach((f, i) =>
    setTimeout(() => tone(f, 0.15, 'square', 0.05), i * 60),
  );
export const sLife = () =>
  [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.07), i * 100));
export const sHit = () => tone(150, 0.22, 'sawtooth', 0.07);
export const sBoom = () => {
  tone(210, 0.16, 'sawtooth', 0.06);
  setTimeout(() => tone(105, 0.2, 'sawtooth', 0.05), 70);
};
export const sRoar = () => {
  tone(90, 0.5, 'sawtooth', 0.09);
  setTimeout(() => tone(70, 0.6, 'sawtooth', 0.07), 160);
};
export const sWin = () =>
  [523, 659, 784, 1047, 1319].forEach((f, i) =>
    setTimeout(() => tone(f, 0.26, 'triangle', 0.07), i * 135),
  );

// ── Nhạc nền ───────────────────────────────────────────────────────
export const MELS = [
  [523, 659, 784, 659, 587, 698, 880, 698],
  [587, 740, 880, 740, 659, 784, 988, 784],
  [440, 523, 659, 523, 494, 587, 740, 587],
  [392, 494, 587, 494, 440, 523, 659, 523],
];
// Phát MỘT bước nhạc cho cửa `stage` (có .n, .boss) với `skin`, trả về mili-giây
// tới bước kế. Vòng lặp setTimeout và điều kiện scr==='play' là việc của lớp ghép game.
// Nhịp step đã kẹp `Math.max(0.11, …)` để không âm (lỗi lịch sử #2).
export function musicStep(mStep, stage, skin) {
  const step = stage.boss ? 0.15 : Math.max(0.11, 0.26 - 0.003 * stage.n);
  const mel = MELS[(stage.n - 1) % MELS.length];
  tone(
    mel[mStep % mel.length] * (stage.boss ? 0.5 : 1),
    step * 0.9,
    skin === 1 ? 'sine' : 'triangle',
    0.03,
    1,
  );
  if (mStep % 4 === 0) tone(stage.boss ? 73 : 131, step * 3, 'sine', 0.05, 1);
  return Math.max(90, step * 1000);
}
