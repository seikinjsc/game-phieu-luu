/* ════════════════════════════════════════════════════════════════
   BỘ CHẠY THỬ KHÔNG CẦN TRÌNH DUYỆT (headless harness)
   ----------------------------------------------------------------
   Giả lập DOM + Canvas + Web Audio để chạy game trong Node.
   Đây là công cụ quan trọng nhất của dự án: nhờ nó mà AI có thể tự
   kiểm chứng thay đổi của mình thay vì bắt người mở trình duyệt bấm thử.

   Điểm mấu chốt: AudioContext giả KIỂM TRA NGHIÊM NGẶT — nếu code
   truyền thời gian âm hoặc NaN thì ghi lại lỗi, đúng như trình duyệt
   thật sẽ ném RangeError.

   Dùng:
     import { createHarness } from './tools/harness.mjs';
     const h = await createHarness('legacy/game-be-phieu-luu-v32.html');
     h.setSkin(0); h.startStage(0); h.frames(300);
     console.log(h.state().dist, h.audioErrors());
   ════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';

const noop = () => {};

export async function createHarness(htmlPath, opts = {}) {
  const audioErrors = [];
  const drawCalls = { fill: 0, stroke: 0, text: 0 };
  let now = 0;
  let lastBlob = null; // nội dung tệp lưu gần nhất (cho test saveToFile)

  // ── Canvas giả ──────────────────────────────────────────────
  const grad = { addColorStop: noop };
  const ctx = new Proxy(
    {},
    {
      get(t, k) {
        if (k in t) return t[k];
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
        if (k === 'measureText') return () => ({ width: 10 });
        if (k === 'canvas') return { width: 1350, height: 750 };
        if (k === 'fill' || k === 'fillRect')
          return () => {
            drawCalls.fill++;
          };
        if (k === 'stroke' || k === 'strokeRect')
          return () => {
            drawCalls.stroke++;
          };
        if (k === 'fillText')
          return () => {
            drawCalls.text++;
          };
        return noop;
      },
      set(t, k, v) {
        t[k] = v;
        return true;
      },
    },
  );

  // ── DOM giả ────────────────────────────────────────────────
  const made = [];
  function El(id) {
    const e = {
      id,
      tag: id,
      style: {},
      dataset: {},
      textContent: '',
      value: '',
      rows: 0,
      className: '',
      disabled: false,
      width: 0,
      height: 0,
      kids: [],
      _html: '',
      classList: {
        _s: new Set(),
        add(c) {
          this._s.add(c);
        },
        remove(c) {
          this._s.delete(c);
        },
        toggle(c, v) {
          v ? this._s.add(c) : this._s.delete(c);
        },
        contains(c) {
          return this._s.has(c);
        },
      },
      getContext: () => ctx,
      addEventListener: noop,
      removeEventListener: noop,
      appendChild(c) {
        this.kids.push(c);
      },
      remove: noop,
      closest: () => null,
      querySelectorAll: () => [],
      onclick: null,
      onchange: null,
      files: null,
      focus: noop,
      select: noop,
      click: noop,
    };
    Object.defineProperty(e, 'innerHTML', {
      get() {
        return e._html;
      },
      set(v) {
        e._html = v;
        if (v === '') e.kids = [];
      },
    });
    return e;
  }
  const els = {};
  globalThis.document = {
    getElementById(id) {
      return els[id] || (els[id] = El(id));
    },
    querySelectorAll(sel) {
      if (sel === '.sk')
        return [0, 1, 2].map((i) => {
          const e = El('sk' + i);
          e.dataset.sk = String(i);
          return e;
        });
      return [];
    },
    createElement(t) {
      const e = El(t);
      made.push(e);
      return e;
    },
    addEventListener: noop,
  };
  globalThis.document.body = El('body');

  // localStorage giả (cho ô lưu đặt tên) + Blob/URL/FileReader (cho xuất/nhập tệp)
  globalThis.localStorage = (() => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
      clear: () => m.clear(),
    };
  })();
  globalThis.Blob = function (parts) {
    this.parts = parts;
    lastBlob = String((parts && parts[0]) || '');
  };
  globalThis.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: noop };
  globalThis.FileReader = function () {
    this.readAsText = (f) => {
      this.result = (f && f._text) || '';
      if (this.onload) this.onload();
    };
  };

  // ── Web Audio giả, kiểm tra nghiêm ─────────────────────────
  const chk = (t, name) => {
    if (!Number.isFinite(t) || t < 0) audioErrors.push(`${name}: thời gian không hợp lệ: ${t}`);
  };
  const mkParam = () => ({
    value: 0,
    setValueAtTime: (v, t) => chk(t, 'setValueAtTime'),
    linearRampToValueAtTime: (v, t) => chk(t, 'linearRamp'),
    exponentialRampToValueAtTime: (v, t) => {
      chk(t, 'exponentialRamp');
      if (!(v > 0)) audioErrors.push(`exponentialRamp cần giá trị > 0, nhận ${v}`);
    },
  });
  // Node 22 đặt navigator là thuộc tính chỉ đọc — phải định nghĩa lại
  try {
    globalThis.navigator = {};
  } catch {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
  }
  globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
  globalThis.atob = (b) => Buffer.from(b, 'base64').toString('binary');
  globalThis.window = {
    AudioContext: function () {
      return {
        get currentTime() {
          return now;
        },
        destination: {},
        createOscillator: () => ({
          type: '',
          frequency: { value: 0 },
          connect: noop,
          start: (t) => chk(t, 'osc.start'),
          stop: (t) => chk(t, 'osc.stop'),
        }),
        createGain: () => ({ gain: mkParam(), connect: noop }),
      };
    },
    storage: opts.storage || undefined,
  };

  // ── vòng lặp ───────────────────────────────────────────────
  let rafCb = null;
  globalThis.requestAnimationFrame = (cb) => {
    rafCb = cb;
    return 1;
  };
  globalThis.setTimeout = () => 0; // chặn vòng lặp nhạc chạy vô hạn
  globalThis.clearTimeout = noop;

  // ── nạp game ───────────────────────────────────────────────
  const html = readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Không tìm thấy khối <script> trong ' + htmlPath);
  let code = m[1];
  // chèn cửa hậu để test lấy được trạng thái + điều khiển skin bên trong IIFE
  code = code.replace(
    '(async function init(){',
    'globalThis.__G={startStage,jump,attack,setMove,release,endStage,exportSave,importSave,' +
      'slotAdd,slotsLoad,slotDel,saveToFile,loadFromFile,VS,seedGameplay,unseedGameplay,' +
      'vsStart,vsBeginRun,' +
      'get skin(){return skin;},setSkin(s){skin=s;if(typeof applySkin==="function")applySkin();},' +
      'get G(){return G;},PG,SET,ADM,ST,get scr(){return scr;}};\n(async function init(){',
  );
  (0, eval)(code);
  for (let i = 0; i < 12; i++) await Promise.resolve(); // đợi init() bất đồng bộ

  const T = globalThis.__G;
  let t = 0;

  return {
    api: T,
    els,
    setSkin: (s) => T.setSkin(s),
    skin: () => T.skin,
    startStage: (i, resume) => T.startStage(i, resume),
    frames(n) {
      for (let i = 0; i < n; i++) {
        t += 16.7;
        now += 0.0167;
        rafCb(t);
      }
    },
    jump: () => T.jump(),
    attack: () => T.attack(),
    move: (dir, v) => T.setMove(dir, v),
    release: () => T.release(),
    state: () => T.G,
    progress: () => T.PG,
    settings: () => T.SET,
    screen: () => T.scr,
    stages: () => T.ST,
    audioErrors: () => audioErrors.slice(),
    lastSaveBlob: () => lastBlob,
    drawCalls: () => ({ ...drawCalls }),
    resetAudioErrors() {
      audioErrors.length = 0;
    },
  };
}
