import { describe, it, expect } from 'vitest';
import { makeRun as makeRunThat } from '../src/systems/maze-run.js';

// Phần lớn test ở đây kiểm LOGIC MÊ CUNG (đường đi, chìa, la bàn) nên TẮT QUÁI: quái đánh
// hết tim sẽ đẩy nhân vật về cửa an toàn giữa chừng, làm hỏng phép lái theo đường định sẵn.
// Nhóm test chiến đấu ở cuối tệp gọi thẳng `makeRunThat` để bật quái lên.
const makeRun = (seed, muc, opts = {}) => makeRunThat(seed, muc, { quai: 0, ...opts });
import { solve } from '../src/systems/maze.js';
import { MAZE_DIFF } from '../src/data/difficulty.js';
import { SO_O_THUONG } from '../src/data/rewards.js';

const L = { x: -1, y: 0 },
  R = { x: 1, y: 0 },
  U = { x: 0, y: -1 },
  D = { x: 0, y: 1 };

// Lái nhân vật đi hết một đường đi cho trước, mỗi khung 1/60 giây như game thật.
// Gặp cửa khoá thì tự trả lời (mặc định là đúng) để đi tiếp — chỗ này trong game thật
// là màn hình câu hỏi.
// tuTraLoi = false → dừng lại ngay khi gặp cửa, để test tự kiểm trạng thái treo.
function diTheo(run, path, maxFrames = 20000, dung = true, tuTraLoi = true) {
  let k = 1,
    n = 0;
  while (k < path.length && n++ < maxFrames) {
    if (run.pending) {
      if (!tuTraLoi) return true;
      run.resolve(dung);
      continue;
    }
    const c = run.cell;
    const t = path[k];
    if (c.x === t.x && c.y === t.y) {
      k++;
      continue;
    }
    run.step(1 / 60, { x: Math.sign(t.x - c.x), y: Math.sign(t.y - c.y) });
  }
  return n < maxFrames;
}

