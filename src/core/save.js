// core/save.js — mã lưu tiến trình BPL1. Trích từ legacy, GIỮ NGUYÊN định dạng.
//
// HỢP ĐỒNG CÔNG KHAI (CLAUDE.md): định dạng "BPL1-<checksum>-<base64>" là mã
// người chơi đang giữ. KHÔNG được đổi. Nếu buộc phải đổi hãy tăng lên BPL2 và
// giữ lại bộ đọc BPL1. Thứ tự trường trong mảng `g` / mảng `K` phải khớp tuyệt đối.

export const SAVEVER = 'BPL1';

const b64e = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return '';
  }
};
const b64d = (str) => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return '';
  }
};
function sumOf(str) {
  let x = 5;
  for (let i = 0; i < str.length; i++) x = (x * 33 + str.charCodeAt(i)) >>> 0;
  return x.toString(36);
}

// Thứ tự 42 ô trang bị — dùng CHUNG cho xuất (mảng g) và nhập (mảng K). Đừng đổi.
const GEAR_KEYS = [
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

// Xuất mã từ tiến trình PG + cài đặt SET. stageCount = số cửa (ST.length).
export function exportSave(PG, SET, stageCount) {
  let cl = '';
  for (let i = 1; i <= stageCount; i++) cl += PG.cleared[i] ? '1' : '0';
  const d = {
    u: PG.unlocked,
    c: cl,
    m: PG.coins,
    g: GEAR_KEYS.map((k) => PG[k]),
    r: PG.run || null,
    d: SET.diff,
  };
  const body = b64e(JSON.stringify(d));
  return SAVEVER + '-' + sumOf(body) + '-' + body;
}

// Nhập mã vào PG + SET (ghi đè tại chỗ). Trả {ok, msg}. KHÔNG tự lưu — người gọi lo.
export function importSave(code, PG, SET, stageCount) {
  code = (code || '').trim().replace(/\s+/g, '');
  const p1 = code.split('-');
  if (p1.length < 3 || p1[0] !== SAVEVER) return { ok: 0, msg: 'Mã không đúng định dạng' };
  const body = p1.slice(2).join('-');
  if (sumOf(body) !== p1[1]) return { ok: 0, msg: 'Mã bị sai hoặc thiếu ký tự' };
  let d;
  try {
    d = JSON.parse(b64d(body));
  } catch {
    return { ok: 0, msg: 'Không đọc được mã' };
  }
  if (!d || typeof d.u !== 'number') return { ok: 0, msg: 'Mã không hợp lệ' };
  PG.unlocked = Math.max(1, Math.min(stageCount, d.u));
  PG.cleared = {};
  if (typeof d.c === 'string')
    for (let i = 0; i < d.c.length; i++) if (d.c[i] === '1') PG.cleared[i + 1] = true;
  PG.coins = Math.max(0, d.m | 0);
  if (Array.isArray(d.g))
    GEAR_KEYS.forEach((k, i) => {
      if (typeof d.g[i] === 'number') PG[k] = d.g[i];
    });
  PG.run = d.r && typeof d.r.si === 'number' ? d.r : null;
  if (typeof d.d === 'number') SET.diff = Math.max(0, Math.min(2, d.d));
  return { ok: 1, msg: 'Đã khôi phục: mở tới cửa ' + PG.unlocked + ' • 🪙' + PG.coins };
}
