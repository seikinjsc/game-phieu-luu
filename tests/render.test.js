import { describe, it, expect } from 'vitest';
import { hazePass, createPop, contactShadow, rr } from '../src/render/layers.js';
import { createRegistry, WORLDS, BOSSES, HERO_STYLES, HAZARDS } from '../src/render/registry.js';
import { layoutHUD, hudOverlaps, overlaps } from '../src/render/hud.js';

const mockCtx = () => {
  const calls = [];
  return {
    calls,
    save() {
      calls.push('save');
    },
    restore() {
      calls.push('restore');
    },
    fillRect() {
      calls.push('fillRect');
    },
    beginPath() {
      calls.push('beginPath');
    },
    moveTo() {},
    arcTo() {},
    closePath() {
      calls.push('closePath');
    },
    ellipse() {
      calls.push('ellipse');
    },
    fill() {
      calls.push('fill');
    },
  };
};

describe('render/layers', () => {
  it('hazePass phủ màu sương lên toàn nền', () => {
    const ctx = mockCtx();
    hazePass(ctx, 'rgba(1,2,3,.2)', 900, 500);
    expect(ctx.fillStyle).toBe('rgba(1,2,3,.2)');
    expect(ctx.calls).toContain('fillRect');
  });
  it('POP bọc save/restore và đặt bóng đổ', () => {
    const ctx = mockCtx();
    const pop = createPop(ctx);
    pop.on();
    expect(ctx.shadowBlur).toBe(7);
    expect(ctx.calls).toContain('save');
    pop.off();
    expect(ctx.calls).toContain('restore');
  });
  it('contactShadow vẽ ellipse mờ trong save/restore', () => {
    const ctx = mockCtx();
    contactShadow(ctx, 100, 30, 408);
    expect(ctx.calls).toEqual(['save', 'beginPath', 'ellipse', 'fill', 'restore']);
  });
  it('rr dựng path bo góc', () => {
    const ctx = mockCtx();
    rr(ctx, 0, 0, 10, 10, 3);
    expect(ctx.calls[0]).toBe('beginPath');
    expect(ctx.calls).toContain('closePath');
  });
});

describe('render/registry', () => {
  const fnMap = (keys) => Object.fromEntries(keys.map((k) => [k, () => {}]));
  const full = () => ({
    scene: fnMap(WORLDS),
    obs: fnMap(WORLDS),
    mob: fnMap(WORLDS),
    boss: fnMap(BOSSES),
    hero: fnMap(HERO_STYLES),
    item: () => {},
    hazard: fnMap(HAZARDS),
    palette: {},
  });

  it('lắp ráp GFX khi đủ mọi cột', () => {
    const gfx = createRegistry(full());
    expect(Object.keys(gfx)).toEqual(
      expect.arrayContaining(['scene', 'obs', 'mob', 'boss', 'hero', 'item', 'hazard', 'palette']),
    );
  });
  it('ném lỗi khi thiếu một thế giới trong scene', () => {
    const bad = full();
    delete bad.scene.jungle;
    expect(() => createRegistry(bad)).toThrow(/scene.*jungle/);
  });
  it('ném lỗi khi thiếu bộ đồ hoạ hero.blocky (lỗi #7)', () => {
    const bad = full();
    delete bad.hero.blocky;
    expect(() => createRegistry(bad)).toThrow(/hero.*blocky/);
  });
  it('ném lỗi khi item không phải hàm', () => {
    const bad = full();
    bad.item = null;
    expect(() => createRegistry(bad)).toThrow();
  });
});

describe('render/hud: bố cục không chồng ô (lỗi #9)', () => {
  it('overlaps(): chạm biên không tính là chồng', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 0, w: 10, h: 10 })).toBe(true);
  });

  it('cửa thường có thanh tiến độ; cửa trùm có thanh máu trùm', () => {
    const normal = layoutHUD({ world: 'land' }).map((c) => c.name);
    expect(normal).toContain('progress');
    expect(normal).not.toContain('bossbar');
    const boss = layoutHUD({ world: 'land', boss: true }).map((c) => c.name);
    expect(boss).toContain('bossbar');
    expect(boss).not.toContain('progress');
  });

  it('biển/băng/rừng có thanh tài nguyên; đất/vũ trụ/cống không', () => {
    for (const w of ['water', 'ice', 'jungle'])
      expect(layoutHUD({ world: w }).some((c) => c.name === 'resource')).toBe(true);
    for (const w of ['land', 'space', 'sewer'])
      expect(layoutHUD({ world: w }).some((c) => c.name === 'resource')).toBe(false);
  });

  it('cửa TRÙM DƯỚI NƯỚC 9 tim: thanh trùm & thanh oxy KHÔNG đè (đúng bug #9)', () => {
    const cells = layoutHUD({
      world: 'water',
      boss: true,
      hearts: 9,
      maxH: 6,
      chips: ['gv', 'shield'],
    });
    expect(cells.some((c) => c.name === 'bossbar')).toBe(true);
    expect(cells.some((c) => c.name === 'resource')).toBe(true);
    expect(hudOverlaps(cells)).toEqual([]);
  });

  it('không ô nào chồng nhau qua mọi cấu hình (6 thế giới × trùm × tim 2..9)', () => {
    const bad = [];
    for (const world of ['land', 'sea', 'space', 'ice', 'sewer', 'jungle'])
      for (const boss of [false, true])
        for (let hearts = 2; hearts <= 9; hearts++)
          for (const maxH of [hearts, 6]) {
            const cells = layoutHUD({
              world,
              boss,
              hearts,
              maxH,
              chips: ['gv', 'shield', 'balloon', 'boots'],
            });
            if (hudOverlaps(cells).length) bad.push(`${world} boss=${boss} tim=${hearts}`);
          }
    expect(bad).toEqual([]);
  });
});
