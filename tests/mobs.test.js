import { describe, it, expect } from 'vitest';
import { makeRun } from '../src/systems/maze-run.js';
import { makeMaze } from '../src/systems/maze.js';
import { makeRng } from '../src/core/rng.js';
import { datQuai, diQuai, quaiCham, quaiTrongTam, MAU_TIM } from '../src/systems/mobs.js';
import { CUA_HANG, chiSo } from '../src/data/shop.js';
import { MAZE_DIFF } from '../src/data/difficulty.js';
import { bfs } from '../src/systems/maze.js';

const meCung = (seed = 5) => makeMaze(seed, { size: 21, gates: 5, bonus: 3 });

describe('systems/mobs: quái tuần tra', () => {
  it('đặt đủ số quái, không đè lên cửa/ô thưởng/xuất phát, và không nằm trong tường', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = meCung(seed);
      const q = datQuai(m, makeRng(seed), 4, bfs(m, m.start.x, m.start.y));
      expect(q.length).toBeGreaterThan(0);
      const cam = new Set([
        m.start.y * m.size + m.start.x,
        m.exit.y * m.size + m.exit.x,
        ...m.gates.map((g) => g.y * m.size + g.x),
        ...m.bonus.map((b) => b.y * m.size + b.x),
      ]);
      for (const t of q) {
        expect(m.isWall(t.cx, t.cy)).toBe(false);
        expect(cam.has(t.cy * m.size + t.cx)).toBe(false);
      }
    }
  });

  // Bé phải có vài giây làm quen trước khi gặp con đầu tiên.
  it('không con nào đứng sát điểm xuất phát', () => {
    const m = meCung(3);
    const d = bfs(m, m.start.x, m.start.y);
    for (const q of datQuai(m, makeRng(3), 5, d))
      expect(d[q.cy * m.size + q.cx]).toBeGreaterThanOrEqual(6);
  });

  it('quái KHÔNG BAO GIỜ đi vào tường, kể cả chạy rất lâu hay dt khổng lồ', () => {
    const m = meCung(7);
    const rng = makeRng(7);
    const q = datQuai(m, rng, 5, bfs(m, m.start.x, m.start.y));
    for (let i = 0; i < 4000; i++)
      for (const t of q) {
        diQuai(m, t, i % 50 === 0 ? 3 : 1 / 60, rng); // thỉnh thoảng nhét một khung 3 giây
        expect(m.isWall(t.cx, t.cy)).toBe(false);
        expect(m.isWall(Math.floor(t.x), Math.floor(t.y))).toBe(false);
      }
  });

  it('quái luôn bám giữa hành lang như nhân vật', () => {
    const m = meCung(4);
    const rng = makeRng(4);
    const q = datQuai(m, rng, 4, bfs(m, m.start.x, m.start.y));
    for (let i = 0; i < 2000; i++)
      for (const t of q) {
        diQuai(m, t, 1 / 60, rng);
        const lx = Math.abs(t.x - Math.floor(t.x) - 0.5);
        const ly = Math.abs(t.y - Math.floor(t.y) - 0.5);
        expect(Math.min(lx, ly)).toBeLessThan(1e-9);
      }
  });

  // Quái rẽ ngẫu nhiên mỗi ô thì trẻ không đoán được, va vào chỉ là xui.
  it('ƯU TIÊN ĐI THẲNG — phần lớn thời gian giữ nguyên hướng', () => {
    const m = meCung(9);
    const rng = makeRng(9);
    const [q] = datQuai(m, rng, 1, bfs(m, m.start.x, m.start.y));
    let doiHuong = 0,
      buoc = 0;
    let truoc = q.dir;
    for (let i = 0; i < 6000; i++) {
      const oCu = q.cx + ',' + q.cy;
      diQuai(m, q, 1 / 60, rng);
      if (oCu !== q.cx + ',' + q.cy) {
        buoc++;
        if (q.dir !== truoc) doiHuong++;
        truoc = q.dir;
      }
    }
    expect(buoc).toBeGreaterThan(50);
    expect(doiHuong / buoc).toBeLessThan(0.6); // đa số bước là đi thẳng
  });

  it('quái chết thì đứng im mãi mãi', () => {
    const m = meCung(2);
    const rng = makeRng(2);
    const [q] = datQuai(m, rng, 1, bfs(m, m.start.x, m.start.y));
    q.song = false;
    const o = { x: q.x, y: q.y };
    for (let i = 0; i < 500; i++) diQuai(m, q, 1 / 60, rng);
    expect({ x: q.x, y: q.y }).toEqual(o);
  });

  it('quaiCham / quaiTrongTam bỏ qua quái đã chết', () => {
    const q = [{ x: 5.5, y: 5.5, song: true }];
    expect(quaiCham(q, 5.5, 5.5)).toBe(q[0]);
    expect(quaiTrongTam(q, 6.4, 5.5)).toBe(q[0]);
    expect(quaiCham(q, 9, 9)).toBe(null);
    q[0].song = false;
    expect(quaiCham(q, 5.5, 5.5)).toBe(null);
    expect(quaiTrongTam(q, 5.5, 5.5)).toBe(null);
  });
});

