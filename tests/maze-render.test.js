import { describe, it, expect } from 'vitest';
import {
  drawMaze,
  drawHud,
  drawOverlay,
  drawQuestion,
  drawMenu,
  drawButtons,
  ngatDong,
  MAZE_SKINS,
  VIEW,
} from '../src/render/maze.js';
import { makeRun } from '../src/systems/maze-run.js';
import { MAZE_DIFF } from '../src/data/difficulty.js';
import { W, H, nutManChon } from '../src/ui/mecung-ui.js';
import { BO_DE, timBoDe } from '../src/data/banks.js';

const stMenu = {
  muc: 1,
  boDe: 'toan',
  boDeList: BO_DE,
  capList: timBoDe('toan').capDo,
  cap: '1',
  moBoDe: 'mô tả',
  mucList: MAZE_DIFF,
  tenSkin: '🟫 Xứ Khối Vuông',
  nhac: 1,
  tieng: 1,
};

// ctx giả — ghi lại lệnh vẽ và toạ độ ĐÃ QUY VỀ HỆ CANVAS.
// Phải mô phỏng translate + ngăn xếp save/restore, nếu không hình vẽ sau translate
// (hình thoi cửa khoá) sẽ báo toạ độ cục bộ âm và test kêu oan.
// Phép quay bỏ qua: hình thoi nhỏ, sai số nằm gọn trong dung sai của phép kiểm tra.
// Cỡ chữ phải ĐỌC TỪ ctx.font, không để riêng một trường — để riêng thì đo sai mỗi khi
// mã vẽ đổi phông, và test ngắt dòng thành vô nghĩa.
const mockCtx = () => {
  const stack = [];
  let tx = 0,
    ty = 0;
  const ghi = (x, y) => c.diem.push([x + tx, y + ty]);
  const coChu = () => parseInt(String(c.font).match(/(\d+)px/)?.[1] || '16', 10);
  const c = {
    calls: [],
    diem: [],
    chu: [],
    font: '16px system-ui',
    globalAlpha: 1,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    // save/restore thật khôi phục CẢ globalAlpha, textAlign, textBaseline — không chỉ phép
    // biến hình. Mock phải theo cho đúng, nếu không sẽ bỏ lọt lỗi "hàm vẽ làm bẩn trạng thái".
    save() {
      c.calls.push('save');
      stack.push([tx, ty, c.globalAlpha, c.textAlign, c.textBaseline]);
    },
    restore() {
      c.calls.push('restore');
      const s = stack.pop();
      if (s) [tx, ty, c.globalAlpha, c.textAlign, c.textBaseline] = s;
    },
    translate(x, y) {
      tx += x;
      ty += y;
    },
    rotate() {},
    scale() {},
    beginPath() {},
    moveTo: ghi,
    lineTo: ghi,
    arcTo: ghi,
    setLineDash() {},
    stroke() {
      c.calls.push('stroke');
    },
    closePath() {},
    fill() {
      c.calls.push('fill');
    },
    fillRect(x, y, w, h) {
      c.calls.push('fillRect');
      ghi(x, y);
      ghi(x + w, y + h);
    },
    arc(x, y) {
      c.calls.push('arc');
      ghi(x, y);
    },
    fillText(t, x, y) {
      c.calls.push('fillText:' + t);
      c.chu.push({ t: String(t), x, y, canh: c.textAlign, co: coChu() });
      ghi(x, y);
    },
    // Ước lượng bề ngang: canvas thật đo theo phông, ở đây lấy cỡ chữ × 0.55 × số ký tự.
    // Đủ sát để bắt lỗi tràn mép, và KHÔNG được bỏ qua — thiếu nó là ngatDong() vô dụng.
    measureText(t) {
      return { width: String(t).length * coChu() * 0.55 };
    },
  };
  return c;
};

