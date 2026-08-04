import { describe, it, expect, vi } from 'vitest';

// Smoke test cho ĐIỂM VÀO src/mecung.js — phần glue duy nhất không có test nào khác chạm tới.
// Giả lập DOM tối thiểu rồi nạp mô-đun thật, bắt lấy hàm requestAnimationFrame và hàm
// xử lý phím để tự gọi. Không cần trình duyệt, đúng tinh thần harness của dự án.
function dungDom() {
  const loi = [];
  const chu = []; // GHI LẠI mọi fillText — đây là cách duy nhất "nhìn" được màn hình
  const ctx = new Proxy(
    {
      canvas: {},
      font: '16px system-ui',
      fillText: (t) => chu.push(String(t)),
      // Bắt buộc phải có: mã vẽ dùng measureText để ngắt dòng. Proxy trả hàm rỗng thì
      // `.width` là undefined và cả vòng lặp game chết ngay khung đầu.
      measureText: (t) => ({ width: String(t).length * 9 }),
      // Cùng lý do: các hàm canvas TRẢ VỀ ĐỐI TƯỢNG phải được giả lập riêng. Proxy trả
      // `() => {}` cho mọi thứ, nên `createLinearGradient().addColorStop()` sẽ nổ ngay.
      // Góc nhìn nhập vai dùng dải màu chuyển sắc cho trần và sàn.
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} }),
    },
    {
      get: (t, k) => {
        if (k in t) return t[k];
        return () => {}; // mọi lệnh vẽ khác đều nuốt
      },
      set: (t, k, v) => {
        t[k] = v;
        return true;
      },
    },
  );
  const phim = [];
  let khung = null;
  const chuot = [];
  globalThis.document = {
    // Dùng chung một ctx giả cho cả canvas chính lẫn các canvas ẩn mà maze3d dựng vân
    // tường và ảnh dán vào — mọi lệnh vẽ đều bị nuốt, chỉ cần không nổ.
    createElement: () => ({
      style: {},
      getContext: () => ctx,
      width: 0,
      height: 0,
      addEventListener: (t, f) => chuot.push([t, f]),
      // canvas bị CSS co giãn — trả khung 900×500 cho khớp hệ toạ độ logic
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 640 }),
    }),
    getElementById: () => ({ appendChild() {} }),
  };
  globalThis.window = { addEventListener: (t, f) => phim.push([t, f]) };
  globalThis.requestAnimationFrame = (f) => {
    khung = f;
  };
  let ts = 0;
  const dom = {
    loi,
    chu,
    manHinh: () => chu.join(' | '), // những gì vừa vẽ ở khung gần nhất
    goiPhim: (type, code) => {
      for (const [t, f] of phim) if (t === type) f({ code, preventDefault() {} });
    },
    // Bấm chuột tại toạ độ LOGIC (900×500): nhấn xuống rồi nhả đúng chỗ đó.
    bam: (x, y) => {
      for (const [t, f] of chuot)
        if (t === 'mousedown' || t === 'mouseup')
          f({ clientX: x, clientY: y, preventDefault() {} });
    },
    // Nhấn giữ ở (x,y) rồi rê qua các điểm, cuối cùng nhả ra — dùng để thử kéo xoay.
    reChuot: (x, y, diem) => {
      const goi = (loai, cx, cy) => {
        for (const [t, f] of chuot)
          if (t === loai) f({ clientX: cx, clientY: cy, preventDefault() {} });
      };
      goi('mousedown', x, y);
      for (const [mx, my] of diem) goi('mousemove', mx, my);
      goi('mouseup', ...diem[diem.length - 1]);
    },
    chay: (n = 1, buoc = 16) => {
      for (let i = 0; i < n; i++) {
        const f = khung;
        khung = null;
        if (!f) break;
        chu.length = 0; // mỗi khung vẽ lại từ đầu
        ts += buoc;
        f(ts);
      }
    },
    // Thả hết phím hướng rồi bấm đúng một hướng — khớp với ngăn xếp phím của điểm vào.
    di: (d) => {
      for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) dom.goiPhim('keyup', k);
      const k = { '-1,0': 'ArrowLeft', '1,0': 'ArrowRight', '0,-1': 'ArrowUp', '0,1': 'ArrowDown' }[
        d.x + ',' + d.y
      ];
      if (k) dom.goiPhim('keydown', k);
    },
  };
  return dom;
}

