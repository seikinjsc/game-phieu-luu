import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createHarness } from '../tools/harness.mjs';

// Bug "dơi chương 6": quái biết LAO (batX/owl/drone/orb) đặt m.by=m.y khi lao, nhưng vòng lặp
// vẫn cộng dao động sin lên → vòng phản hồi làm m.by trôi khỏi màn hình → quái biến mất đột ngột.
// Đã sửa: không áp dao động khi đang lao. Test này ép quái lao giữa màn và khẳng định y không trôi.
const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

describe('mob: quái lao không trôi khỏi màn hình', () => {
  let h;
  beforeAll(async () => {
    h = await createHarness(GAME);
  });

  // Ép một quái lao ngay giữa màn hình (đặt st vượt ngưỡng), trả về khoảng y khi còn hiện.
  function diveY(type, si, st) {
    h.setSkin(0);
    h.startStage(si);
    const G = h.state();
    G.hearts = 9999;
    G.mobT = 9999;
    const m = {
      type,
      x: 500,
      w: 50,
      h: 40,
      hp: 3,
      mhp: 3,
      fly: 1,
      ph: 0,
      lastHit: -1,
      dead: 0,
      by: 200,
      y: 200,
      st,
    };
    G.mobs.length = 0;
    G.mobs.push(m);
    let minY = Infinity,
      maxY = -Infinity;
    for (let f = 0; f < 45; f++) {
      h.frames(1);
      if (G.mobs.indexOf(m) < 0) break;
      if (m.x > -60 && m.x < 960) {
        minY = Math.min(minY, m.y);
        maxY = Math.max(maxY, m.y);
      }
    }
    return { minY, maxY };
  }

  // Màn hình cao 500; cho biên ±60. Bug cũ khiến y trôi tới ~627 hoặc ~-156.
  it.each([
    ['batX', 52, 1.7],
    ['owl', 32, 2.1],
    ['drone', 22, 2.2],
    ['orb', 24, 2.2],
  ])('%s lao mà y vẫn trong màn hình', (type, si, st) => {
    const r = diveY(type, si, st);
    expect(r.minY, type + ' trôi lên').toBeGreaterThan(-60);
    expect(r.maxY, type + ' trôi xuống').toBeLessThan(560);
  });
});
