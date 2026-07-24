import { describe, it, expect } from 'vitest';
import { GY, H, CEIL, CEIL3 } from '../src/data/stages.js';
import { PHYSICS, WORLDKEY, worldKeyOf, advanceScroll } from '../src/systems/physics.js';
import { bossPhase, bossHp } from '../src/systems/boss.js';
import { aabb, applyHit } from '../src/systems/combat.js';
import { obstacleY, obstacleGap, spawnInterval } from '../src/systems/spawner.js';

const baseG = (over = {}) => ({
  kid: { y: GY, vy: 0, air: false, ph: 0, dj: 0 },
  kx: 180,
  mvL: 0,
  mvR: 0,
  mvD: 0,
  hold: false,
  pw: { bal: 0, bo: 0, sh: false },
  gv: 1,
  gvCd: 0,
  t: 0,
  dist: 0,
  worldX: 0,
  speed: 0,
  vspd: 0,
  phase: 0,
  inv: 0,
  shake: 0,
  hearts: 3,
  obs: [],
  mobs: [],
  items: [],
  fx: [],
  shots: [],
  pil: [],
  o2: 30,
  o2T: 0,
  bubT: 99,
  wm: 40,
  wmT: 0,
  fireT: 99,
  frz: 0,
  wind: 0,
  windT: 99,
  windDir: 0,
  kvx: 0,
  en: 100,
  enM: 100,
  leafT: 99,
  vine: null,
  coyote: 0,
  jbuf: 0,
  fell: 0,
  ...over,
});

describe('physics: bảng dispatch 6 thế giới', () => {
  it('có đủ 6 nhánh, khớp WORLDKEY', () => {
    expect(WORLDKEY).toEqual(['land', 'sea', 'space', 'ice', 'sewer', 'jungle']);
    WORLDKEY.forEach((k) => expect(typeof PHYSICS[k]).toBe('function'));
  });
  it('worldKeyOf ánh xạ đúng cờ thế giới', () => {
    expect(worldKeyOf({})).toBe('land');
    expect(worldKeyOf({ water: 1 })).toBe('sea');
    expect(worldKeyOf({ space: 1 })).toBe('space');
    expect(worldKeyOf({ ice: 1 })).toBe('ice');
    expect(worldKeyOf({ sewer: 1 })).toBe('sewer');
    expect(worldKeyOf({ jungle: 1 })).toBe('jungle');
  });
});

describe('physics: trọng lực từng thế giới', () => {
  it('land — đứng yên trên đất thì ở nguyên GY', () => {
    const G = baseG();
    for (let i = 0; i < 5; i++) PHYSICS.land(G, 0.016, {});
    expect(G.kid.y).toBe(GY);
    expect(G.kid.air).toBe(false);
  });

  it('land — rơi tự do g=1900; giữ nút thì g=950', () => {
    const G = baseG({ kid: { y: GY - 200, vy: -640, air: true, ph: 0, dj: 0 } });
    PHYSICS.land(G, 0.1, {});
    expect(G.kid.vy).toBeCloseTo(-640 + 1900 * 0.1, 6); // -450
    const G2 = baseG({ kid: { y: GY - 200, vy: -640, air: true, ph: 0, dj: 0 }, hold: true });
    PHYSICS.land(G2, 0.1, {});
    expect(G2.kid.vy).toBeCloseTo(-640 + 950 * 0.1, 6); // -545 (nhảy cao khi giữ)
  });

  it('space — trọng lực nhẹ hơn; đảo trọng lực đổi sàn sang trần', () => {
    const up = baseG({ kid: { y: GY - 100, vy: -430, air: true, ph: 0, dj: 0 } });
    PHYSICS.space(up, 0.1, { space: 1 });
    expect(up.kid.vy).toBeCloseTo(-430 + 760 * 1 * 0.1, 6); // -354, g=760 (nhẹ hơn land)
    const inv = baseG({ gv: -1, kid: { y: CEIL3, vy: 0, air: false, ph: 0, dj: 0 } });
    PHYSICS.space(inv, 0.1, { space: 1 });
    expect(inv.kid.y).toBe(CEIL3); // đứng trên TRẦN khi trọng lực đảo
    expect(inv.kid.air).toBe(false);
  });

  it('sea — lực nổi kéo lên khi GIỮ nút', () => {
    const G = baseG({ kid: { y: GY, vy: 0, air: false, ph: 0, dj: 0 }, hold: true });
    PHYSICS.sea(G, 0.1, { water: 1 }, { ADM: { o2: 1 } });
    expect(G.kid.vy).toBeCloseTo(-235 * Math.min(1, 0.1 * 5.2), 6); // bơi lên
    expect(G.kid.air).toBe(true);
  });

  it('ice — trượt theo quán tính, kẹp trong [95,340]', () => {
    const G = baseG({ mvR: 1 });
    for (let i = 0; i < 30; i++) PHYSICS.ice(G, 0.05, { ice: 1 });
    expect(G.kx).toBeGreaterThan(180); // đã trượt sang phải
    expect(G.kx).toBeLessThanOrEqual(340);
    expect(G.kx).toBeGreaterThanOrEqual(95);
  });

  it('sewer — rơi xuống vực (gap) là thua: gọi endStage', () => {
    let ended = 0;
    const G = baseG({
      kid: { y: H, vy: 0, air: true, ph: 0, dj: 0 },
      obs: [{ gap: 1, x: 80, y: GY, w: 200, h: 8 }],
    });
    for (let i = 0; i < 8 && !G.fell; i++)
      PHYSICS.sewer(G, 0.1, { sewer: 1 }, { endStage: () => ended++ });
    expect(G.fell).toBe(1);
    expect(ended).toBe(1);
  });
});

