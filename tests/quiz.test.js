import { describe, it, expect } from 'vitest';
import { makeQuiz, DELAY } from '../src/systems/quiz.js';

const pool = (n) => Array.from({ length: n }, (_, i) => 'q' + i);

describe('systems/quiz: hộp Leitner', () => {
  it('trả lời đúng thì lên hộp, tối đa hộp 3', () => {
    const q = makeQuiz(1);
    expect(q.boxOf('a')).toBe(1); // chưa gặp bao giờ = hộp 1
    expect(q.answer('a', true)).toBe(2);
    expect(q.answer('a', true)).toBe(3);
    expect(q.answer('a', true)).toBe(3); // không vượt quá 3
  });

  it('trả lời sai thì RƠI THẲNG về hộp 1, không lùi từng bậc', () => {
    const q = makeQuiz(1);
    q.answer('a', true);
    q.answer('a', true);
    expect(q.boxOf('a')).toBe(3);
    expect(q.answer('a', false)).toBe(1);
  });

  it('câu SAI được gặp lại sớm hơn hẳn câu đã thuộc', () => {
    const q = makeQuiz(42);
    const ids = pool(10);
    // 'q0' luôn sai, các câu còn lại luôn đúng
    for (let i = 0; i < 300; i++) {
      const id = q.pick(ids);
      q.answer(id, id !== 'q0');
    }
    const q2 = makeQuiz(42);
    const dem = {};
    for (let i = 0; i < 300; i++) {
      const id = q2.pick(ids);
      dem[id] = (dem[id] || 0) + 1;
      q2.answer(id, id !== 'q0');
    }
    const khac = ids.filter((i) => i !== 'q0').map((i) => dem[i] || 0);
    const tbKhac = khac.reduce((a, b) => a + b, 0) / khac.length;
    // Đây là toàn bộ lý do hộp Leitner tồn tại: câu yếu phải quay lại nhiều hơn.
    expect(dem['q0']).toBeGreaterThan(tbKhac * 1.5);
  });

  it('luôn bốc được câu, kể cả kho chỉ có 1 câu (không bao giờ để kẹt mê cung)', () => {
    const q = makeQuiz(3);
    for (let i = 0; i < 50; i++) {
      const id = q.pick(['duy-nhat']);
      expect(id).toBe('duy-nhat');
      q.answer(id, true); // dù đã lên hộp 3 và chưa tới hạn, vẫn phải trả về được
    }
  });

  it('kho rỗng trả null thay vì ném lỗi', () => {
    expect(makeQuiz(1).pick([])).toBe(null);
    expect(makeQuiz(1).pick(null)).toBe(null);
  });

  it('chỉ bốc id nằm trong kho được đưa vào', () => {
    const q = makeQuiz(9);
    const ids = pool(12);
    for (let i = 0; i < 200; i++) expect(ids).toContain(q.pick(ids));
  });

  it('không lặp lại câu vừa ra khi kho đủ lớn', () => {
    const q = makeQuiz(5);
    const ids = pool(20);
    let truoc = null;
    for (let i = 0; i < 200; i++) {
      const id = q.pick(ids);
      expect(id).not.toBe(truoc);
      truoc = id;
      q.answer(id, true);
    }
  });

  it('cùng hạt → cùng chuỗi câu', () => {
    const chay = (seed) => {
      const q = makeQuiz(seed);
      const ids = pool(15);
      return Array.from({ length: 40 }, () => {
        const id = q.pick(ids);
        q.answer(id, true);
        return id;
      });
    };
    expect(chay(77)).toEqual(chay(77));
    expect(chay(77)).not.toEqual(chay(78));
  });

  it('state/load giữ nguyên tiến trình (để nhét vào mã lưu BPL2)', () => {
    const q = makeQuiz(11);
    const ids = pool(15);
    for (let i = 0; i < 30; i++) {
      const id = q.pick(ids);
      q.answer(id, i % 3 !== 0);
    }
    const s = JSON.parse(JSON.stringify(q.state())); // đúng như save.js sẽ làm

    const q2 = makeQuiz(11);
    q2.load(s);
    expect(q2.state()).toEqual(s);
    for (const id of ids) expect(q2.boxOf(id)).toBe(q.boxOf(id));
  });

  it('load bỏ qua dữ liệu hỏng thay vì chết', () => {
    const q = makeQuiz(1);
    expect(() => q.load(null)).not.toThrow();
    expect(() => q.load('rác')).not.toThrow();
    expect(() => q.load({ boxes: null, due: undefined, recent: 'sai kiểu' })).not.toThrow();
    expect(q.boxOf('a')).toBe(1);
  });

  it('bảng giãn cách tăng dần theo hộp', () => {
    expect(DELAY[1]).toBeLessThan(DELAY[2]);
    expect(DELAY[2]).toBeLessThan(DELAY[3]);
  });
});
