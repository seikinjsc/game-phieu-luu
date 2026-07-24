import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { createHarness } from '../tools/harness.mjs';

// Chia đôi màn (2 người 1 máy, cùng lúc): kiểm chứng LOGIC (harness không vẽ thật).
// - Hai người chạy CÙNG đường đua (cùng seed) dù chơi khác nhau (P1 nhảy, P2 không).
// - Trọn ván không làm hỏng tiến trình thật.
const GAME = fileURLToPath(new URL('../legacy/game-be-phieu-luu-v32.html', import.meta.url));

const newObs = (g, seen) => {
  const out = [];
  for (const o of g.obs)
    if (!seen.has(o)) {
      seen.add(o);
      out.push(o.type + '@' + Math.round(o.by ?? o.y) + 'w' + o.w);
    }
  return out;
};

describe('split-screen: 2 người cùng lúc', () => {
  let h;
  beforeAll(async () => {
    h = await createHarness(GAME);
  });

  it('cùng đường đua dù P1 nhảy, P2 đứng yên (cửa 8 — đất)', () => {
    const PG = h.progress();
    PG.coins = 300;
    PG.unlocked = 20;
    h.api.startSplit(7);
    const SP = h.api.SP;
    SP.g1.hearts = 9999;
    SP.g2.hearts = 9999; // không chết → chạy dài để so course
    const s1 = new Set(),
      s2 = new Set(),
      c1 = [],
      c2 = [];
    for (let f = 0; f < 700; f++) {
      if (f % 9 === 0) h.api.splitKey('ArrowUp', true, false); // chỉ P1 nhảy
      if (f % 9 === 3) h.api.splitKey('ArrowUp', false, false);
      h.api.dualSim(1 / 60);
      c1.push(...newObs(SP.g1, s1));
      c2.push(...newObs(SP.g2, s2));
    }
    expect(SP.g1.dist).toBeGreaterThan(0);
    expect(SP.g2.dist).toBeGreaterThan(0);
    expect(c1.length).toBeGreaterThan(3);
    expect(c1).toEqual(c2); // cùng đường đua
    h.api.SP.on = false;
  });

  it('trọn ván không làm hỏng tiến trình thật', () => {
    const PG = h.progress();
    PG.coins = 800;
    PG.unlocked = 50;
    PG.weapon = 2;
    PG.wDur = 25;
    const before = { coins: PG.coins, unlocked: PG.unlocked, weapon: PG.weapon, wDur: PG.wDur };

    h.api.startSplit(40); // cửa 41 (cống, có vực) → đứng yên sẽ rơi → cả hai kết thúc
    const SP = h.api.SP;
    for (let f = 0; f < 1200 && SP.on; f++) h.api.dualSim(1 / 60);

    expect(SP.on).toBe(false);
    expect(SP.res[0]).toBeTruthy();
    expect(SP.res[1]).toBeTruthy();

    const PG2 = h.progress();
    expect(PG2.coins).toBe(before.coins);
    expect(PG2.unlocked).toBe(before.unlocked);
    expect(PG2.weapon).toBe(before.weapon);
    expect(PG2.wDur).toBe(before.wDur);
  });
});
