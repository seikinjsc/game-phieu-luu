import { describe, it, expect, beforeEach } from 'vitest';
import { tone, audioCfg, _resetAudio } from '../src/core/audio.js';
import { exportSave, importSave, SAVEVER } from '../src/core/save.js';
import { dtOf, MAX_DT } from '../src/core/loop.js';
import { keyAction, KEYMAP } from '../src/core/input.js';
import { createScreens } from '../src/core/state.js';

// ── AudioContext giả KIỂM TRA NGHIÊM: ghi lại mọi tham số không hợp lệ ──
function installStrictAudio() {
  const rec = { osc: 0, badTime: 0, badExp: 0 };
  const chk = (t) => {
    if (!Number.isFinite(t) || t < 0) rec.badTime++;
  };
  const param = () => ({
    setValueAtTime: (v, t) => chk(t),
    linearRampToValueAtTime: (v, t) => chk(t),
    exponentialRampToValueAtTime: (v, t) => {
      chk(t);
      if (!(v > 0)) rec.badExp++;
    },
  });
  globalThis.window = {
    AudioContext: function () {
      return {
        currentTime: 0,
        destination: {},
        createOscillator: () => {
          rec.osc++;
          return {
            type: '',
            frequency: { value: 0 },
            connect() {},
            start: (t) => chk(t),
            stop: (t) => chk(t),
          };
        },
        createGain: () => ({ gain: param(), connect() {} }),
      };
    },
  };
  return rec;
}

describe('core/audio: tone() không bao giờ ném lỗi', () => {
  let rec;
  beforeEach(() => {
    _resetAudio();
    audioCfg.music = 1;
    audioCfg.sfx = 1;
    rec = installStrictAudio();
  });

  it('đầu vào âm/NaN/Infinity/0 không ném lỗi và không lọt tham số xấu', () => {
    const bads = [-5, NaN, Infinity, -Infinity, 0, undefined, null, '', 'x'];
    expect(() => {
      for (const f of bads) for (const d of bads) for (const v of bads) tone(f, d, 'square', v);
    }).not.toThrow();
    // f không hợp lệ → thoát sớm; các trường hợp hợp lệ đều được kẹp → không có thời gian/giá trị xấu
    expect(rec.badTime).toBe(0);
    expect(rec.badExp).toBe(0);
  });

  it('tham số hợp lệ vẫn phát (tạo oscillator), tham số bị kẹp về khoảng an toàn', () => {
    tone(440, 999, 'square', 999); // d, v vượt trần → kẹp; vẫn phát
    expect(rec.osc).toBe(1);
    expect(rec.badTime).toBe(0);
  });

  it('tắt SFX thì không phát', () => {
    audioCfg.sfx = 0;
    tone(440, 0.1, 'square', 0.05);
    expect(rec.osc).toBe(0);
  });

  it('nuốt lỗi nếu Web Audio tự ném', () => {
    _resetAudio();
    globalThis.window = {
      AudioContext: function () {
        return {
          currentTime: 0,
          destination: {},
          createOscillator() {
            throw new Error('bùm');
          },
          createGain() {
            return { gain: {}, connect() {} };
          },
        };
      },
    };
    expect(() => tone(440, 0.1, 'square', 0.05)).not.toThrow();
  });
});

