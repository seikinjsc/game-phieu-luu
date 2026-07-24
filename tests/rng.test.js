import { describe, it, expect } from 'vitest';
import { makeRng, mulberry32, hashSeed } from '../src/core/rng.js';

describe('core/rng: bộ ngẫu nhiên gieo hạt', () => {
  it('cùng seed → cùng chuỗi (tất định)', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('seed khác → chuỗi khác', () => {
    const take = (r, n) => Array.from({ length: n }, () => r.next());
    expect(take(makeRng(1), 10)).not.toEqual(take(makeRng(2), 10));
  });

  it('seed bằng chuỗi cũng tất định; cùng chuỗi → cùng hạt', () => {
    expect(hashSeed('KV7Q')).toBe(hashSeed('KV7Q'));
    expect(hashSeed('KV7Q')).not.toBe(hashSeed('KV7R'));
    const a = makeRng('đua-cua-5');
    const b = makeRng('đua-cua-5');
    expect(a.next()).toBe(b.next());
  });

  it('range/int nằm trong khoảng', () => {
    const r = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const x = r.range(10, 20);
      expect(x).toBeGreaterThanOrEqual(10);
      expect(x).toBeLessThan(20);
      const n = r.int(1, 6);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it('reseed đưa về đúng chuỗi ban đầu', () => {
    const r = makeRng(99);
    const first = [r.next(), r.next(), r.next()];
    r.reseed(99);
    expect([r.next(), r.next(), r.next()]).toEqual(first);
  });

  it('phân bố thô ổn (trung bình ~0.5)', () => {
    const g = mulberry32(123);
    let sum = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) sum += g();
    expect(sum / N).toBeGreaterThan(0.47);
    expect(sum / N).toBeLessThan(0.53);
  });
});