describe('systems/maze-run: di chuyển', () => {
  it('bắt đầu ở tâm ô xuất phát, đứng yên khi không bấm gì', () => {
    const run = makeRun(1, 1);
    expect(run.x).toBeCloseTo(run.maze.start.x + 0.5);
    expect(run.y).toBeCloseTo(run.maze.start.y + 0.5);
    for (let i = 0; i < 60; i++) run.step(1 / 60, null);
    expect(run.cell).toEqual(run.maze.start);
  });

  it('KHÔNG BAO GIỜ đi xuyên tường, kể cả bấm loạn 4 hướng', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const run = makeRun(seed, 1);
      const dirs = [L, R, U, D];
      for (let i = 0; i < 3000; i++) {
        run.step(1 / 60, dirs[i % 4]);
        const c = run.cell;
        expect(run.maze.isWall(c.x, c.y)).toBe(false);
        // vị trí thực cũng phải nằm trong ô lối đi, không lấn sang ô tường
        expect(run.maze.isWall(Math.floor(run.x), Math.floor(run.y))).toBe(false);
      }
    }
  });

  it('dt khổng lồ (tab bị treo rồi quay lại) vẫn không xuyên tường', () => {
    const run = makeRun(3, 1);
    for (let i = 0; i < 200; i++) {
      run.step(5, i % 2 ? R : D); // 5 giây một khung — gấp ~150 lần bình thường
      const c = run.cell;
      expect(run.maze.isWall(c.x, c.y)).toBe(false);
    }
  });

  it('đâm vào tường thì đứng yên, không rung, không kẹt', () => {
    const run = makeRun(1, 1);
    const start = run.maze.start;
    // ô (0,1) và (1,0) là viền ngoài → luôn là tường
    for (let i = 0; i < 120; i++) run.step(1 / 60, L);
    expect(run.cell).toEqual(start);
    for (let i = 0; i < 120; i++) run.step(1 / 60, U);
    expect(run.cell).toEqual(start);
  });

  it('quay đầu được ngay giữa hành lang, không phải đợi tới tâm ô', () => {
    const run = makeRun(1, 1);
    const start = { ...run.maze.start };
    // chọn hướng chắc chắn đi được, đừng đoán bừa là bên phải
    const di = [R, D, L, U].find((d) => !run.maze.isWall(start.x + d.x, start.y + d.y));
    const nguoc = { x: -di.x, y: -di.y };
    for (let i = 0; i < 8; i++) run.step(1 / 60, di); // đi ra một đoạn
    expect(Math.abs(run.x - start.x - 0.5) + Math.abs(run.y - start.y - 0.5)).toBeGreaterThan(0.2);
    for (let i = 0; i < 40; i++) run.step(1 / 60, nguoc); // quay đầu giữa chừng
    expect(run.cell).toEqual(start);
  });

  // Lỗi thật: sau khi tới tâm ô, ngân sách thừa của khung được tiêu tiếp bằng lệnh CŨ,
  // nhân vật cam kết đi hết ô kế → lệnh rẽ ở khung sau không bao giờ có hiệu lực.
  // Biểu hiện: la bàn bảo rẽ xuống mà nhân vật cứ chạy thẳng, dậm chân giữa 3 ô mãi mãi.
  it('RẼ ĐƯỢC Ở NGÃ RẼ — lệnh đổi hướng luôn có hiệu lực khi tới tâm ô', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const run = makeRun(seed, 1);
      // đi thẳng tới khi gặp ngã rẽ, rồi bẻ sang hướng vuông góc
      const di = [R, D, L, U].find((d) => !run.maze.isWall(1 + d.x, 1 + d.y));
      const vuongGoc = di.x ? [D, U] : [R, L];
      let daRe = false;
      for (let i = 0; i < 3000 && !daRe; i++) {
        const c = run.cell;
        const re = vuongGoc.find((d) => !run.maze.isWall(c.x + d.x, c.y + d.y));
        if (re) {
          const truoc = { ...run.cell };
          for (let k = 0; k < 200; k++) run.step(1 / 60, re);
          const sau = run.cell;
          expect(sau.x !== truoc.x || sau.y !== truoc.y).toBe(true);
          daRe = true;
        } else run.step(1 / 60, di);
      }
      expect(daRe).toBe(true);
    }
  });

  // Lỗi thật: phần vẽ dùng `dir` để vẽ mắt, mà `dir` về null mỗi khi đứng ở tâm ô →
  // nhân vật cứ dừng lại là quay mặt về bên phải, lệch hẳn với mũi tên chỉ hướng.
  describe('hướng nhìn (facing) — KHÔNG được xoá khi đứng lại', () => {
    it('giữ nguyên hướng vừa đi kể cả khi đã dừng hẳn', () => {
      const run = makeRun(1, 1);
      const di = [R, D, L, U].find(
        (d) => !run.maze.isWall(run.maze.start.x + d.x, run.maze.start.y + d.y),
      );
      for (let i = 0; i < 40; i++) run.step(1 / 60, di);
      expect(run.facing).toEqual(di);
      for (let i = 0; i < 300; i++) run.step(1 / 60, null); // buông phím, đứng im thật lâu
      expect(run.dir).toBe(null); // đã dừng hẳn
      expect(run.facing).toEqual(di); // nhưng vẫn nhìn về hướng cũ
    });

    it('quay mặt cả khi hướng đó là TƯỜNG — phản hồi cho người chơi biết lệnh đã nhận', () => {
      const run = makeRun(1, 1);
      // (0,1) là viền ngoài → luôn là tường
      for (let i = 0; i < 30; i++) run.step(1 / 60, L);
      expect(run.facing).toEqual(L);
      expect(run.cell).toEqual(run.maze.start); // không đi được, nhưng vẫn ngoảnh sang
    });

    it('nhinVe() quay mặt tức thì, và chuẩn hoá về 4 hướng đơn vị', () => {
      const run = makeRun(1, 1);
      run.nhinVe({ x: 0, y: 5 });
      expect(run.facing).toEqual(D);
      run.nhinVe({ x: -3, y: 0 });
      expect(run.facing).toEqual(L);
      run.nhinVe({ x: 0, y: 0 }); // hướng rỗng thì bỏ qua, không xoá hướng cũ
      expect(run.facing).toEqual(L);
      run.nhinVe(null);
      expect(run.facing).toEqual(L);
    });

    it('facing luôn là một trong bốn hướng đơn vị, kể cả khi bấm loạn', () => {
      const run = makeRun(4, 1);
      const dirs = [R, D, L, U];
      for (let i = 0; i < 600; i++) {
        run.step(1 / 60, dirs[Math.floor(i / 9) % 4]);
        const f = run.facing;
        expect(Math.abs(f.x) + Math.abs(f.y)).toBe(1);
      }
    });
  });

  it('goal() chỉ đúng ô cửa mà la bàn đang nhắm, và đổi khi mở xong cửa đó', () => {
    const run = makeRun(5, 1);
    const g = run.goal();
    expect(run.maze.gates.some((t) => t.x === g.x && t.y === g.y)).toBe(true);
    diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, g.x, g.y));
    const g2 = run.goal();
    expect(g2).not.toEqual(g); // mở xong thì nhắm sang cửa khác
  });

  it('mở hết cửa thì goal() chuyển sang CỬA RA', () => {
    const run = makeRun(6, 1);
    let cur = { ...run.maze.start };
    for (const g of run.maze.gates) {
      diTheo(run, solve(run.maze, cur.x, cur.y, g.x, g.y));
      cur = { x: g.x, y: g.y };
    }
    expect(run.goal()).toEqual({ x: run.maze.exit.x, y: run.maze.exit.y });
  });

  it('luôn bám giữa hành lang (không lệch khỏi tâm trục vuông góc)', () => {
    const run = makeRun(4, 1);
    const dirs = [R, D, L, U];
    for (let i = 0; i < 2000; i++) {
      run.step(1 / 60, dirs[Math.floor(i / 7) % 4]);
      const lechX = Math.abs(run.x - Math.floor(run.x) - 0.5);
      const lechY = Math.abs(run.y - Math.floor(run.y) - 0.5);
      // ít nhất một trục phải nằm đúng tâm — cả hai cùng lệch là đã ra khỏi hành lang
      expect(Math.min(lechX, lechY)).toBeLessThan(1e-9);
    }
  });
});

