import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createHarness } from '../tools/harness.mjs';
import { advanceScroll } from '../src/systems/physics.js';
import { dtOf } from '../src/core/loop.js';

// KIỂM CHỨNG SPEC GIAI ĐOẠN 5: "so quãng đường sau 500 khung ở cửa 1 trước/sau khi
// tách — phải bằng nhau." Quãng đường do engine cuộn (advanceScroll) quyết định, độc lập
// với vật lý từng thế giới. Chạy legacy 500 khung (đặt hearts cao để không chết → dist
// thuần do cuộn) rồi so với advanceScroll tách ra, dùng CÙNG chuỗi dt.
const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

describe('physics parity: quãng đường cửa 1 sau 500 khung', () => {
  let h;
  beforeAll(async () => {
    h = await createHarness(GAME);
  });

  it('advanceScroll khớp legacy đến từng chữ số', () => {
    // legacy
    h.setSkin(0);
    h.startStage(0);
    h.state().hearts = 9999; // không chết vì va chạm → dist chỉ do cuộn
    h.frames(500);
    const legacyDist = h.state().dist;
    expect(legacyDist).toBeGreaterThan(0);

    // bản tách — CÙNG dữ liệu cửa, CÙNG chuỗi dt (harness: t += 16.7 mỗi khung)
    const stage = h.stages()[0];
    const G = { dist: 0, worldX: 0, t: 0, pw: { bo: 0 } };
    let last = 0,
      t = 0;
    for (let i = 0; i < 500; i++) {
      t += 16.7;
      const dt = dtOf(t, last);
      last = t;
      advanceScroll(G, dt, stage, { admSpd: 1, diffSp: 1 });
    }

    expect(G.dist).toBeCloseTo(legacyDist, 9);
  });
});