describe('boss: giai đoạn theo tỉ lệ, chỉ tăng (bug #3, #4)', () => {
  it('ngưỡng theo tỉ lệ máu', () => {
    expect(bossPhase(42, 42)).toBe(1); // 100% → GĐ1
    expect(bossPhase(20, 42)).toBe(2); // ~48% → GĐ2
    expect(bossPhase(10, 42)).toBe(3); // ~24% → GĐ3
  });
  it('chỉ tăng, không lùi khi trùm hồi máu', () => {
    expect(bossPhase(42, 42, 3)).toBe(3); // hồi đầy nhưng đã ở GĐ3 → giữ GĐ3
    expect(bossPhase(30, 42, 2)).toBe(2); // hồi lên >66% nhưng prev=2 → giữ 2
  });
  it('bossHp nhân hệ số độ khó, làm tròn', () => {
    expect(bossHp('dragon', 1)).toBe(12);
    expect(bossHp('monkey', 1.4)).toBe(59); // round(58.8)
    expect(bossHp('kraken', 0.8)).toBe(18); // round(17.6)
  });
});

describe('combat: aabb + applyHit', () => {
  it('aabb phát hiện chồng hộp', () => {
    expect(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 })).toBe(false);
  });
  it('khiên đỡ đòn đầu, không mất tim', () => {
    const G = baseG({ pw: { sh: true, bal: 0, bo: 0 }, hearts: 3 });
    const took = applyHit(G, {});
    expect(took).toBe(true);
    expect(G.hearts).toBe(3);
    expect(G.pw.sh).toBe(false);
  });
  it('đang bất tử thì bỏ qua đòn', () => {
    const G = baseG({ inv: 1, hearts: 3 });
    expect(applyHit(G, {})).toBe(false);
    expect(G.hearts).toBe(3);
  });
  it('mất tim; hết tim thì gọi endStage', () => {
    let ended = 0;
    const G = baseG({ hearts: 1 });
    applyHit(G, { endStage: () => ended++ });
    expect(G.hearts).toBe(0);
    expect(ended).toBe(1);
  });
});

describe('spawner: đặt cao độ & giãn cách', () => {
  const C = { GY, CEIL, CEIL3 };
  it('obstacleY đặt đúng vị trí theo loại', () => {
    expect(obstacleY({ top: 1 }, 'icicle', {}, () => 0, C)).toBe(CEIL); // treo trần đất
    expect(obstacleY({ top: 1 }, 'crystalT', { space: 1 }, () => 0, C)).toBe(CEIL3); // treo trần vũ trụ
    expect(obstacleY({}, 'lowPipe', {}, () => 0, C)).toBe(0); // mọc từ trên xuống
    expect(obstacleY({ h: 44 }, 'box', {}, () => 0, C)).toBe(GY - 44); // đứng trên đất
    expect(obstacleY({ fly: 1 }, 'bird', {}, () => 0, C)).toBe(GY - 186); // bay thấp
  });
  it('obstacleGap: cửa càng sâu (p lớn) càng dày, và chờ theo tốc độ', () => {
    const rnd0 = () => 0;
    const near = obstacleGap(200, 1.4, 0, 0, rnd0, 1);
    const far = obstacleGap(200, 1.4, 1, 0, rnd0, 1);
    expect(far).toBeLessThan(near); // p=1 → khoảng cách nhỏ hơn → dày hơn
    expect(spawnInterval(300, 150)).toBeCloseTo(2, 6);
    expect(spawnInterval(300, 30)).toBeCloseTo(5, 6); // vspd kẹp tối thiểu 60
  });
});

describe('physics: advanceScroll không đổi khi refactor', () => {
  it('quãng đường tăng theo công thức tốc độ', () => {
    const G = baseG();
    const stage = { sp: [130, 165, 200], goal: 350 };
    advanceScroll(G, 0.1, stage, { admSpd: 1, diffSp: 1 });
    // p=0 → speed=130; vspd=130; dist += 130*0.1/25 = 0.52
    expect(G.speed).toBe(130);
    expect(G.dist).toBeCloseTo(0.52, 9);
    expect(G.worldX).toBeCloseTo(13, 9);
  });
});