describe('render/maze: vẽ được, không vỡ', () => {
  it('vẽ đủ ba mức khó và mọi phiên bản mà không ném lỗi', () => {
    for (let muc = 0; muc < 3; muc++) {
      for (const skin of Object.keys(MAZE_SKINS)) {
        const run = makeRun(5, muc);
        const ctx = mockCtx();
        expect(() => drawMaze(ctx, run, skin, MAZE_DIFF[muc].sight)).not.toThrow();
        expect(() => drawHud(ctx, run, MAZE_DIFF[muc])).not.toThrow();
        expect(ctx.calls.length).toBeGreaterThan(50);
      }
    }
  });

  it('mọi bảng màu có đủ trường và mã màu hợp lệ', () => {
    for (const [k, s] of Object.entries(MAZE_SKINS)) {
      for (const f of ['n', 'bg', 'wall', 'wallTop', 'floor', 'hero', 'r'])
        expect(s[f], `${k}.${f}`).toBeDefined();
      for (const f of ['bg', 'wall', 'wallTop', 'floor', 'hero'])
        expect(s[f], `${k}.${f}`).toMatch(/^#[0-9a-f]{6}$/i); // bắt ký tự lạ lọt vào mã màu
    }
  });

  it('bảng màu không tồn tại thì rơi về mặc định, không vỡ', () => {
    const ctx = mockCtx();
    expect(() => drawMaze(ctx, makeRun(1, 0), 'khong-co-that', 99)).not.toThrow();
  });

  it('KHÔNG vẽ ra ngoài canvas 900×500 — mê cung to nhất cũng phải lọt khung', () => {
    for (let muc = 0; muc < 3; muc++) {
      const run = makeRun(9, muc);
      const ctx = mockCtx();
      drawMaze(ctx, run, 'khoivuong', MAZE_DIFF[muc].sight);
      drawHud(ctx, run, MAZE_DIFF[muc]);
      for (const [x, y] of ctx.diem) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(-6);
        expect(x).toBeLessThanOrEqual(W + 6);
        expect(y).toBeGreaterThanOrEqual(-6);
        expect(y).toBeLessThanOrEqual(H + 6);
      }
    }
  });

  // Lỗi thật: mắt vẽ theo `run.dir`, mà dir về null mỗi khi đứng ở tâm ô → nhân vật cứ
  // dừng lại là quay mặt sang phải, lệch hẳn với mũi tên. Nay cả hai cùng dùng `facing`.
  it('mắt và mũi tên vẽ theo FACING, không theo dir — đổi facing là hình vẽ đổi theo', () => {
    const ve = (huong) => {
      const run = makeRun(5, 0);
      run.nhinVe(huong);
      expect(run.dir).toBe(null); // đang đứng yên: nếu vẽ theo dir thì hai bên sẽ giống hệt
      const ctx = mockCtx();
      drawMaze(ctx, run, 'khoivuong', MAZE_DIFF[0].sight);
      return JSON.stringify(ctx.diem);
    };
    const trai = ve({ x: -1, y: 0 });
    const phai = ve({ x: 1, y: 0 });
    const len = ve({ x: 0, y: -1 });
    expect(trai).not.toBe(phai);
    expect(trai).not.toBe(len);
    expect(phai).not.toBe(len);
  });

  it('mũi tên chỉ ĐÚNG phía facing, không chỉ ngược', () => {
    const run = makeRun(5, 0);
    run.nhinVe({ x: -1, y: 0 }); // nhìn sang TRÁI
    const ctx = mockCtx();
    drawMaze(ctx, run, 'khoivuong', MAZE_DIFF[0].sight);
    const u = VIEW.s / run.maze.size;
    const hx = VIEW.x + run.x * u;
    // phải có nét vẽ nằm hẳn bên trái nhân vật (đuôi + đầu mũi tên)
    const beTrai = ctx.diem.filter(
      ([x, y]) => x < hx - u * 0.5 && Math.abs(y - (VIEW.y + run.y * u)) < u * 0.4,
    );
    expect(beTrai.length).toBeGreaterThan(0);
  });

  // LỖI THẬT (thấy trên ảnh chụp màn hình): drawButton kết thúc bằng textAlign='left',
  // nên mọi dòng chữ vẽ SAU nút đều canh trái — chữ "Toán lớp 1" chạy từ giữa màn hình
  // sang phải và ĐÈ LÊN nút ▶. Hàm vẽ không được để lại dấu vết lên trạng thái người gọi.
  it('drawButtons KHÔNG làm bẩn textAlign / textBaseline / alpha của người gọi', () => {
    const ctx = mockCtx();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 1;
    drawButtons(ctx, nutManChon(stMenu), 'batDau');
    expect(ctx.textAlign).toBe('center');
    expect(ctx.textBaseline).toBe('middle');
    expect(ctx.globalAlpha).toBe(1);
  });

  it('MÀN CHỌN: mọi dòng chữ đều vẽ ở chế độ CANH GIỮA', () => {
    const ctx = mockCtx();
    const canh = [];
    const goc = ctx.fillText;
    ctx.fillText = (t, x, y) => {
      canh.push([String(t), ctx.textAlign]);
      goc(t, x, y);
    };
    drawMenu(ctx, stMenu, nutManChon(stMenu), null);
    // Chữ trên nút do drawButton vẽ (cũng canh giữa). Mọi dòng còn lại cũng phải canh giữa.
    for (const [t, a] of canh) expect(a, `dòng "${t}" canh ${a}`).toBe('center');
    expect(canh.some(([t]) => t.includes('Lớp 1'))).toBe(true);
  });

  // LỖI THẬT (ảnh chụp màn hình): câu đố dài 78 ký tự vẽ thành MỘT dòng, tràn ra ngoài
  // CẢ HAI mép — mất chữ đầu "Để" và chữ cuối "gì?". Co cỡ chữ thôi không đủ, phải ngắt dòng.
  it('CÂU HỎI DÀI phải ngắt dòng, không dòng nào tràn ra ngoài mép', () => {
    const dai = [
      'Để nguyên nghe hết mọi điều; thêm dấu huyền nữa, rất nhiều người khen. Là chữ gì?',
      'Một hình chữ nhật có chiều dài 18 cm và chiều rộng 12 cm thì chu vi bằng bao nhiêu xăng-ti-mét?',
      'Trong truyền thuyết bà Lê Chân nữ tướng tiên phong của Hai Bà Trưng xưa kia đã dùng môn thể thao nào để tuyển binh?',
      'Ngắn.',
    ];
    for (const q of dai) {
      const ctx = mockCtx();
      drawQuestion(ctx, { q, a: ['A', 'B', 'C', 'D'], k: 0, why: 'Giải thích ngắn.' }, [], false);
      const deBai = ctx.chu.filter((c) => q.includes(c.t));
      expect(deBai.length, `"${q.slice(0, 30)}…" không vẽ ra đề bài`).toBeGreaterThan(0);
      for (const d of deBai) {
        const rong = d.t.length * d.co * 0.55;
        const trai = d.canh === 'center' ? d.x - rong / 2 : d.x;
        expect(trai, `dòng "${d.t}" tràn mép TRÁI`).toBeGreaterThanOrEqual(0);
        expect(trai + rong, `dòng "${d.t}" tràn mép PHẢI`).toBeLessThanOrEqual(W);
      }
    }
  });

  it('LỜI GIẢI dài cũng ngắt dòng theo bề ngang thật', () => {
    const ctx = mockCtx();
    drawQuestion(
      ctx,
      {
        q: 'Câu hỏi ngắn?',
        a: ['A', 'B', 'C', 'D'],
        k: 0,
        why: 'Quy đồng mẫu số 8 và 4 thành 32, cộng tử số lại rồi rút gọn. KHÔNG được cộng tử với tử và mẫu với mẫu.',
      },
      [1, 2, 3],
      true,
    );
    for (const d of ctx.chu) {
      const rong = d.t.length * d.co * 0.55;
      const trai = d.canh === 'center' ? d.x - rong / 2 : d.x;
      expect(trai, `"${d.t}" tràn mép trái`).toBeGreaterThanOrEqual(-2);
      expect(trai + rong, `"${d.t}" tràn mép phải`).toBeLessThanOrEqual(W + 2);
    }
  });

  it('ngatDong: cắt theo bề ngang, không cắt đôi từ, câu rỗng vẫn an toàn', () => {
    const ctx = mockCtx();
    ctx.font = '20px system-ui';
    const d = ngatDong(ctx, 'một hai ba bốn năm sáu bảy tám chín mười', 120);
    expect(d.length).toBeGreaterThan(1);
    expect(d.join(' ')).toBe('một hai ba bốn năm sáu bảy tám chín mười'); // không mất chữ nào
    for (const x of d) expect(x.trim()).toBe(x);
    expect(ngatDong(ctx, '', 100)).toEqual(['']);
    // từ dài hơn cả dòng thì để tràn còn hơn cắt đôi chữ
    expect(ngatDong(ctx, 'siêuuuuuuuuuuudàiiiiii', 20)).toHaveLength(1);
  });

  it('mê cung to nhất vẫn vừa khung vuông 480 điểm ảnh', () => {
    const run = makeRun(1, 2);
    expect(VIEW.s / run.maze.size).toBeGreaterThan(8); // ô nhỏ hơn 8px là không nhìn ra gì
  });

  it('sương mù: mức Khó vẽ ít lệnh hơn hẳn mức Dễ (che phần chưa thấy)', () => {
    const de = mockCtx(),
      kho = mockCtx();
    drawMaze(de, makeRun(4, 0), 'khoivuong', MAZE_DIFF[0].sight);
    drawMaze(kho, makeRun(4, 2), 'khoivuong', MAZE_DIFF[2].sight);
    // Khó có 31×31 = 961 ô, Dễ chỉ 15×15 = 225 ô. Nếu không che thì Khó phải vẽ NHIỀU hơn.
    expect(kho.calls.length).toBeLessThan(de.calls.length);
  });

  it('alpha luôn được trả về 1 sau khi vẽ (không rò sang lệnh sau)', () => {
    const ctx = mockCtx();
    drawMaze(ctx, makeRun(2, 2), 'khoivuong', MAZE_DIFF[2].sight);
    expect(ctx.globalAlpha).toBe(1);
  });

  it('save/restore luôn cân bằng — không rò trạng thái ctx', () => {
    const ctx = mockCtx();
    drawMaze(ctx, makeRun(3, 1), 'phuchu', MAZE_DIFF[1].sight);
    const s = ctx.calls.filter((c) => c === 'save').length;
    const r = ctx.calls.filter((c) => c === 'restore').length;
    expect(s).toBe(r);
  });

  it('HUD hiện đúng số chìa đang có trên tổng số cần', () => {
    const run = makeRun(6, 1);
    const ctx = mockCtx();
    drawHud(ctx, run, MAZE_DIFF[1]);
    expect(ctx.calls).toContain(`fillText:0/${run.needKeys}`);
  });

  it('màn câu hỏi vẽ đủ đề bài và 4 lựa chọn', () => {
    const ctx = mockCtx();
    const cau = { q: '34 + 28 = ?', a: ['62', '52', '512', '61'], k: 0, why: 'Nhớ 1 nhé.' };
    drawQuestion(ctx, cau, [], false);
    expect(ctx.calls).toContain('fillText:34 + 28 = ?');
    for (const o of cau.a) expect(ctx.calls).toContain('fillText:' + o);
  });

  it('sai 3 lần thì màn câu hỏi hiện LỜI GIẢI và lối thoát', () => {
    const ctx = mockCtx();
    const cau = { q: '1/2 + 1/3 = ?', a: ['5/6', '2/5', '3/5', '1/6'], k: 0, why: 'Quy đồng mẫu.' };
    drawQuestion(ctx, cau, [1, 2, 3], true);
    expect(ctx.calls.some((c) => c.startsWith('fillText:Quy đồng'))).toBe(true);
    expect(ctx.calls.some((c) => c.toLowerCase().includes('cửa vẫn mở'))).toBe(true);
    expect(ctx.calls.some((c) => c.includes('Đi tiếp'))).toBe(true); // có NÚT để bấm đi tiếp
  });

  it('đề bài và lời giải DÀI vẫn không vẽ tràn ra ngoài canvas', () => {
    const ctx = mockCtx();
    drawQuestion(
      ctx,
      {
        q: 'Một hình chữ nhật có chiều dài 18 cm và chiều rộng 12 cm thì chu vi bằng bao nhiêu?',
        a: ['60 cm', '216 cm', '30 cm', '48 cm'],
        k: 0,
        why: 'Chu vi bằng (dài cộng rộng) nhân 2. '.repeat(8),
      },
      [1, 2, 3],
      true,
    );
    for (const [x, y] of ctx.diem) {
      expect(x).toBeGreaterThanOrEqual(-6);
      expect(x).toBeLessThanOrEqual(W + 6);
      expect(y).toBeGreaterThanOrEqual(-6);
      expect(y).toBeLessThanOrEqual(H + 6);
    }
  });

  it('màn phủ vẽ được tiêu đề và các dòng', () => {
    const ctx = mockCtx();
    drawOverlay(ctx, 'Xin chào', ['dòng 1', 'dòng 2']);
    expect(ctx.calls).toContain('fillText:Xin chào');
    expect(ctx.calls).toContain('fillText:dòng 2');
  });
});
