import { describe, it, expect } from 'vitest';
import { ST, worldOf } from '../src/data/stages.js';
import { OBS, COMPOSITE_OBS } from '../src/data/obstacles.js';
import { MOB } from '../src/data/mobs.js';
import { DIFF } from '../src/data/difficulty.js';

describe('dữ liệu cửa ải (ST)', () => {
  it('có đúng 60 cửa', () => {
    expect(ST).toHaveLength(60);
  });

  it('n tăng dần liên tục 1..60', () => {
    ST.forEach((s, i) => expect(s.n).toBe(i + 1));
  });

  it('mỗi thế giới đúng 10 cửa', () => {
    const count = [0, 0, 0, 0, 0, 0];
    ST.forEach((_, i) => count[worldOf(i)]++);
    expect(count).toEqual([10, 10, 10, 10, 10, 10]);
  });

  it('cửa thường có goal>0; cửa trùm không có goal mà có tên trùm', () => {
    ST.forEach((s) => {
      if (s.boss) {
        expect(s.goal).toBeUndefined();
        expect(typeof s.boss).toBe('string');
      } else {
        expect(s.goal).toBeGreaterThan(0);
      }
    });
  });

  it('sp là 3 số tăng dần', () => {
    ST.forEach((s) => {
      expect(s.sp).toHaveLength(3);
      expect(s.sp[0]).toBeLessThan(s.sp[1]);
      expect(s.sp[1]).toBeLessThan(s.sp[2]);
    });
  });

  it('mọi tên vật cản trong ST tồn tại trong OBS (hoặc là vật ghép)', () => {
    ST.forEach((s) => {
      s.obs.forEach((name) => {
        const ok = name in OBS || COMPOSITE_OBS.includes(name);
        expect(ok, `vật cản "${name}" (cửa ${s.n}) không có trong OBS`).toBe(true);
      });
    });
  });

  it('mọi tên quái trong ST tồn tại trong MOB', () => {
    ST.forEach((s) => {
      s.mobs.forEach((name) => {
        expect(name in MOB, `quái "${name}" (cửa ${s.n}) không có trong MOB`).toBe(true);
      });
    });
  });
});

describe('độ khó (DIFF)', () => {
  it('có đúng 3 mức', () => {
    expect(DIFF).toHaveLength(3);
  });
});
