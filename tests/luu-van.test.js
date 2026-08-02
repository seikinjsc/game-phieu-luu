import { describe, it, expect } from 'vitest';
import { makeRun } from '../src/systems/maze-run.js';
import { solve } from '../src/systems/maze.js';
import { makeProgress, KHOA } from '../src/systems/progress.js';
import { nutTamDung, nutManChon, batNut } from '../src/ui/mecung-ui.js';
import { MAZE_DIFF } from '../src/data/difficulty.js';
import { BO_DE, timBoDe } from '../src/data/banks.js';

const khoGia = (banDau = null) => {
  const d = banDau ? { [KHOA]: banDau } : {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => (d[k] = String(v)) };
};

// Lái nhân vật đi một quãng có thật: nhặt xu, mở cửa, ăn đòn — rồi mới lưu.
function choiMotLuc(run, soCua = 1) {
  let cur = { ...run.maze.start };
  for (const g of run.maze.gates.slice(0, soCua)) {
    const duong = solve(run.maze, cur.x, cur.y, g.x, g.y);
    let k = 1,
      n = 0;
    while (k < duong.length && n++ < 20000) {
      if (run.pending) {
        run.resolve(true);
        continue;
      }
      const c = run.cell;
      if (c.x === duong[k].x && c.y === duong[k].y) {
        k++;
        continue;
      }
      run.step(1 / 60, { x: Math.sign(duong[k].x - c.x), y: Math.sign(duong[k].y - c.y) });
    }
    if (run.pending) run.resolve(true);
    cur = { x: g.x, y: g.y };
  }
  return run;
}

describe('maze-run: lưu và nạp lại ván đang chơi dở', () => {
  it('nạp lại thì MỌI thứ đúng như lúc lưu', () => {
    const a = choiMotLuc(makeRun(11, 1, { quai: 0 }), 2);
    const s = a.trangThai();
    const b = makeRun(11, 1, { quai: 0, nap: s });

    expect(b.cell).toEqual(a.cell);
    expect(b.x).toBeCloseTo(a.x, 6);
    expect(b.y).toBeCloseTo(a.y, 6);
    expect(b.facing).toEqual(a.facing);
    expect(b.keys).toBe(a.keys);
    expect(b.coins).toBe(a.coins);
    expect(b.stars).toBe(a.stars);
    expect(b.tim).toBe(a.tim);
    expect(b.time).toBeCloseTo(a.time, 6);
    expect(Array.from(b.seen)).toEqual(Array.from(a.seen));
  });

  it('cửa đã mở vẫn mở, xu đã nhặt không mọc lại', () => {
    const a = choiMotLuc(makeRun(11, 1, { quai: 0 }), 2);
    const b = makeRun(11, 1, { quai: 0, nap: a.trangThai() });
    for (const g of a.maze.gates) expect(b.isOpen(g.id)).toBe(a.isOpen(g.id));
    for (const p of a.maze.coins) {
      const i = p.y * a.maze.size + p.x;
      expect(b.hasCoin(i), `ô xu ${i}`).toBe(a.hasCoin(i));
    }
  });

  it('quái giữ nguyên máu và trạng thái sống/chết', () => {
    const a = makeRun(6, 2, { satThuong: 99 });
    const q0 = a.quai[0];
    q0.x = a.x;
    q0.y = a.y;
    a.chem(); // hạ gục con đầu tiên
    expect(q0.song).toBe(false);
    const b = makeRun(6, 2, { satThuong: 99, nap: a.trangThai() });
    expect(b.quai.map((q) => q.song)).toEqual(a.quai.map((q) => q.song));
  });

  it('nạp xong nhân vật KHÔNG nằm trong tường và đi tiếp được bình thường', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const a = choiMotLuc(makeRun(seed, 1, { quai: 0 }), 1);
      const b = makeRun(seed, 1, { quai: 0, nap: a.trangThai() });
      expect(b.maze.isWall(b.cell.x, b.cell.y), `hạt ${seed}`).toBe(false);
      for (let i = 0; i < 300; i++) {
        if (b.pending) {
          b.resolve(true);
          continue;
        }
        const h = b.hint();
        if (!h) break;
        const c = b.cell;
        b.step(1 / 60, { x: Math.sign(h.x - c.x), y: Math.sign(h.y - c.y) });
        expect(b.maze.isWall(b.cell.x, b.cell.y), `hạt ${seed} sau khi đi`).toBe(false);
      }
    }
  });

  // Dữ liệu lưu có thể là của bản cũ, hoặc bị sửa tay. THÀ CHƠI LẠI TỪ ĐẦU còn hơn vỡ game.
  it('dữ liệu lưu HỎNG thì bắt đầu ván mới, không ném lỗi', () => {
    for (const rac of [
      {},
      { cx: 'bậy', cy: null, mo: 'không phải mảng' },
      { cx: -99, cy: 9999, tim: -5, q: 'sai kiểu' },
      { thay: [1, 2, 3] }, // độ dài không khớp lưới
      { mo: ['id-không-có-thật'], xu: [99999] },
    ]) {
      const r = makeRun(3, 1, { nap: rac });
      expect(r.maze.isWall(r.cell.x, r.cell.y), JSON.stringify(rac)).toBe(false);
      expect(r.tim).toBeGreaterThan(0);
      expect(() => r.step(1 / 60, { x: 1, y: 0 })).not.toThrow();
    }
  });

  it('không lưu thứ suy ra được từ hạt giống — bản lưu phải gọn', () => {
    const s = choiMotLuc(makeRun(4, 1, { quai: 0 }), 1).trangThai();
    const chuoi = JSON.stringify(s);
    expect(chuoi).not.toContain('grid'); // mê cung dựng lại từ hạt, không lưu
    expect(chuoi).not.toContain('gates');
    expect(chuoi.length).toBeLessThan(6000);
  });
});