describe('maze-run: tim và chiến đấu', () => {
  it('mỗi mức có số tim và số quái theo bảng độ khó', () => {
    for (let muc = 0; muc < 3; muc++) {
      const run = makeRun(1, muc);
      expect(run.timToiDa).toBe(MAZE_DIFF[muc].tim);
      expect(run.tim).toBe(run.timToiDa);
      expect(run.quai.length).toBeGreaterThan(0);
    }
  });

  it('chạm quái mất 1 tim rồi BẤT TỬ một lúc — không mất sạch tim trong một giây', () => {
    const run = makeRun(5, 1);
    const q = run.quai[0];
    q.x = run.x; // kéo quái tới sát nhân vật
    q.y = run.y;
    q.cx = run.cell.x;
    q.cy = run.cell.y;
    const t0 = run.tim;
    run.step(1 / 60, null);
    expect(run.tim).toBe(t0 - 1);
    expect(run.batTu).toBe(true);
    for (let i = 0; i < 30; i++) {
      q.x = run.x;
      q.y = run.y;
      run.step(1 / 60, null);
    }
    expect(run.tim).toBe(t0 - 1); // nửa giây sau vẫn chỉ mất đúng 1 tim
  });

  // Luật §2: KHÔNG BAO GIỜ mất tiến trình. Hết tim chỉ là đi lùi vài bước.
  it('HẾT TIM: về chỗ an toàn, GIỮ NGUYÊN chìa và xu, hồi đầy tim', () => {
    const run = makeRun(6, 1, { tim: 1 });
    const q = run.quai[0];
    // đi nhặt vài thứ trước cho có tiến trình
    for (let i = 0; i < 400; i++) run.step(1 / 60, { x: 1, y: 0 });
    const xuTruoc = run.coins,
      chiaTruoc = run.keys,
      hs = run.hoiSinh;
    if (run.pending) run.resolve(true);
    q.x = run.x;
    q.y = run.y;
    run.step(1 / 60, null);
    expect(run.hoiSinh).toBe(hs + 1);
    expect(run.tim).toBe(run.timToiDa); // hồi đầy tim
    expect(run.coins).toBe(xuTruoc); // KHÔNG mất xu
    expect(run.keys).toBe(chiaTruoc); // KHÔNG mất chìa
    expect(run.maze.isWall(run.cell.x, run.cell.y)).toBe(false); // và không kẹt trong tường
  });

  it('chém: đủ sát thương thì hạ gục, có hồi chiêu để không bấm liên tục', () => {
    const run = makeRun(5, 1, { satThuong: MAU_TIM });
    const q = run.quai[0];
    q.x = run.x + 0.5;
    q.y = run.y;
    const kq = run.chem();
    expect(kq).toEqual({ trung: true, haGuc: true });
    expect(q.song).toBe(false);
    // bấm ngay lần nữa: đang hồi chiêu, không ăn
    expect(run.chem()).toEqual({ trung: false, haGuc: false });
  });

  it('chém hụt khi không có quái trong tầm', () => {
    const run = makeRun(5, 1, { quai: 0 });
    expect(run.chem()).toEqual({ trung: false, haGuc: false });
  });

  it('vũ khí yếu cần nhiều nhát hơn', () => {
    const run = makeRun(5, 1, { satThuong: 1 });
    const q = run.quai[0];
    let nhat = 0;
    for (let i = 0; i < 40 && q.song; i++) {
      q.x = run.x + 0.5;
      q.y = run.y;
      if (run.chem().trung) nhat++;
      run.step(0.4, null); // chờ hết hồi chiêu
    }
    expect(q.song).toBe(false);
    expect(nhat).toBe(MAU_TIM); // sát thương 1 → đúng MAU_TIM nhát
  });

  it('không chém được khi đang trả lời câu hỏi', () => {
    const run = makeRun(5, 1);
    const q = run.quai[0];
    q.x = run.x;
    q.y = run.y;
    // ép vào trạng thái treo câu hỏi bằng cách đi tới một cửa
    const g = run.maze.gates[0];
    let n = 0;
    while (!run.pending && n++ < 20000) {
      const c = run.cell;
      const p = run.hint();
      if (!p) break;
      run.step(1 / 60, { x: Math.sign(p.x - c.x), y: Math.sign(p.y - c.y) });
    }
    if (run.pending) expect(run.chem()).toEqual({ trung: false, haGuc: false });
    expect(g).toBeTruthy();
  });
});