describe('core/save: mã BPL1 xuất/nhập khớp 100%', () => {
  const GEAR = [
    'weapon',
    'wDur',
    'armor',
    'aDur',
    'boots',
    'bDur',
    'charm',
    'cDur',
    'sw',
    'swDur',
    'sa',
    'saDur',
    'fins',
    'fDur',
    'tank',
    'aw',
    'awDur',
    'aa',
    'aaDur',
    'jet',
    'jDur',
    'mag',
    'iw',
    'iwDur',
    'ia',
    'iaDur',
    'cramp',
    'crDur',
    'torch',
    'gw',
    'gwDur',
    'ga',
    'gaDur',
    'grip',
    'grDur',
    'lamp',
    'jw',
    'jwDur',
    'ja',
    'jaDur',
    'claw',
    'clDur',
    'coco',
  ];
  const makePG = () => {
    const pg = {
      unlocked: 37,
      coins: 1234,
      cleared: { 3: true, 10: true, 60: true },
      run: { si: 12, dist: 340 },
    };
    GEAR.forEach((k, i) => (pg[k] = i + 1)); // giá trị phân biệt cho từng ô
    return pg;
  };

  it('xuất rồi nhập lại khớp mọi trường', () => {
    const PG = makePG();
    const SET = { diff: 2 };
    const code = exportSave(PG, SET, 60);
    expect(code.startsWith(SAVEVER + '-')).toBe(true);

    const PG2 = { cleared: {} };
    const SET2 = {};
    const r = importSave(code, PG2, SET2, 60);
    expect(r.ok).toBe(1);
    expect(PG2.unlocked).toBe(37);
    expect(PG2.coins).toBe(1234);
    expect(SET2.diff).toBe(2);
    expect(PG2.cleared).toEqual({ 3: true, 10: true, 60: true });
    expect(PG2.run).toEqual({ si: 12, dist: 340 });
    GEAR.forEach((k, i) => expect(PG2[k], k).toBe(i + 1));
  });

  it('từ chối mã sai định dạng', () => {
    expect(importSave('rác', {}, {}, 60).ok).toBe(0);
    expect(importSave('', {}, {}, 60).ok).toBe(0);
  });

  it('từ chối mã bị sửa (checksum lệch)', () => {
    const code = exportSave(makePG(), { diff: 1 }, 60);
    const parts = code.split('-');
    const tampered = parts[0] + '-' + parts[1] + '-' + parts[2].slice(0, -2) + 'AA';
    expect(importSave(tampered, {}, {}, 60).ok).toBe(0);
  });
});

describe('core/loop: dt kẹp ≤ 0.033', () => {
  it('khung đầu 0.016; khoảng cách lớn bị kẹp; bình thường tính đúng', () => {
    expect(dtOf(1000, 0)).toBe(0.016);
    expect(dtOf(9000, 1000)).toBe(MAX_DT); // 8s → kẹp
    expect(dtOf(1016.7, 1000)).toBeCloseTo(0.0167, 4);
  });
});

describe('core/input: keyAction', () => {
  it('gán đúng nhóm hành động', () => {
    expect(keyAction('Space')).toBe('jump');
    expect(keyAction('KeyF')).toBe('atk');
    expect(keyAction('ArrowLeft')).toBe('left');
    expect(keyAction('Escape')).toBe('pause');
    expect(keyAction('KeyZ')).toBe('jump');
    expect(keyAction('Unknown')).toBe(null);
  });
  it('không có mã phím trùng giữa hai nhóm', () => {
    const seen = new Set();
    for (const act in KEYMAP)
      for (const c of KEYMAP[act]) {
        expect(seen.has(c), c).toBe(false);
        seen.add(c);
      }
  });
});

describe('core/state: createScreens', () => {
  const fakeDoc = () => {
    const els = {};
    return {
      getElementById(id) {
        return (els[id] ||= {
          style: {},
          classList: {
            _s: new Set(),
            toggle(c, v) {
              v ? this._s.add(c) : this._s.delete(c);
            },
            add(c) {
              this._s.add(c);
            },
            has(c) {
              return this._s.has(c);
            },
          },
        });
      },
      _els: els,
    };
  };

  it('show(id) chỉ để lộ đúng một overlay, ẩn còn lại', () => {
    const doc = fakeDoc();
    const s = createScreens(doc);
    s.show('setScr');
    expect(s.current).toBe('setScr');
    expect(doc.getElementById('setScr').classList.has('hide')).toBe(false);
    expect(doc.getElementById('mapScr').classList.has('hide')).toBe(true);
  });

  it('show(null) khi đang chơi thì hiện nút Tạm dừng', () => {
    const doc = fakeDoc();
    const s = createScreens(doc);
    s.show(null);
    expect(doc.getElementById('pauseBtn').style.display).toBe('');
  });
});
