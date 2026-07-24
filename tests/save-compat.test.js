import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createHarness } from '../tools/harness.mjs';
import { exportSave, importSave } from '../src/core/save.js';

// Mã lưu là HỢP ĐỒNG CÔNG KHAI: bản tách core/save.js phải tương thích TUYỆT ĐỐI
// với bộ đọc/ghi trong game legacy (mã cũ người chơi đang giữ vẫn phải nạp được).
const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

describe('save-compat: core/save.js ↔ legacy', () => {
  let h;
  beforeAll(async () => {
    h = await createHarness(GAME);
  });

  it('mã do legacy tạo → core/save.js đọc lại khớp', () => {
    const PGg = h.progress();
    PGg.unlocked = 44;
    PGg.coins = 999;
    PGg.cleared = { 1: true, 5: true };
    PGg.weapon = 3;
    PGg.aa = 2;
    PGg.coco = 1;
    h.settings().diff = 2;
    const code = h.api.exportSave();

    const PG2 = { cleared: {} };
    const SET2 = {};
    const r = importSave(code, PG2, SET2, h.stages().length);
    expect(r.ok).toBe(1);
    expect(PG2.unlocked).toBe(44);
    expect(PG2.coins).toBe(999);
    expect(PG2.weapon).toBe(3);
    expect(PG2.aa).toBe(2);
    expect(PG2.coco).toBe(1);
    expect(SET2.diff).toBe(2);
    expect(PG2.cleared).toEqual({ 1: true, 5: true });
  });

  it('mã do core/save.js tạo → legacy đọc lại khớp', () => {
    const PG = { unlocked: 22, coins: 321, cleared: { 2: true, 8: true }, run: null };
    // các ô trang bị legacy cần là số
    [
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
    ].forEach((k) => (PG[k] = 0));
    PG.iw = 2;
    PG.grip = 1;
    const code = exportSave(PG, { diff: 1 }, h.stages().length);

    const r = h.api.importSave(code);
    expect(r.ok).toBe(1);
    const PGg = h.progress();
    expect(PGg.unlocked).toBe(22);
    expect(PGg.coins).toBe(321);
    expect(PGg.iw).toBe(2);
    expect(PGg.grip).toBe(1);
    expect(h.settings().diff).toBe(1);
  });
});