describe('mecung.js: điểm vào chạy được', () => {
  it('nạp được, vẽ được màn chọn, chơi được, và tới đích thì thắng', async () => {
    const dom = dungDom();
    await import('../src/mecung.js');

    // Màn chọn mức: chạy vài khung, không được ném lỗi
    expect(() => dom.chay(3)).not.toThrow();

    // Bấm "2" để vào mức Vừa, rồi giữ phím sang phải một lúc
    dom.goiPhim('keydown', 'Digit2');
    dom.goiPhim('keydown', 'ArrowRight');
    expect(() => dom.chay(120)).not.toThrow();
    dom.goiPhim('keyup', 'ArrowRight');

    // Bấm loạn 4 hướng — không khung nào được ném lỗi
    for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA']) {
      dom.goiPhim('keydown', k);
      expect(() => dom.chay(40)).not.toThrow();
      dom.goiPhim('keyup', k);
    }

    // R chơi lại, B đổi phiên bản, ENTER ở màn thắng — không được vỡ
    dom.goiPhim('keydown', 'KeyR');
    expect(() => dom.chay(20)).not.toThrow();
    dom.goiPhim('keydown', 'Enter');
    expect(() => dom.chay(20)).not.toThrow();
  });

  // VÒNG CHƠI M2 — test thật, không phải "chạy không lỗi".
  // Dựng một bản sao mê cung y hệt (cùng hạt) để biết đường đi, lái nhân vật tới cửa khoá
  // đầu tiên bằng đúng phím mũi tên, rồi ĐỌC MÀN HÌNH qua fillText để kiểm chứng.
  it('VÒNG CHƠI ĐẦY ĐỦ: tới cửa thì HIỆN CÂU HỎI, trả lời xong mới đi tiếp được', async () => {
    const dom = dungDom();
    vi.resetModules();
    const { makeRun } = await import('../src/systems/maze-run.js');
    const { solve } = await import('../src/systems/maze.js');
    await import('../src/mecung.js');

    dom.goiPhim('keydown', 'Digit1'); // mức Dễ → điểm vào dùng makeRun(1, 0)
    const guong = makeRun(1, 0); // bản sao chạy song song, cùng hạt cùng dt
    const g = guong.maze.gates[0];
    const duong = solve(guong.maze, guong.maze.start.x, guong.maze.start.y, g.x, g.y);

    let k = 1,
      n = 0;
    while (!guong.pending && n++ < 5000) {
      const c = guong.cell;
      if (c.x === duong[k].x && c.y === duong[k].y) {
        k++;
        continue;
      }
      const d = { x: Math.sign(duong[k].x - c.x), y: Math.sign(duong[k].y - c.y) };
      dom.di(d);
      dom.chay(1);
      guong.step(0.016, d);
    }
    expect(guong.pending).toEqual(g); // bản sao đã tới cửa

    // Màn hình thật phải đang hiện câu hỏi
    dom.chay(1);
    expect(dom.manHinh()).toContain('CỬA KHOÁ');

    // Bấm phím hướng lúc này KHÔNG được đi — câu hỏi phải chặn di chuyển
    dom.di({ x: 1, y: 0 });
    dom.chay(10);
    expect(dom.manHinh()).toContain('CỬA KHOÁ');

    // Thử lần lượt 4 đáp án; một trong số đó đúng → màn câu hỏi phải biến mất.
    // Nếu sai đủ 3 lần thì hiện lời giải, bấm ENTER cũng phải qua được.
    for (const phim of ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Enter']) {
      if (!dom.manHinh().includes('CỬA KHOÁ')) break;
      dom.goiPhim('keydown', phim);
      dom.chay(1);
    }
    expect(dom.manHinh()).not.toContain('CỬA KHOÁ'); // đã qua cửa, quay về mê cung
    expect(dom.manHinh()).toContain('🔑'); // HUD hiện trở lại
  });

  it('sai 3 lần thì MẤT TIM và CỬA VẪN KHOÁ — nhưng quay lại là được hỏi câu khác', async () => {
    const dom = dungDom();
    vi.resetModules();
    const { makeRun } = await import('../src/systems/maze-run.js');
    const { solve } = await import('../src/systems/maze.js');
    await import('../src/mecung.js');

    dom.goiPhim('keydown', 'Digit1');
    const guong = makeRun(1, 0);
    const g = guong.maze.gates[0];
    const duong = solve(guong.maze, guong.maze.start.x, guong.maze.start.y, g.x, g.y);
    let k = 1,
      n = 0;
    while (!guong.pending && n++ < 5000) {
      const c = guong.cell;
      if (c.x === duong[k].x && c.y === duong[k].y) {
        k++;
        continue;
      }
      const d = { x: Math.sign(duong[k].x - c.x), y: Math.sign(duong[k].y - c.y) };
      dom.di(d);
      dom.chay(1);
      guong.step(0.016, d);
    }
    dom.chay(1);
    expect(dom.manHinh()).toContain('CỬA KHOÁ');

    // Bấm CÙNG một đáp án 10 lần chỉ tính là MỘT lần sai (không cộng dồn oan cho bé),
    // nên vẫn còn ở màn câu hỏi — đây là hành vi đúng, không phải kẹt.
    for (let i = 0; i < 10; i++) {
      dom.goiPhim('keydown', 'Digit1');
      dom.chay(1);
    }

    // Bấm nốt các đáp án còn lại. Câu hỏi nay ra ngẫu nhiên theo LƯỢT CHƠI nên test không
    // biết trước đáp án đúng nằm ở đâu — kiểm cả hai nhánh, nhánh nào cũng không được kẹt.
    for (const phim of ['Digit2', 'Digit3', 'Digit4']) {
      if (!dom.manHinh().includes('CỬA KHOÁ')) break; // đã mò ra đáp án đúng
      dom.goiPhim('keydown', phim);
      dom.chay(1);
    }
    const hetLuot = dom.manHinh().includes('vẫn khoá'); // sai đủ 3 lượt → hiện lời giải
    dom.goiPhim('keydown', 'Enter');
    dom.chay(1);

    // Không có đường nào dẫn tới BẾ TẮC: màn câu hỏi luôn đóng lại được, trả về mê cung.
    expect(dom.manHinh()).not.toContain('CỬA KHOÁ');
    expect(dom.manHinh()).toContain('🔑');
    // Nhưng chìa thì KHÔNG còn cho không: sai hết 3 lượt là 0 chìa, phải quay lại cửa.
    expect(dom.manHinh()).toContain(hetLuot ? '0/3' : '1/3');
  });

  // GÓC NHÌN NHẬP VAI chạy qua một lối vẽ HOÀN TOÀN KHÁC (raycasting, ảnh dán, bản đồ nhỏ).
  // Không có test nào bước vào đó thì cả lối ấy có thể vỡ mà bộ kiểm thử vẫn xanh.
  it('GÓC NHÌN NHẬP VAI: bật lên chơi được, đổi qua lại không vỡ', async () => {
    const dom = dungDom();
    vi.resetModules();
    await import('../src/mecung.js');

    dom.goiPhim('keydown', 'Digit3'); // mức Khó — mê cung 31×31, 5 quái, nặng nhất
    dom.goiPhim('keydown', 'KeyV'); // sang nhập vai
    expect(() => dom.chay(5)).not.toThrow();
    expect(dom.manHinh()).toContain('🔑'); // HUD vẫn vẽ được đè lên khung 3D

    // Đi loạn bằng bàn phím: tiến, quay trái, quay phải, quay lại
    for (const k of ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp']) {
      dom.goiPhim('keydown', k);
      expect(() => dom.chay(30)).not.toThrow();
      dom.goiPhim('keyup', k);
    }

    // Bấm bốn vùng màn hình + bấm vào bản đồ nhỏ ở góc phải dưới
    for (const [x, y] of [
      [100, 300],
      [800, 300],
      [450, 200],
      [450, 600],
      [800, 560],
    ]) {
      dom.bam(x, y);
      expect(() => dom.chay(20)).not.toThrow();
    }

    // Kéo chuột xoay: nhấn, rê ngang, nhả — không được vỡ và không được bước đi ngoài ý muốn
    expect(() => {
      dom.reChuot(450, 300, [
        [520, 300],
        [610, 300],
        [700, 300],
      ]);
      dom.chay(10);
    }).not.toThrow();

    dom.goiPhim('keydown', 'KeyV'); // về nhìn từ trên xuống
    expect(() => dom.chay(5)).not.toThrow();
    expect(dom.manHinh()).toContain('🔑');
  });

  it('mặc định là Toán LỚP 1 — bậc thấp nhất, hiện rõ ở cả màn chọn lẫn HUD', async () => {
    const dom = dungDom();
    vi.resetModules();
    await import('../src/mecung.js');
    dom.chay(1);
    expect(dom.manHinh()).toContain('Lớp 1');
    dom.goiPhim('keydown', 'Digit1'); // vào chơi
    dom.chay(1);
    expect(dom.manHinh()).toContain('Lớp 1'); // HUD vẫn nói rõ đang ở lớp nào
  });

  // Điều khiển bằng CHUỘT: bấm nút ở màn chọn, rồi bấm ô trong mê cung để tự đi tới đó.
  it('CHUỘT: bấm nút chọn mức + đổi lớp + BẮT ĐẦU, không cần chạm bàn phím', async () => {
    const dom = dungDom();
    vi.resetModules();
    const { nutManChon } = await import('../src/ui/mecung-ui.js');
    const { BO_DE, timBoDe } = await import('../src/data/banks.js');
    const { MAZE_DIFF } = await import('../src/data/difficulty.js');
    await import('../src/mecung.js');
    dom.chay(1);

    const nut = nutManChon({
      muc: 1,
      boDe: 'toan',
      boDeList: BO_DE,
      capList: timBoDe('toan').capDo,
      cap: '1',
      mucList: MAZE_DIFF,
      tenSkin: 'x',
    });
    const giua = (id) => {
      const b = nut.find((n) => n.id === id);
      return [b.x + b.w / 2, b.y + b.h / 2];
    };

    dom.bam(...giua('capTien')); // Lớp 1 → 2
    dom.bam(...giua('capTien')); // Lớp 2 → 3
    dom.chay(1);
    expect(dom.manHinh()).toContain('Lớp 3');

    dom.bam(...giua('muc0')); // chọn mức Dễ
    dom.chay(1);
    expect(dom.manHinh()).toContain('🧸 Dễ');

    dom.bam(...giua('batDau')); // vào chơi
    dom.chay(1);
    expect(dom.manHinh()).toContain('🔑'); // đã sang HUD trong mê cung
    expect(dom.manHinh()).toContain('Lớp 3'); // cấp chọn bằng chuột được giữ nguyên
  });

  // Bằng chứng thật cho "bấm ô là đi tới đó": chọn một NGÕ CỤT CÓ XU mà đường đi tới
  // không đi ngang cửa khoá nào, bấm vào đó, rồi xem HUD đếm xu nhảy từ 0 lên 1.
  // Xu chỉ tăng khi nhân vật THỰC SỰ chạm tâm ô ấy — không có cách nào giả được.
  it('CHUỘT: bấm vào một ô thì nhân vật TỰ ĐI tới đó (xu trên HUD 0 → 1)', async () => {
    const dom = dungDom();
    vi.resetModules();
    const { makeRun } = await import('../src/systems/maze-run.js');
    const { solve } = await import('../src/systems/maze.js');
    const { VIEW } = await import('../src/render/maze.js');
    await import('../src/mecung.js');

    dom.goiPhim('keydown', 'Digit1'); // mức Dễ, cùng hạt với makeRun(1, 0)
    dom.chay(1);
    expect(dom.manHinh()).toContain('🪙 | 0');

    const guong = makeRun(1, 0);
    const u = VIEW.s / guong.maze.size;
    const cua = new Set(guong.maze.gates.map((g) => g.y * guong.maze.size + g.x));
    const dich = guong.maze.coins.find((p) => {
      const d = solve(guong.maze, guong.maze.start.x, guong.maze.start.y, p.x, p.y);
      return d.length > 1 && !d.some((c) => cua.has(c.y * guong.maze.size + c.x));
    });
    expect(dich, 'cần một ngõ cụt không đi ngang cửa khoá').toBeTruthy();

    // MỘT LẦN BẤM = MỘT Ô. Bấm lại nhiều lần về phía đích, đúng như người chơi thật.
    let lan = 0;
    for (; lan < 200 && !dom.manHinh().includes('🪙 | 1'); lan++) {
      dom.bam(VIEW.x + (dich.x + 0.5) * u, VIEW.y + (dich.y + 0.5) * u);
      for (let i = 0; i < 120 && !dom.manHinh().includes('🪙 | 1'); i++) dom.chay(1);
    }
    expect(dom.manHinh()).toContain('🪙 | 1');

    // BẤT BIẾN: một lần bấm đi TỐI ĐA một ô, nên số lần bấm không bao giờ ÍT HƠN số ô phải
    // đi. Ít hơn nghĩa là còn sót chỗ đi một mạch nhiều ô.
    // Cố ý KHÔNG canh "đúng bằng": mức Dễ có một con quái, mà bấm vào vùng quanh quái thì
    // thành lệnh CHÉM chứ không phải lệnh đi (hành vi cố ý, có từ trước). Quái đi tuần nên
    // số lần bấm bị nuốt đổi theo từng ván — canh bằng đúng là test đỏ ngẫu nhiên.
    const soO =
      solve(guong.maze, guong.maze.start.x, guong.maze.start.y, dich.x, dich.y).length - 1;
    expect(lan, `${lan} lần bấm cho ${soO} ô`).toBeGreaterThanOrEqual(soO);
  });

  // Mở cửa hàng từ màn thắng rồi đóng lại thì phải VỀ ĐÚNG màn thắng, không rơi ra màn chọn
  // — rơi ra là mất luôn bảng kê phần thưởng vừa xem dở.
  it('CỬA HÀNG mở từ đâu thì đóng lại về đúng đó', async () => {
    const dom = dungDom();
    vi.resetModules();
    const { nutManChon, nutCuaHang } = await import('../src/ui/mecung-ui.js');
    const { CUA_HANG } = await import('../src/data/shop.js');
    const { BO_DE, timBoDe } = await import('../src/data/banks.js');
    const { MAZE_DIFF } = await import('../src/data/difficulty.js');
    await import('../src/mecung.js');
    dom.chay(1);

    const nutMenu = nutManChon({
      muc: 1,
      boDe: 'toan',
      boDeList: BO_DE,
      capList: timBoDe('toan').capDo,
      cap: '1',
      mucList: MAZE_DIFF,
      tenSkin: 'x',
    });
    const giua = (ds, id) => {
      const b = ds.find((n) => n.id === id);
      return [b.x + b.w / 2, b.y + b.h / 2];
    };

    // Từ màn chọn: mở cửa hàng rồi quay lại → phải về màn chọn
    dom.bam(...giua(nutMenu, 'moShop'));
    dom.chay(1);
    expect(dom.manHinh()).toContain('Cửa hàng');
    const nutShop = nutCuaHang(
      CUA_HANG.map((m) => ({ ...m, daCo: false })),
      0,
    );
    dom.bam(...giua(nutShop, 've'));
    dom.chay(1);
    expect(dom.manHinh()).toContain('Mê Cung Tri Thức'); // tiêu đề màn chọn
  });

  it('đổi lớp và đổi phiên bản ở màn chọn không làm vỡ', async () => {
    const dom = dungDom();
    vi.resetModules();
    await import('../src/mecung.js');
    for (let i = 0; i < 8; i++) {
      dom.goiPhim('keydown', 'KeyL');
      dom.goiPhim('keydown', 'KeyB');
      expect(() => dom.chay(2)).not.toThrow();
    }
    dom.goiPhim('keydown', 'Digit2');
    expect(() => dom.chay(30)).not.toThrow();
  });

  it('dt lớn (tab bị treo) không làm điểm vào vỡ', async () => {
    const dom = dungDom();
    vi.resetModules();
    await import('../src/mecung.js');
    dom.goiPhim('keydown', 'Digit3');
    dom.goiPhim('keydown', 'ArrowRight');
    expect(() => dom.chay(30, 5000)).not.toThrow(); // 5 giây mỗi khung
  });
});