describe('progress: lưu ván và tiến trình ôn tập qua các buổi chơi', () => {
  it('ván đang dở sống qua lần mở game sau', () => {
    const kho = khoGia();
    const v1 = makeProgress(kho);
    expect(v1.van).toBe(null);
    v1.luuVan({ hat: 7, muc: 1, boDeId: 'toan', cap: '2', skin: 0, run: { t: 12 } });
    const v2 = makeProgress(kho);
    expect(v2.van.hat).toBe(7);
    expect(v2.van.cap).toBe('2');
    expect(v2.van.run.t).toBe(12);
  });

  // Đây là toàn bộ việc học tích luỹ được. Mất nó thì mỗi buổi bé lại ôn từ số không.
  it('tiến trình hộp Leitner cũng sống qua lần mở game sau', () => {
    const kho = khoGia();
    makeProgress(kho).luuQuiz({ n: 40, boxes: { 'm2-cong-nho': 3 }, due: {}, recent: [] });
    const v = makeProgress(kho);
    expect(v.quiz.n).toBe(40);
    expect(v.quiz.boxes['m2-cong-nho']).toBe(3);
  });

  it('luuVan(null) xoá hẳn bản lưu — không để lại bản lưu ma', () => {
    const kho = khoGia();
    const v = makeProgress(kho);
    v.luuVan({ hat: 1 });
    v.luuVan(null);
    expect(makeProgress(kho).van).toBe(null);
  });

  it('lưu ván KHÔNG làm mất xu, điểm hay món đã mua', () => {
    const kho = khoGia();
    const v = makeProgress(kho);
    v.cong({ xu: 200, diem: 500 });
    v.mua('kiem1', 60);
    v.luuVan({ hat: 3 });
    const v2 = makeProgress(kho);
    expect(v2.xu).toBe(140);
    expect(v2.diem).toBe(500);
    expect(v2.coMon('kiem1')).toBe(true);
    expect(v2.van.hat).toBe(3);
  });

  it('bản lưu hỏng kiểu thì bỏ qua, không vỡ', () => {
    expect(makeProgress(khoGia('{"van":"chuỗi bậy","quiz":42}')).van).toBe(null);
    expect(makeProgress(khoGia('{"van":"chuỗi bậy","quiz":42}')).quiz).toBe(null);
  });
});

describe('ui: màn tạm dừng', () => {
  const nut = nutTamDung();

  it('có đủ bốn lựa chọn như game Phiêu Lưu', () => {
    expect(nut.map((b) => b.id).sort()).toEqual(['boVan', 'lai', 'luuThoat', 'tiepTuc'].sort());
  });

  it('nút nằm gọn trong khung, đủ to, không chồng nhau', () => {
    for (const b of nut) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(900);
      expect(b.y + b.h + 4).toBeLessThanOrEqual(640);
      expect(b.h).toBeGreaterThanOrEqual(44);
      expect(b.w).toBeGreaterThanOrEqual(44);
    }
    for (let i = 0; i < nut.length; i++)
      for (let j = i + 1; j < nut.length; j++) {
        const a = nut[i],
          b = nut[j];
        expect(a.y + a.h <= b.y || b.y + b.h <= a.y, `${a.id} đè ${b.id}`).toBe(true);
      }
  });

  // "Thoát, không lưu" là nút DUY NHẤT làm mất tiến trình → phải nằm xa nút Tiếp tục nhất.
  it('nút "thoát không lưu" nằm cuối cùng, cách xa nút Tiếp tục', () => {
    const tiep = nut.find((b) => b.id === 'tiepTuc');
    const bo = nut.find((b) => b.id === 'boVan');
    expect(bo.y).toBeGreaterThan(tiep.y + tiep.h + 100);
    expect(bo.mau).toBe('xam'); // và không được nổi bật
    expect(tiep.mau).toBe('hong');
  });

  it('bấm đúng giữa mỗi nút thì trúng nút đó', () => {
    for (const b of nut) expect(batNut(nut, b.x + b.w / 2, b.y + b.h / 2)).toBe(b.id);
  });
});

describe('ui: màn chọn khi có ván đang dở', () => {
  const st = (coVanCu) => ({
    muc: 1,
    mucList: MAZE_DIFF,
    tenSkin: 'x',
    coVanCu,
    boDe: 'toan',
    boDeList: BO_DE,
    capList: timBoDe('toan').capDo,
    cap: '1',
  });

  it('không có ván dở → chỉ có BẮT ĐẦU', () => {
    const ids = nutManChon(st(false)).map((b) => b.id);
    expect(ids).toContain('batDau');
    expect(ids).not.toContain('choiTiep');
  });

  // Mở game lên mà nút to nhất là "bắt đầu lại" thì rất dễ bấm nhầm, mất sạch ván đang dở.
  it('có ván dở → CHƠI TIẾP là nút chính, ván mới lùi xuống nút phụ', () => {
    const nut = nutManChon(st(true));
    const tiep = nut.find((b) => b.id === 'choiTiep');
    const moi = nut.find((b) => b.id === 'batDau');
    expect(tiep).toBeTruthy();
    expect(moi).toBeTruthy();
    expect(tiep.w).toBeGreaterThan(moi.w); // nút chính phải to hơn
    expect(tiep.mau).toBe('hong');
    expect(moi.mau).not.toBe('hong');
    // và hai nút không được đè nhau
    expect(tiep.x + tiep.w <= moi.x || moi.x + moi.w <= tiep.x).toBe(true);
  });
});
