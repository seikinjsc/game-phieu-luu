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

  it('sai 3 lần thì màn câu hỏi hiện LỜI GIẢI và nói rõ CỬA VẪN KHOÁ', () => {
    const ctx = mockCtx();
    const cau = { q: '1/2 + 1/3 = ?', a: ['5/6', '2/5', '3/5', '1/6'], k: 0, why: 'Quy đồng mẫu.' };
    drawQuestion(ctx, cau, [1, 2, 3], true);
    expect(ctx.calls.some((c) => c.startsWith('fillText:Quy đồng'))).toBe(true);
    expect(ctx.calls.some((c) => c.toLowerCase().includes('vẫn khoá'))).toBe(true);
    expect(ctx.calls.some((c) => c.includes('Quay lại thử sau'))).toBe(true); // có NÚT để thoát
  });

  // Màn câu hỏi phủ kín HUD, mà từ nay SAI LÀ MẤT TIM — phải vẽ lại dãy tim ngay tại đây,
  // không thì bé không thấy mình đang mất gì.
  it('màn câu hỏi vẽ dãy TIM, tim đã mất thì mờ đi', () => {
    const ctx = mockCtx();
    const cau = { q: '2 + 2 = ?', a: ['4', '3', '5', '22'], k: 0, why: '' };
    drawQuestion(ctx, cau, [1], false, { tim: 2, timToiDa: 4 });
    expect(ctx.calls.filter((c) => c === 'fillText:❤️').length).toBe(4);
    expect(ctx.globalAlpha).toBe(1); // trả lại alpha, không rò sang phần vẽ sau
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

// Quy đổi toạ độ bản đồ nhỏ — phép tính lệch một ô là bấm một đằng đi một nẻo, mà nhìn
// bằng mắt thì gần như không phát hiện ra. Kiểm khứ hồi: tâm mỗi ô phải trả về đúng ô đó.
describe('render/maze3d: bấm vào bản đồ nhỏ', () => {
  it('tâm mỗi ô trên bản đồ nhỏ quy đổi về đúng ô đó', async () => {
    const { oTuBanDo, BAN_DO_K } = await import('../src/render/maze3d.js');
    const { W, H } = await import('../src/ui/mecung-ui.js');
    for (const size of [15, 21, 31]) {
      const s = VIEW.s * BAN_DO_K;
      const mx = W - s - 12,
        my = H - s - 12;
      const u = s / size;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const o = oTuBanDo({ x: mx + (x + 0.5) * u, y: my + (y + 0.5) * u }, size);
          expect(o, `ô ${x},${y} của lưới ${size}`).toEqual({ x, y });
        }
    }
  });

  it('bấm ra NGOÀI bản đồ nhỏ thì trả null, không đoán bừa một ô', async () => {
    const { oTuBanDo, BAN_DO_K } = await import('../src/render/maze3d.js');
    const { W, H } = await import('../src/ui/mecung-ui.js');
    const s = VIEW.s * BAN_DO_K;
    const mx = W - s - 12,
      my = H - s - 12;
    for (const p of [
      { x: 10, y: 10 }, // góc trên trái — giữa khung nhìn 3D
      { x: W / 2, y: H / 2 }, // chính giữa màn hình
      { x: mx - 1, y: my + 5 }, // sát mép trái bản đồ
      { x: mx + 5, y: my - 1 }, // sát mép trên bản đồ
      { x: mx + s, y: my + 5 }, // vừa quá mép phải
      { x: mx + 5, y: my + s }, // vừa quá mép dưới
    ])
      expect(oTuBanDo(p, 21), `${p.x},${p.y}`).toBe(null);
  });
});

// Quy vùng bấm về hướng đi ở góc nhìn nhập vai. Trục màn hình có y hướng XUỐNG nên phép
// quay 90° rất dễ nhầm dấu — mà nhầm thì bấm trái đi phải, đọc code không tài nào thấy.
describe('render/maze3d: bấm vào thế giới 3D để đi', () => {
  const DONG = { x: 1, y: 0 },
    TAY = { x: -1, y: 0 },
    BAC = { x: 0, y: -1 },
    NAM = { x: 0, y: 1 };

  it('bấm bên trái/phải màn hình là rẽ trái/phải SO VỚI HƯỚNG ĐANG NHÌN', async () => {
    const { huongTuDiemBam } = await import('../src/render/maze3d.js');
    // Nhìn về đông (phải trên bản đồ): trái của mình là bắc, phải của mình là nam.
    const traiCua = { đông: BAC, nam: DONG, tây: NAM, bắc: TAY };
    const phaiCua = { đông: NAM, nam: TAY, tây: BAC, bắc: DONG };
    const huong = { đông: DONG, nam: NAM, tây: TAY, bắc: BAC };
    for (const [ten, f] of Object.entries(huong)) {
      expect(huongTuDiemBam({ x: 100, y: 300 }, f), `nhìn ${ten}, bấm trái`).toEqual(traiCua[ten]);
      expect(huongTuDiemBam({ x: 800, y: 300 }, f), `nhìn ${ten}, bấm phải`).toEqual(phaiCua[ten]);
    }
  });

  it('bấm giữa là ĐI THẲNG, bấm giữa-thấp là QUAY LẠI', async () => {
    const { huongTuDiemBam, VUNG_LUI } = await import('../src/render/maze3d.js');
    for (const f of [DONG, TAY, BAC, NAM]) {
      expect(huongTuDiemBam({ x: 450, y: 200 }, f)).toEqual(f);
      // `|| 0` để kỳ vọng không tự sinh ra −0 — đúng thứ mà chính phép quy đổi phải tránh.
      expect(huongTuDiemBam({ x: 450, y: VUNG_LUI + 40 }, f)).toEqual({
        x: -f.x || 0,
        y: -f.y || 0,
      });
    }
  });

  // Bốn vùng phải phủ KÍN khung nhìn và mỗi điểm chỉ thuộc đúng một vùng — chỗ hở là bấm
  // vào đó không có gì xảy ra, mà người chơi thì không biết vì sao.
  it('mọi điểm trong khung nhìn đều rơi vào đúng một hướng đi được', async () => {
    const { huongTuDiemBam } = await import('../src/render/maze3d.js');
    const hop = [DONG, TAY, BAC, NAM].map((d) => JSON.stringify(d));
    for (let x = 0; x < W; x += 25)
      for (let y = 60; y < H; y += 25) {
        const d = huongTuDiemBam({ x, y }, DONG);
        expect(hop, `điểm ${x},${y}`).toContain(JSON.stringify(d));
      }
  });
});

// Nhìn tự do bằng kéo chuột: góc nhìn liên tục, nhưng nhân vật chỉ đi được BỐN hướng nên
// phải chốt về hướng gần nhất. Chốt lệch một nấc là kéo nhìn xong bấm tiến lại đi ngang.
describe('render/maze3d: chốt góc nhìn tự do về bốn hướng', () => {
  it('mọi góc đều chốt về đúng hướng gần nhất, kể cả góc ÂM và góc quay nhiều vòng', async () => {
    const { huongNhin } = await import('../src/render/maze3d.js');
    const goc = (d) => (d * Math.PI) / 180;
    const ten = (h) => `${h.x},${h.y}`;
    // 0° = đông · 90° = nam (trục y hướng xuống) · 180° = tây · 270° = bắc
    const mong = [
      [0, '1,0'],
      [40, '1,0'],
      [50, '0,1'],
      [90, '0,1'],
      // 135° đúng là ranh giới nam/tây — hoà, ngả về bên nào cũng được. Canh HAI BÊN ranh
      // giới thay vì canh đúng điểm hoà: canh điểm hoà chỉ chốt cứng một chi tiết vô nghĩa.
      [134, '0,1'],
      [136, '-1,0'],
      [180, '-1,0'],
      [270, '0,-1'],
      [-90, '0,-1'],
      [-180, '-1,0'],
      [360, '1,0'],
      [720 + 90, '0,1'], // quay mấy vòng rồi vẫn phải đúng
      [-720 - 90, '0,-1'],
    ];
    for (const [d, k] of mong) expect(ten(huongNhin(goc(d))), `${d}°`).toBe(k);
  });

  it('không góc nào cho ra hướng chéo hay hướng đứng yên', async () => {
    const { huongNhin } = await import('../src/render/maze3d.js');
    for (let d = -1080; d <= 1080; d += 3) {
      const h = huongNhin((d * Math.PI) / 180);
      expect(Math.abs(h.x) + Math.abs(h.y), `${d}°`).toBe(1);
    }
  });
});

// Bốn hướng tương đối là nguồn CHUNG cho cả chuột lẫn bàn phím ở góc nhìn nhập vai.
// Sai một phép quay ở đây là bấm phím trái đi một đằng, bấm chuột bên trái đi một nẻo.
describe('render/maze3d: bốn hướng tương đối', () => {
  it('quay trái rồi quay trái nữa là quay lại; quay trái rồi phải là về chỗ cũ', async () => {
    const { huongTuongDoi } = await import('../src/render/maze3d.js');
    for (const f of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const r = huongTuongDoi(f);
      expect(r.thang, 'thẳng là chính hướng đang nhìn').toEqual(f);
      expect(huongTuongDoi(r.trai).trai, 'trái hai lần = lùi').toEqual(r.lui);
      expect(huongTuongDoi(r.trai).phai, 'trái rồi phải = về chỗ cũ').toEqual(r.thang);
      expect(huongTuongDoi(r.lui).lui, 'lùi hai lần = về chỗ cũ').toEqual(r.thang);
      // Bốn hướng phải KHÁC nhau đôi một, và đều là hướng đi được (không chéo, không đứng yên)
      const bo = new Set([r.thang, r.lui, r.trai, r.phai].map((d) => `${d.x},${d.y}`));
      expect(bo.size, 'bốn hướng phải khác nhau').toBe(4);
      for (const d of [r.thang, r.lui, r.trai, r.phai])
        expect(Math.abs(d.x) + Math.abs(d.y)).toBe(1);
    }
  });

  it('chuột và bàn phím dùng CHUNG một phép quay, không lệch nhau', async () => {
    const { huongTuongDoi, huongTuDiemBam, VUNG_LUI } = await import('../src/render/maze3d.js');
    for (const f of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const r = huongTuongDoi(f);
      expect(huongTuDiemBam({ x: 100, y: 300 }, f)).toEqual(r.trai);
      expect(huongTuDiemBam({ x: 800, y: 300 }, f)).toEqual(r.phai);
      expect(huongTuDiemBam({ x: 450, y: 200 }, f)).toEqual(r.thang);
      expect(huongTuDiemBam({ x: 450, y: VUNG_LUI + 40 }, f)).toEqual(r.lui);
    }
  });
});

// Camera có trạng thái thật (cờ "đang nhìn tự do"), nên phải có phép canh: quên xoá cờ là
// camera không bao giờ bám lại hướng người, còn xoá nhầm là vừa buông tay đã bật về chỗ cũ.
describe('render/maze3d: camera nhìn tự do', () => {
  const runGia = (f) => ({ facing: f });

  it('xoay cộng đúng góc đã kéo, và kéo tiếp thì cộng dồn', async () => {
    const { makeCam } = await import('../src/render/maze3d.js');
    const cam = makeCam(runGia({ x: 1, y: 0 })); // nhìn đông → yaw = 0
    expect(cam.yaw).toBeCloseTo(0);
    cam.xoay(0.5);
    expect(cam.yaw).toBeCloseTo(0.5);
    cam.xoay(-1.25);
    expect(cam.yaw).toBeCloseTo(-0.75);
  });

  it('đã tự xoay thì update KHÔNG kéo về; gọi bamTheo mới bám lại hướng người', async () => {
    const { makeCam } = await import('../src/render/maze3d.js');
    const r = runGia({ x: 1, y: 0 });
    const cam = makeCam(r);
    cam.xoay(1);
    for (let i = 0; i < 60; i++) cam.update(r, 1 / 60);
    expect(cam.yaw, 'đang nhìn tự do: phải giữ nguyên góc').toBeCloseTo(1);
    cam.bamTheo();
    for (let i = 0; i < 120; i++) cam.update(r, 1 / 60);
    expect(cam.yaw, 'bám lại rồi: phải về đúng hướng người').toBeCloseTo(0, 2);
  });

  it('quay về hướng ngược lại đi theo cung NGẮN NHẤT, không lộn một vòng', async () => {
    const { makeCam } = await import('../src/render/maze3d.js');
    const r = runGia({ x: -1, y: 0 }); // nhìn tây → yaw đích = π
    const cam = makeCam(runGia({ x: 1, y: 0 }));
    cam.xoay(-3); // gần −π, tức là sát đích nhưng ở phía bên kia vạch ±π
    cam.bamTheo();
    const truoc = cam.yaw;
    cam.update(r, 1 / 60);
    // Đi cung ngắn nhất thì bước đầu tiên phải nhỏ; đi vòng ngược sẽ nhảy một bước rất lớn.
    expect(Math.abs(cam.yaw - truoc)).toBeLessThan(0.1);
  });
});

// ẢNH DÁN + BỘ ĐỆM ĐỘ SÂU. Đây là chỗ dễ hỏng nhất của raycasting: quên so độ sâu là quái
// đứng sau tường vẫn hiện lù lù, mà nhìn ảnh chụp màn hình thì rất khó nhận ra ngay.
describe('render/maze3d: vật thể trên đường đi', () => {
  // maze3d sinh vân tường và ảnh dán vào canvas ẩn ngay lần vẽ đầu → cần một `document`
  // tối thiểu. `getContext` trả null là đủ: mã sinh ảnh có nhánh dự phòng cho môi trường
  // không có DOM thật, và phép đo ở đây chỉ đếm lệnh trên ctx BÊN NGOÀI.
  globalThis.document ||= {
    createElement: () => ({ width: 0, height: 0, getContext: () => null }),
  };

  // ctx đếm riêng cột TƯỜNG và cột ẢNH DÁN. Phân biệt bằng chữ ký: tường luôn cắt bề rộng
  // nguồn đúng 1 điểm ảnh, ảnh dán thì cắt theo tỉ lệ nên gần như không bao giờ bằng 1.
  const ctxDem = () => {
    const d = { tuong: 0, dan: 0 };
    return new Proxy(
      {
        dem: d,
        drawImage: (img, sx, sy, sw) => (sw === 1 ? d.tuong++ : d.dan++),
        createLinearGradient: () => ({ addColorStop() {} }),
        globalAlpha: 1,
        fillStyle: '',
      },
      { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) },
    );
  };

  // Hành lang thẳng theo trục x ở hàng y = 2, ô 1..3 đi được. `chan` để bịt ô giữa lại.
  const theGia = (chan) => ({
    x: 1.5,
    y: 2.5,
    time: 0,
    keys: 0,
    needKeys: 1,
    facing: { x: 1, y: 0 },
    quai: [],
    isOpen: () => false,
    hasCoin: () => true,
    maze: {
      size: 5,
      exit: { x: 1, y: 2 }, // ngay dưới chân người chơi → tự bị loại, không nhiễu phép đo
      gates: [],
      bonus: [],
      coins: [{ x: 3, y: 2 }],
      isWall: (x, y) => y !== 2 || x < 1 || x > 3 || (chan && x === 2),
    },
  });

  it('xu ở cuối hành lang trống thì ĐƯỢC vẽ', async () => {
    const { drawMaze3D, makeCam } = await import('../src/render/maze3d.js');
    const run = theGia(false);
    const ctx = ctxDem();
    drawMaze3D(ctx, run, makeCam(run), 'khoivuong', 99);
    expect(ctx.dem.tuong, 'phải dựng được tường').toBeGreaterThan(0);
    expect(ctx.dem.dan, 'xu trong tầm nhìn thẳng phải hiện ra').toBeGreaterThan(0);
  });

  it('xu bị TƯỜNG CHE thì KHÔNG được vẽ — bộ đệm độ sâu phải chặn', async () => {
    const { drawMaze3D, makeCam } = await import('../src/render/maze3d.js');
    const run = theGia(true); // bịt ô giữa hành lang
    const ctx = ctxDem();
    drawMaze3D(ctx, run, makeCam(run), 'khoivuong', 99);
    expect(ctx.dem.tuong).toBeGreaterThan(0);
    expect(ctx.dem.dan, 'xu nằm sau tường mà vẫn vẽ = quên so độ sâu').toBe(0);
  });

  it('vật thể SAU LƯNG không được vẽ', async () => {
    const { drawMaze3D, makeCam } = await import('../src/render/maze3d.js');
    const run = theGia(false);
    run.facing = { x: -1, y: 0 }; // quay lưng lại phía có xu
    const ctx = ctxDem();
    drawMaze3D(ctx, run, makeCam(run), 'khoivuong', 99);
    expect(ctx.dem.dan).toBe(0);
  });

  it('không vẽ ra ngoài khung nhìn dù vật thể sát mặt', async () => {
    const { drawMaze3D, makeCam } = await import('../src/render/maze3d.js');
    const run = theGia(false);
    run.maze.coins = [{ x: 1, y: 2 }]; // xu ngay dưới chân → phóng to cực đại
    run.x = 1.2; // lệch khỏi tâm ô một chút để không bị loại vì quá gần
    const ngoai = [];
    const ctx = new Proxy(
      {
        dem: { tuong: 0, dan: 0 },
        drawImage: (img, sx, sy, sw, sh, dx, dy, dw) => {
          if (dx < 0 || dx + dw > 900) ngoai.push(dx);
        },
        createLinearGradient: () => ({ addColorStop() {} }),
        globalAlpha: 1,
      },
      { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) },
    );
    drawMaze3D(ctx, run, makeCam(run), 'khoivuong', 99);
    expect(ngoai, `${ngoai.length} cột vẽ tràn ra ngoài mép`).toEqual([]);
  });
});
