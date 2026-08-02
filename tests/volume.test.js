import { describe, it, expect, beforeEach } from 'vitest';
import { audioCfg, tone, _resetAudio } from '../src/core/audio.js';
import { makeProgress, KHOA } from '../src/systems/progress.js';
import { MUC_AM, TEN_AM, nutAmThanh } from '../src/ui/mecung-ui.js';

// Web Audio giả: ghi lại âm lượng thật sự đặt vào bộ khuếch đại.
function gaAudio() {
  const dat = [];
  const gain = {
    gain: {
      setValueAtTime() {},
      linearRampToValueAtTime: (v) => dat.push(v),
      exponentialRampToValueAtTime() {},
    },
    connect() {},
  };
  globalThis.window = {
    AudioContext: function () {
      return {
        currentTime: 0,
        destination: {},
        createOscillator: () => ({ frequency: {}, connect() {}, start() {}, stop() {} }),
        createGain: () => gain,
      };
    },
  };
  _resetAudio();
  return dat;
}

const khoGia = (banDau = null) => {
  const d = banDau ? { [KHOA]: banDau } : {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => (d[k] = String(v)) };
};

describe('core/audio: hệ số âm lượng', () => {
  beforeEach(() => {
    audioCfg.music = 1;
    audioCfg.sfx = 1;
    audioCfg.musicVol = 1;
    audioCfg.sfxVol = 1;
  });

  // Game 60 cửa dùng chung mô-đun này. Hệ số mặc định 1 PHẢI cho ra đúng độ to cũ.
  it('hệ số 1 giữ NGUYÊN độ to cũ — không đụng tới game 60 cửa', () => {
    const dat = gaAudio();
    tone(440, 0.1, 'square', 0.05);
    expect(dat[0]).toBeCloseTo(0.05, 5);
  });

  it('hệ số lớn hơn thì tiếng to hơn đúng theo tỉ lệ', () => {
    const dat = gaAudio();
    audioCfg.sfxVol = 2;
    tone(440, 0.1, 'square', 0.05);
    expect(dat[0]).toBeCloseTo(0.1, 5);
  });

  it('nhạc và hiệu ứng dùng hệ số RIÊNG, không lẫn nhau', () => {
    const dat = gaAudio();
    audioCfg.sfxVol = 3;
    audioCfg.musicVol = 1;
    tone(440, 0.1, 'square', 0.05); // hiệu ứng
    tone(440, 0.1, 'square', 0.05, 1); // nhạc nền
    expect(dat[0]).toBeCloseTo(0.15, 5);
    expect(dat[1]).toBeCloseTo(0.05, 5);
  });

  // LỖI LỊCH SỬ #2: tham số âm/NaN lọt vào Web Audio là chết tiếng cả game.
  it('vẫn KẸP TRẦN dù hệ số bị đặt lố', () => {
    const dat = gaAudio();
    audioCfg.sfxVol = 999;
    tone(440, 0.1, 'square', 0.09);
    expect(dat[0]).toBeLessThanOrEqual(0.6);
  });

  it('hệ số hỏng (0, âm, NaN, undefined) thì rơi về 1, không tắt tiếng', () => {
    for (const xau of [0, -3, NaN, undefined, 'to']) {
      const dat = gaAudio();
      audioCfg.sfxVol = xau;
      tone(440, 0.1, 'square', 0.05);
      expect(dat[0], String(xau)).toBeCloseTo(0.05, 5);
    }
  });

  it('cờ tắt tiếng vẫn thắng mọi hệ số', () => {
    const dat = gaAudio();
    audioCfg.sfx = 0;
    audioCfg.sfxVol = 3;
    tone(440, 0.1, 'square', 0.05);
    expect(dat).toHaveLength(0);
  });
});

describe('mức âm lượng', () => {
  it('bốn mức, tăng dần, mức 0 là TẮT hẳn', () => {
    expect(MUC_AM).toHaveLength(4);
    expect(TEN_AM).toHaveLength(4);
    expect(MUC_AM[0]).toBe(0);
    for (let i = 1; i < MUC_AM.length; i++) expect(MUC_AM[i]).toBeGreaterThan(MUC_AM[i - 1]);
  });

  it('mức mặc định TO HƠN bản cũ (hệ số 1) — đó là lý do có tính năng này', () => {
    const v = makeProgress(khoGia());
    expect(MUC_AM[v.amTieng]).toBeGreaterThan(1);
    expect(MUC_AM[v.amNhac]).toBeGreaterThan(1);
  });

  // Nhạc nền to ngang tiếng nhặt xu thì át mất phản hồi của thao tác.
  it('nhạc nền mặc định NHỎ HƠN hiệu ứng một bậc', () => {
    const v = makeProgress(khoGia());
    expect(v.amNhac).toBeLessThan(v.amTieng);
  });

  it('lưu lại mức đã chỉnh, mở lần sau không phải chỉnh lại', () => {
    const kho = khoGia();
    makeProgress(kho).datAm(0, 1);
    const v2 = makeProgress(kho);
    expect(v2.amNhac).toBe(0);
    expect(v2.amTieng).toBe(1);
  });

  it('mức ngoài khoảng 0..3 bị bỏ qua, giữ nguyên mức cũ', () => {
    const v = makeProgress(khoGia());
    const n = v.amNhac,
      t = v.amTieng;
    v.datAm(99, -1);
    expect(v.amNhac).toBe(n);
    expect(v.amTieng).toBe(t);
    v.datAm(1.5, 'to');
    expect(v.amNhac).toBe(n);
    expect(v.amTieng).toBe(t);
  });

  it('dữ liệu lưu hỏng thì về mức mặc định, không vỡ', () => {
    const v = makeProgress(khoGia('{"amNhac":42,"amTieng":"ầm ĩ"}'));
    expect(v.amNhac).toBe(2);
    expect(v.amTieng).toBe(3);
  });

  it('nút hiện tên mức khi rộng, chỉ hiện biểu tượng khi hẹp', () => {
    const rong = nutAmThanh({ mucNhac: 2, mucTieng: 3 }, 0, 0, 44, 190);
    expect(rong[0].nhan).toContain(TEN_AM[2]);
    expect(rong[1].nhan).toContain(TEN_AM[3]);
    const hep = nutAmThanh({ mucNhac: 2, mucTieng: 3 }, 0, 0, 44, 76);
    expect(hep[0].nhan).not.toContain(TEN_AM[2]);
    expect(hep[0].nhan.length).toBeLessThan(4);
  });

  it('mức 0 thì nút chuyển sang màu xám (nhìn là biết đang tắt)', () => {
    const [n, t] = nutAmThanh({ mucNhac: 0, mucTieng: 0 }, 0);
    expect(n.mau).toBe('xam');
    expect(t.mau).toBe('xam');
    const [n2] = nutAmThanh({ mucNhac: 3, mucTieng: 3 }, 0);
    expect(n2.mau).toBe('xanh');
  });
});
