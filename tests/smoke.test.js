import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createHarness } from '../tools/harness.mjs';

const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

// Chạy toàn bộ 60 cửa × 3 bộ đồ hoạ, mỗi cửa 200 khung hình.
// Khẳng định: không ngoại lệ và audioErrors() rỗng (bắt lại lỗi lịch sử #2 —
// tham số âm thanh âm/NaN làm Web Audio ném lỗi và chết tiếng).
describe('smoke: 60 cửa × 3 skin', () => {
  let h;
  beforeAll(async () => {
    h = await createHarness(GAME);
  });

  for (let skin = 0; skin < 3; skin++) {
    it(`skin ${skin}: mọi cửa chạy 200 khung không lỗi, không lỗi audio`, () => {
      const bad = [];
      h.setSkin(skin);
      for (let si = 0; si < 60; si++) {
        h.resetAudioErrors();
        try {
          h.startStage(si);
          // xen thao tác để kích hoạt SFX nhảy/chém/đáp
          for (let c = 0; c < 4; c++) {
            h.jump();
            h.frames(30);
            h.attack();
            h.frames(20);
          }
        } catch (e) {
          bad.push(`cửa ${si + 1}: ngoại lệ ${e.message}`);
          continue;
        }
        const ae = h.audioErrors();
        if (ae.length) bad.push(`cửa ${si + 1}: audio ${ae[0]}`);
      }
      expect(bad, bad.join('\n')).toEqual([]);
    });
  }
});