describe('systems/maze-run: mục tiêu và luật thắng', () => {
  it('tới cửa khoá thì TREO LẠI chờ trả lời, mê cung đứng im', () => {
    const run = makeRun(5, 1);
    const g = run.maze.gates[0];
    diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, g.x, g.y), 20000, true, false);
    expect(run.pending).toEqual(g);
    expect(run.keys).toBe(0); // chưa trả lời thì chưa có chìa
    // trong lúc treo câu hỏi: bấm phím không đi được, đồng hồ không chạy
    const o = { ...run.cell },
      t = run.time;
    for (let i = 0; i < 120; i++) run.step(1 / 60, L);
    expect(run.cell).toEqual(o);
    expect(run.time).toBe(t);
    run.resolve(true);
    expect(run.keys).toBe(1);
    expect(run.pending).toBe(null);
  });

  // LUẬT CỨNG của cả dự án. Nếu test này đỏ thì đã làm hỏng thứ quan trọng nhất.
  it('HẾT LƯỢT TRẢ LỜI thì cửa VẪN KHOÁ — nhưng thử lại được ngay, không bế tắc', () => {
    const run = makeRun(5, 1);
    const g = run.maze.gates[0];
    const duong = solve(run.maze, run.maze.start.x, run.maze.start.y, g.x, g.y);
    diTheo(run, duong, 20000, true, false); // đi tới cửa rồi dừng, tự tay trả lời
    run.resolve(false, 45, false); // sai hết 3 lượt → không mở
    expect(run.keys).toBe(0); // chưa có chìa
    expect(run.isOpen(g.id)).toBe(false); // cửa vẫn khoá
    expect(run.stars).toBe(0);
    // Và quay lại đúng cửa đó thì được hỏi lại — đường ra không bao giờ bị đóng vĩnh viễn.
    diTheo(run, [{ x: g.x, y: g.y }, duong[duong.length - 2]], 20000, true, false);
    diTheo(run, [duong[duong.length - 2], { x: g.x, y: g.y }], 20000, true, false);
    expect(run.pending).toEqual(g);
    run.resolve(true, 0, true);
    expect(run.keys).toBe(1);
  });

  it('trả lời SAI vẫn được đi qua ô "?" thưởng — quà thì không phải cửa ải', () => {
    const run = makeRun(5, 1);
    const o = run.maze.bonus[0];
    diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, o.x, o.y), 20000, true, false);
    expect(run.pending).toEqual(o);
    run.resolve(false, 0, false); // dù bảo "đừng mở", ô thưởng vẫn coi như dùng xong
    expect(run.isOpen(o.id)).toBe(true);
    expect(run.stars).toBe(0); // sao chỉ tính cho cửa khoá
  });

  it('trả lời sai MẤT MỘT TIM; hết tim thì về chỗ an toàn với đủ tim, không thua', () => {
    const run = makeRun(5, 1);
    const dayTim = run.timToiDa;
    expect(run.tim).toBe(dayTim);
    for (let i = 1; i < dayTim; i++) {
      expect(run.matTim()).toBe(false);
      expect(run.tim).toBe(dayTim - i);
    }
    expect(run.matTim()).toBe(true); // tim cuối cùng
    expect(run.tim).toBe(dayTim); // đã hồi sinh, đầy tim trở lại
    expect(run.hoiSinh).toBe(1);
    expect(run.won).toBe(false);
  });

  it('trả lời đúng thì được sao; phạt thời gian cộng vào đồng hồ', () => {
    const run = makeRun(5, 1);
    const g = run.maze.gates[0];
    diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, g.x, g.y));
    const t = run.time;
    expect(run.stars).toBe(1);
    // cửa kế tiếp: dừng lại ở cửa, tự tay trả lời SAI, chịu phạt 15 giây
    const g2 = run.maze.gates[1];
    diTheo(run, solve(run.maze, g.x, g.y, g2.x, g2.y), 20000, true, false);
    const truoc = run.time;
    run.resolve(false, 15);
    expect(run.time).toBeGreaterThanOrEqual(truoc + 15);
    expect(run.time).toBeGreaterThan(t);
  });

  it('resolve khi không có cửa nào treo thì không làm gì', () => {
    const run = makeRun(5, 1);
    expect(run.resolve(true)).toBe(null);
    expect(run.keys).toBe(0);
  });

  it('đi qua cửa khoá thì nhận chìa, không nhận trùng', () => {
    const run = makeRun(5, 1);
    const g = run.maze.gates[0];
    expect(run.keys).toBe(0);
    expect(diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, g.x, g.y))).toBe(true);
    expect(run.keys).toBe(1);
    expect(run.isOpen(g.id)).toBe(true);
    // đi ra rồi quay lại cùng cửa → vẫn chỉ 1 chìa
    const back = solve(run.maze, g.x, g.y, run.maze.start.x, run.maze.start.y);
    diTheo(run, back);
    diTheo(run, back.slice().reverse());
    expect(run.keys).toBe(1);
  });

  it('TỚI CỬA RA MÀ THIẾU CHÌA THÌ CHƯA THẮNG', () => {
    const run = makeRun(6, 1);
    const e = run.maze.exit;
    diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, e.x, e.y));
    expect(run.cell).toEqual({ x: e.x, y: e.y });
    expect(run.keys).toBeLessThan(run.needKeys);
    expect(run.won).toBe(false);
  });

  it('gom đủ chìa rồi ra cửa cuối thì thắng', () => {
    const run = makeRun(6, 1);
    let cur = { ...run.maze.start };
    for (const g of run.maze.gates) {
      diTheo(run, solve(run.maze, cur.x, cur.y, g.x, g.y));
      cur = { x: g.x, y: g.y };
    }
    expect(run.keys).toBe(run.needKeys);
    expect(run.won).toBe(false);
    diTheo(run, solve(run.maze, cur.x, cur.y, run.maze.exit.x, run.maze.exit.y));
    expect(run.won).toBe(true);
  });

  it('thắng rồi thì đứng im, không đi tiếp được', () => {
    const run = makeRun(6, 1);
    let cur = { ...run.maze.start };
    for (const g of run.maze.gates) {
      diTheo(run, solve(run.maze, cur.x, cur.y, g.x, g.y));
      cur = { x: g.x, y: g.y };
    }
    diTheo(run, solve(run.maze, cur.x, cur.y, run.maze.exit.x, run.maze.exit.y));
    const o = run.cell,
      t = run.time;
    for (let i = 0; i < 60; i++) run.step(1 / 60, L);
    expect(run.cell).toEqual(o);
    expect(run.time).toBe(t);
  });

  it('nhặt xu, mỗi ô chỉ một lần', () => {
    const run = makeRun(7, 1);
    const p = run.maze.coins[0];
    const i = p.y * run.maze.size + p.x;
    expect(run.hasCoin(i)).toBe(true);
    expect(run.coins).toBe(0);
    // Xu nay rải cả dọc hành lang, nên đi tới đích sẽ nhặt được nhiều hơn một đồng —
    // kiểm "tăng lên" chứ đừng chốt cứng con số.
    diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, p.x, p.y));
    expect(run.coins).toBeGreaterThan(0);
    expect(run.hasCoin(i)).toBe(false); // ô này đã nhặt rồi
    const sau = run.coins;
    diTheo(run, solve(run.maze, p.x, p.y, run.maze.start.x, run.maze.start.y));
    diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, p.x, p.y));
    expect(run.coins).toBe(sau); // đi lại lần nữa không nhặt thêm được gì
  });
});

