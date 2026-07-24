import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createHarness } from '../tools/harness.mjs';

// Kiểm chứng cơ chế lưu MỚI trong legacy: ô lưu đặt tên (localStorage) + xuất/nhập TỆP.
// Định dạng BPL1 giữ nguyên nên vẫn tương thích ô dán mã cũ (đã kiểm ở save-compat.test).
const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

describe('save-ux: ô lưu đặt tên + xuất/nhập tệp', () => {
  let h;
  beforeAll(async () => {
    h = await createHarness(GAME);
  });

  it('ô lưu: thêm → liệt kê → nạp khôi phục đúng tiến trình', () => {
    const PG = h.progress();
    PG.unlocked = 33;
    PG.coins = 777;
    const name = h.api.slotAdd('Bản của bé');
    expect(name).toBe('Bản của bé');
    const list = h.api.slotsLoad();
    expect(list[0].name).toBe('Bản của bé');
    expect(list[0].code.startsWith('BPL1-')).toBe(true);

    PG.unlocked = 1;
    PG.coins = 0;
    expect(h.api.importSave(list[0].code).ok).toBe(1);
    expect(h.progress().unlocked).toBe(33);
    expect(h.progress().coins).toBe(777);
  });

  it('ô lưu: tên trống thì tự đặt theo cửa+xu; xoá được', () => {
    const before = h.api.slotsLoad().length;
    h.progress().unlocked = 12;
    h.progress().coins = 50;
    const nm = h.api.slotAdd('');
    expect(nm).toContain('Cửa 12');
    expect(h.api.slotsLoad().length).toBe(before + 1);
    h.api.slotDel(0);
    expect(h.api.slotsLoad().length).toBe(before);
  });

  it('xuất TỆP: tạo tệp chứa mã BPL1', () => {
    h.progress().unlocked = 20;
    h.progress().coins = 99;
    expect(h.api.saveToFile()).toBe(true);
    expect(h.lastSaveBlob().startsWith('BPL1-')).toBe(true);
  });

  it('mở TỆP: đọc nội dung tệp rồi nhập, khôi phục tiến trình', () => {
    h.progress().unlocked = 45;
    h.progress().coins = 321;
    const code = h.api.saveToFile() && h.lastSaveBlob();

    h.progress().unlocked = 2;
    h.progress().coins = 5;
    let result = null;
    h.api.loadFromFile((r) => (result = r));
    const kids = globalThis.document.body.kids;
    const inp = kids[kids.length - 1]; // input file vừa được tạo
    inp.files = [{ _text: code }];
    inp.onchange();

    expect(result && result.ok).toBe(1);
    expect(h.progress().unlocked).toBe(45);
    expect(h.progress().coins).toBe(321);
  });
});
