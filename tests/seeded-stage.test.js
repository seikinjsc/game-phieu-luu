import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createHarness } from '../tools/harness.mjs';
import { makeRng } from '../src/core/rng.js';

// PROOF-OF-CONCEPT tính khả thi chế độ thi đấu: cùng "seed" → cùng màn chơi.
// Toàn bộ ngẫu nhiên của game đi qua Math.random (trực tiếp, hoặc gián tiếp qua rnd()).
// Ở đây ta GIEO HẠT vào Math.random rồi chạy cùng một cửa 2 lần với cùng seed và khẳng
// định bố trí vật cản/quái sinh ra là Y HỆT. Đây là bằng chứng: chỉ cần thay Math.random
// gameplay bằng bộ RNG gieo hạt là hai máy sẽ có cùng đường đua.
const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

describe('POC seeded stage: cùng seed → cùng màn chơi', () => {
  let h;
  const realRandom = Math.random;
  beforeAll(async () => {
    h = await createHarness(GAME);
  });
  afterAll(() => {
    Math.random = realRandom; // trả lại như cũ để không ảnh hưởng test khác
  });

  // Chạy một cửa với seed cho trước, ghi lại CHUỖI vật cản & quái sinh ra (theo thứ tự xuất hiện).
  function recordStage(seed, si, frames) {
    const rng = makeRng(seed);
    Math.random = () => rng.next(); // gieo hạt cho toàn bộ ngẫu nhiên của game
    h.setSkin(0);
    h.startStage(si);
    const G = h.state();
    G.hearts = 9999; // không chết → chuỗi sinh ổn định
    const seenO = new Set(),
      seenM = new Set();
    const obs = [],
      mobs = [];
    for (let f = 0; f < frames; f++) {
      h.frames(1);
      for (const o of G.obs)
        if (!seenO.has(o)) {
          seenO.add(o);
          obs.push(o.type + '@' + Math.round(o.by ?? o.y) + 'w' + o.w);
        }
      for (const m of G.mobs)
        if (!seenM.has(m)) {
          seenM.add(m);
          mobs.push(m.type + '@' + Math.round(m.by ?? m.y));
        }
    }
    return { obs, mobs };
  }

  // Dùng cửa KHÔNG có vực (đất 8, vũ trụ 21, băng 31) để người chơi đứng yên vẫn sống,
  // sinh đủ nhiều vật cản mà kiểm. (Cửa có vực vẫn tái lập được, chỉ kết thúc sớm.)
  it('hai lượt cùng seed cho bố trí vật cản & quái y hệt (cửa 8 — đất)', () => {
    const a = recordStage(12345, 7, 500);
    const b = recordStage(12345, 7, 500);
    expect(a.obs.length).toBeGreaterThan(3); // có sinh thật sự
    expect(a.obs).toEqual(b.obs);
    expect(a.mobs).toEqual(b.mobs);
  });

  it('seed khác → màn chơi khác', () => {
    const a = recordStage(1, 7, 500);
    const c = recordStage(999, 7, 500);
    expect(a.obs).not.toEqual(c.obs);
  });

  it('tái lập được ở nhiều thế giới (đất/vũ trụ/băng)', () => {
    for (const si of [7, 20, 30]) {
      const a = recordStage(777, si, 800);
      const b = recordStage(777, si, 800);
      expect(a.obs.length, 'cửa ' + (si + 1)).toBeGreaterThan(3);
      expect(a.obs, 'cửa ' + (si + 1)).toEqual(b.obs);
      expect(a.mobs, 'cửa ' + (si + 1)).toEqual(b.mobs);
    }
  });
});