describe('systems/maze-run: ô "?" thưởng và đồng hồ', () => {
  it('ô "?" cũng treo câu hỏi như cửa khoá, nhưng KHÔNG tính vào chìa', () => {
    const run = makeRun(7, 1);
    const b = run.maze.bonus[0];
    expect(b.loai).toBe('thuong');
    // Đường tới ô "?" có thể đi ngang CỬA KHOÁ — trả lời cho qua, chỉ dừng lại ở ô "?".
    const duong = solve(run.maze, run.maze.start.x, run.maze.start.y, b.x, b.y);
    let k = 1,
      n = 0;
    while (n++ < 20000) {
      if (run.pending) {
        if (run.pending.loai === 'thuong') break;
        run.resolve(true);
        continue;
      }
      const c = run.cell;
      if (c.x === duong[k].x && c.y === duong[k].y) {
        if (++k >= duong.length) break;
        continue;
      }
      run.step(1 / 60, { x: Math.sign(duong[k].x - c.x), y: Math.sign(duong[k].y - c.y) });
    }
    expect(run.pending).toEqual(b);
    // Trên đường tới đây có thể đã mở vài cửa khoá — so sánh TRƯỚC/SAU, đừng chốt cứng 0.
    const chiaTruoc = run.keys,
      saoTruoc = run.stars;
    run.resolve(true);
    expect(run.keys).toBe(chiaTruoc); // ô thưởng KHÔNG cho chìa
    expect(run.stars).toBe(saoTruoc); // và KHÔNG tính sao
    expect(run.isOpen(b.id)).toBe(true);
  });

  // Lỗi thật: `keys` từng đếm cả ô "?" nên bé ghé vài ô thưởng là cửa ra mở sớm.
  it('ghé hết ô "?" mà chưa mở cửa khoá nào thì VẪN CHƯA đủ chìa', () => {
    const run = makeRun(7, 1);
    let cur = { ...run.maze.start };
    for (const b of run.maze.bonus) {
      diTheo(run, solve(run.maze, cur.x, cur.y, b.x, b.y));
      cur = { x: b.x, y: b.y };
    }
    expect(run.keys).toBeLessThan(run.needKeys);
    diTheo(run, solve(run.maze, cur.x, cur.y, run.maze.exit.x, run.maze.exit.y));
    expect(run.won).toBe(false); // chưa đủ chìa thì cửa ra không mở
  });

  // Mê cung nhỏ bị đục nhiều tường có khi không còn ngõ cụt nào — lúc đó ô "?" vẫn PHẢI có,
  // nếu không thì cả tính năng biến mất tuỳ hạt giống. Xu vẫn kiếm được từ câu hỏi.
  it('LUÔN đủ số ô "?" ở mọi hạt giống và mọi mức, không đè lên xu hay cửa khoá', () => {
    for (let seed = 1; seed <= 30; seed++)
      for (let muc = 0; muc < 3; muc++) {
        const run = makeRun(seed, muc);
        const nhan = `hạt ${seed} mức ${muc}`;
        expect(run.maze.bonus.length, nhan).toBe(SO_O_THUONG[muc]);
        const key = (p) => p.y * run.maze.size + p.x;
        const oThuong = new Set(run.maze.bonus.map(key));
        expect(oThuong.size, nhan).toBe(run.maze.bonus.length); // không trùng nhau
        for (const p of run.maze.coins) expect(oThuong.has(key(p)), nhan).toBe(false);
        for (const g of run.maze.gates) expect(oThuong.has(key(g)), nhan).toBe(false);
        expect(oThuong.has(key(run.maze.start)), nhan).toBe(false);
        expect(oThuong.has(key(run.maze.exit)), nhan).toBe(false);
        for (const b of run.maze.bonus) expect(run.maze.isWall(b.x, b.y), nhan).toBe(false);
        // Xu cũng phải LUÔN có, và không đè lên cửa khoá hay điểm xuất phát.
        expect(run.maze.coins.length, nhan).toBeGreaterThanOrEqual(6);
        const oXu = new Set(run.maze.coins.map(key));
        expect(oXu.size, nhan).toBe(run.maze.coins.length);
        for (const g of run.maze.gates) expect(oXu.has(key(g)), nhan).toBe(false);
        expect(oXu.has(key(run.maze.start)), nhan).toBe(false);
        for (const p of run.maze.coins) expect(run.maze.isWall(p.x, p.y), nhan).toBe(false);
      }
  });

  it('đồng hồ: mức Dễ không giới hạn, mức Vừa/Khó đếm ngược', () => {
    expect(makeRun(1, 0).left).toBe(Infinity);
    expect(makeRun(1, 0).timeUp).toBe(false);
    const vua = makeRun(1, 1);
    expect(vua.left).toBe(MAZE_DIFF[1].time);
    expect(vua.limit).toBe(MAZE_DIFF[1].time);
  });

  // HẾT GIỜ KHÔNG PHẢI LÀ THUA — luật §2: không bao giờ mất tiến trình.
  it('hết giờ vẫn đi được, vẫn qua được mê cung', () => {
    const run = makeRun(6, 1, { time: 2 }); // giới hạn 2 giây cho nhanh
    for (let i = 0; i < 200; i++) run.step(1 / 60, null);
    expect(run.timeUp).toBe(true);
    expect(run.left).toBe(0);
    let cur = { ...run.maze.start };
    for (const g of run.maze.gates) {
      diTheo(run, solve(run.maze, cur.x, cur.y, g.x, g.y));
      cur = { x: g.x, y: g.y };
    }
    diTheo(run, solve(run.maze, cur.x, cur.y, run.maze.exit.x, run.maze.exit.y));
    expect(run.won).toBe(true); // hết giờ rồi vẫn về đích được
  });

  it('trả lời sai cộng giây phạt, có thể đẩy sang hết giờ', () => {
    const run = makeRun(6, 1, { time: 30 });
    const g = run.maze.gates[0];
    diTheo(run, solve(run.maze, run.maze.start.x, run.maze.start.y, g.x, g.y), 20000, true, false);
    const truoc = run.left;
    run.resolve(false, 45);
    expect(run.left).toBeLessThan(truoc);
    expect(run.timeUp).toBe(true);
  });
});