describe('data/shop: cửa hàng', () => {
  it('mọi món có đủ trường và giá dương', () => {
    const ids = new Set();
    for (const m of CUA_HANG) {
      expect(m.id).toBeTruthy();
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);
      expect(m.gia).toBeGreaterThan(0);
      expect(m.ten.length).toBeGreaterThan(2);
      expect(m.mo.length).toBeGreaterThan(5);
      expect(Object.keys(m.hieu).length).toBeGreaterThan(0);
    }
  });

  it('chưa mua gì thì chỉ số là mức gốc', () => {
    expect(chiSo([])).toEqual({ satThuong: 1, themTim: 0, tocDo: 1, themNhin: 0 });
    expect(chiSo()).toEqual({ satThuong: 1, themTim: 0, tocDo: 1, themNhin: 0 });
  });

  // Mua kiếm sắt rồi thì kiếm gỗ thành thừa — KHÔNG được cộng dồn thành sát thương 5.
  it('món cùng loại lấy giá trị TỐT NHẤT, không cộng dồn', () => {
    expect(chiSo(['kiem1']).satThuong).toBe(2);
    expect(chiSo(['kiem2']).satThuong).toBe(3);
    expect(chiSo(['kiem1', 'kiem2']).satThuong).toBe(3);
  });

  it('món khác loại thì cộng vào nhau', () => {
    const cs = chiSo(['kiem2', 'giap1', 'giay1', 'den1']);
    expect(cs.satThuong).toBe(3);
    expect(cs.themTim).toBe(2);
    expect(cs.tocDo).toBeGreaterThan(1);
    expect(cs.themNhin).toBe(2);
  });

  it('id không có thật thì bỏ qua, không vỡ', () => {
    expect(chiSo(['khong-co-that']).satThuong).toBe(1);
  });

  // Không món nào được phép bỏ qua câu hỏi — kiến thức không mua bằng xu được.
  it('KHÔNG có món nào can thiệp vào câu hỏi', () => {
    const choPhep = new Set(['satThuong', 'themTim', 'tocDo', 'themNhin']);
    for (const m of CUA_HANG)
      for (const k of Object.keys(m.hieu)) expect(choPhep.has(k), `${m.id}.${k}`).toBe(true);
  });

  it('áo giáp thật sự cho thêm tim khi vào ván', () => {
    const thuong = makeRun(1, 1, { quai: 0 });
    const cogiap = makeRun(1, 1, { quai: 0, themTim: chiSo(['giap1']).themTim });
    expect(cogiap.timToiDa).toBe(thuong.timToiDa + 2);
  });
});
