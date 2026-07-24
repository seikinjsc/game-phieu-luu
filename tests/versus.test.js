import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createHarness } from '../tools/harness.mjs';

// Chế độ Đấu 2 người: hai người chơi CÙNG một cửa với CÙNG mã đua → phải CÙNG bố trí vật cản
// (course công bằng) DÙ họ chơi khác nhau (nhảy khác, đè chết quái khác). Đây là điều then chốt:
// luồng ngẫu nhiên vật cản tách riêng nên hành động người chơi không làm lệch đường đua.
const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

describe('versus: cùng mã đua → cùng đường đua dù chơi khác nhau', () => {
  let h;
  beforeAll(async () => {
    h = await createHarness(GAME);
  });

  // Chạy một cửa ở CHẾ ĐỘ ĐẤU với mã `code`, theo kiểu chơi cho trước; ghi lại CHUỖI vật cản.
  function courseOf(code, si, frames, jumpEvery) {
    h.api.VS.on = true;
    h.api.seedGameplay(code);
    h.setSkin(0);
    h.startStage(si);
    const G = h.state();
    G.hearts = 9999;
    const seen = new Set(),
      obs = [];
    for (let f = 0; f < frames; f++) {
      if (jumpEvery && f % jumpEvery === 0) h.jump();
      h.frames(1);
      for (const o of G.obs)
        if (!seen.has(o)) {
          seen.add(o);
          obs.push(o.type + '@' + Math.round(o.by ?? o.y) + 'w' + o.w);
        }
    }
    h.api.VS.on = false;
    h.api.unseedGameplay();
    return obs;
  }

  it('người 1 (không nhảy) và người 2 (nhảy liên tục) gặp CÙNG bố trí vật cản', () => {
    const p1 = courseOf('KV7Q', 7, 600, 0); // đứng yên
    const p2 = courseOf('KV7Q', 7, 600, 9); // nhảy liên tục (đè quái, đổi hiệu ứng)
    expect(p1.length).toBeGreaterThan(3);
    expect(p1).toEqual(p2);
  });

  it('mã đua khác → đường đua khác', () => {
    const a = courseOf('AAAA', 7, 600, 0);
    const c = courseOf('ZZZZ', 7, 600, 0);
    expect(a).not.toEqual(c);
  });

  it('tái lập ở nhiều thế giới (đất/vũ trụ/băng), bất kể cách chơi', () => {
    for (const si of [7, 20, 30]) {
      const a = courseOf('DUA9', si, 600, 0);
      const b = courseOf('DUA9', si, 600, 7);
      expect(a.length, 'cửa ' + (si + 1)).toBeGreaterThan(3);
      expect(a, 'cửa ' + (si + 1)).toEqual(b);
    }
  });

  it('trọn trận không làm hỏng tiến trình thật (xu/mở khoá/gear giữ nguyên)', () => {
    const PG = h.progress();
    PG.coins = 500;
    PG.unlocked = 45;
    PG.weapon = 2;
    PG.wDur = 30;
    const before = { coins: PG.coins, unlocked: PG.unlocked, weapon: PG.weapon, wDur: PG.wDur };

    // đấu ở cửa cống (có vực) → đứng yên sẽ rơi → cửa kết thúc → luồng đấu tự sang lượt
    h.api.VS.pickSi = 40; // cửa 41 (cống, có vực)
    h.api.vsStart();
    expect(h.api.VS.on).toBe(true);
    for (let turn = 1; turn <= 2; turn++) {
      h.api.vsBeginRun();
      // chạy tới khi lượt kết thúc (rơi vực / hết tim → endStage → sang lượt sau)
      for (let f = 0; f < 900 && h.api.VS.turn === turn && h.api.VS.on; f++) h.frames(1);
    }
    // xong 2 lượt → có kết quả cả hai, VS tắt
    expect(h.api.VS.res[0]).toBeTruthy();
    expect(h.api.VS.res[1]).toBeTruthy();
    expect(h.api.VS.on).toBe(false);

    // tiến trình thật KHÔNG đổi
    const PG2 = h.progress();
    expect(PG2.coins).toBe(before.coins);
    expect(PG2.unlocked).toBe(before.unlocked);
    expect(PG2.weapon).toBe(before.weapon);
    expect(PG2.wDur).toBe(before.wDur);
  });
});