describe('systems/maze-run: tầm nhìn và la bàn', () => {
  it('mức Dễ thấy toàn bản đồ ngay từ đầu; mức Khó chỉ thấy quanh mình', () => {
    const de = makeRun(8, 0);
    const kho = makeRun(8, 2);
    const dem = (r) => r.seen.reduce((a, b) => a + b, 0);
    expect(dem(de)).toBe(de.maze.size * de.maze.size); // 99 ô bán kính = cả bản đồ
    expect(dem(kho)).toBeLessThan(kho.maze.size * kho.maze.size);
  });

  it('vùng đã thấy chỉ NỞ RA, không bao giờ quên', () => {
    const run = makeRun(9, 2);
    const dem = () => run.seen.reduce((a, b) => a + b, 0);
    const dau = dem();
    let truoc = dau;
    // Đi theo la bàn cho nhân vật thật sự đi xa; bấm 4 hướng mù chỉ quanh quẩn một chỗ.
    for (let i = 0; i < 6000 && !run.won; i++) {
      const h = run.hint();
      if (!h) break;
      const c = run.cell;
      run.step(1 / 60, { x: Math.sign(h.x - c.x), y: Math.sign(h.y - c.y) });
      const gio = dem();
      expect(gio).toBeGreaterThanOrEqual(truoc);
      truoc = gio;
    }
    expect(truoc).toBeGreaterThan(dau * 2);
  });

  // Đây là test bắt được lỗi thật: `cell` từng báo về ô GỐC NỘI SUY thay vì ô đang đứng,
  // nên lúc quay đầu la bàn tính từ chỗ nhân vật không hề ở đó → chỉ qua chỉ lại, người
  // chơi dậm chân giữa 3 ô suốt 4000 khung mà không tới đâu. Giữ test để không tái diễn.
  it('ĐI THEO LA BÀN LÀ QUA ĐƯỢC CẢ MÊ CUNG — không dậm chân tại chỗ', () => {
    for (const [seed, muc] of [
      [10, 1],
      [21, 0],
      [33, 2],
    ]) {
      const run = makeRun(seed, muc);
      let n = 0;
      while (!run.won && n++ < 60000) {
        if (run.pending) {
          run.resolve(true);
          continue;
        }
        const h = run.hint();
        expect(h).not.toBe(null);
        const c = run.cell;
        expect(Math.abs(h.x - c.x) + Math.abs(h.y - c.y)).toBe(1); // luôn là ô ngay cạnh
        expect(run.maze.isWall(h.x, h.y)).toBe(false);
        run.step(1 / 60, { x: Math.sign(h.x - c.x), y: Math.sign(h.y - c.y) });
      }
      expect(run.won).toBe(true);
      expect(run.keys).toBe(run.needKeys);
    }
  });

  it('gom hết chìa rồi thì la bàn quay sang chỉ CỬA RA', () => {
    const run = makeRun(11, 0);
    let cur = { ...run.maze.start };
    for (const g of run.maze.gates) {
      diTheo(run, solve(run.maze, cur.x, cur.y, g.x, g.y));
      cur = { x: g.x, y: g.y };
    }
    const h = run.hint();
    const p = solve(run.maze, cur.x, cur.y, run.maze.exit.x, run.maze.exit.y);
    expect(h).toEqual(p[1]);
  });
});

describe('systems/maze-run: khớp bảng độ khó', () => {
  it('ba mức cho ba cỡ mê cung và số cửa đúng như data/difficulty.js', () => {
    for (let k = 0; k < 3; k++) {
      const run = makeRun(12, k);
      expect(run.maze.size).toBe(MAZE_DIFF[k].size);
      expect(run.needKeys).toBe(MAZE_DIFF[k].gates);
    }
  });

  it('mức không hợp lệ rơi về mức Vừa thay vì vỡ', () => {
    expect(makeRun(1, 99).maze.size).toBe(MAZE_DIFF[1].size);
  });
});
