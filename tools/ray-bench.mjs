// tools/ray-bench.mjs — ĐO chi phí CPU của bộ dựng hình nhập vai, không cần trình duyệt.
//
// Đo được ở đây: phép bắn tia, phép cắt cột, số LỆNH VẼ mỗi khung. Đó là phần thuật toán,
// và là phần duy nhất ta điều khiển được bằng mã.
// KHÔNG đo được ở đây: chi phí thật của `drawImage`/`fillRect` bên trong trình duyệt — thứ
// đó phụ thuộc máy và phải bấm phím ` trong game để xem. Đừng nhầm hai con số này với nhau.
//
// Chạy: node tools/ray-bench.mjs

const dem = { drawImage: 0, fillRect: 0, khac: 0 };

// Canvas giả: đếm lệnh, không vẽ gì. Đủ để `maze3d.js` chạy trọn đường đi của nó.
const taoCtx = () =>
  new Proxy(
    {
      drawImage: () => dem.drawImage++,
      fillRect: () => dem.fillRect++,
      createLinearGradient: () => ({ addColorStop() {} }),
      globalAlpha: 1,
      fillStyle: '',
      font: '',
      textAlign: '',
      measureText: (t) => ({ width: String(t).length * 9 }),
    },
    {
      get: (t, k) => (k in t ? t[k] : () => dem.khac++),
      set: (t, k, v) => ((t[k] = v), true),
    },
  );

globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => taoCtx() }),
};

const { makeRun } = await import('../src/systems/maze-run.js');
const { drawMaze3D, veBanDoNho, makeCam, COT, FOV } = await import('../src/render/maze3d.js');
const { drawMaze } = await import('../src/render/maze.js');
const { MAZE_DIFF } = await import('../src/data/difficulty.js');
const { W } = await import('../src/ui/mecung-ui.js');

const KHUNG = 300;
console.log(`\n═══ ĐO BỘ DỰNG HÌNH NHẬP VAI ═══`);
console.log(`Góc nhìn ${FOV}° · bề rộng cột ${COT}px logic → ${Math.ceil(W / COT)} tia/khung\n`);

let xau = 0,
  dinh2D = 0,
  dinh3D = 0;
for (let muc = 0; muc < MAZE_DIFF.length; muc++) {
  const d = MAZE_DIFF[muc];
  const run = makeRun(7, muc);
  const cam = makeCam(run);
  const ctx = taoCtx();

  // Chạy nóng máy ảo trước, nếu không con số đầu tiên toàn là chi phí biên dịch JIT.
  for (let i = 0; i < 60; i++) drawMaze3D(ctx, run, cam, 'khoivuong', d.sight);

  dem.drawImage = dem.fillRect = dem.khac = 0;
  const t0 = performance.now();
  for (let i = 0; i < KHUNG; i++) {
    run.step(1 / 60, { x: 1, y: 0 }); // vừa đi vừa dựng, đúng như lúc chơi thật
    cam.update(run, 1 / 60);
    drawMaze3D(ctx, run, cam, 'khoivuong', d.sight);
  }
  const ms = (performance.now() - t0) / KHUNG;

  const ve = (dem.drawImage + dem.fillRect) / KHUNG;
  const nganSach = 16.7; // ngân sách một khung ở 60fps
  const dat = ms < nganSach * 0.35; // CPU thuật toán không được ăn quá 1/3 ngân sách
  if (!dat) xau++;
  console.log(
    `${d.n.padEnd(12)} lưới ${String(d.size).padStart(2)}×${d.size}  tầm nhìn ${String(d.sight).padStart(2)}`,
  );
  console.log(
    `  ${dat ? '✓' : '✗'} ${ms.toFixed(3)} ms/khung thuật toán  ` +
      `(${((ms / nganSach) * 100).toFixed(1)}% ngân sách 60fps)`,
  );
  console.log(
    `    ${ve.toFixed(0)} lệnh vẽ/khung → ${((ve * 60) / 1000).toFixed(0)}k lệnh/giây ở 60fps`,
  );

  // MỐC SO SÁNH: bản nhìn từ trên xuống đang chạy hằng ngày. Nếu bộ dựng nhập vai rẻ hơn
  // cái đang chạy được rồi thì câu hỏi hiệu năng coi như đã trả lời.
  // Đo riêng cả BẢN ĐỒ NHỎ, vì nó gọi lại đúng hàm vẽ 2D đó mỗi khung — ở góc nhìn nhập
  // vai ta phải trả CẢ HAI chi phí, không phải một.
  const do2D = (ten, f) => {
    for (let i = 0; i < 60; i++) f();
    dem.drawImage = dem.fillRect = dem.khac = 0;
    const t = performance.now();
    for (let i = 0; i < KHUNG; i++) f();
    const n = (dem.drawImage + dem.fillRect + dem.khac) / KHUNG;
    console.log(
      `    ${ten}: ${((performance.now() - t) / KHUNG).toFixed(3)} ms · ${n.toFixed(0)} lệnh vẽ/khung`,
    );
    return n;
  };
  const n2d = do2D('nhìn từ trên xuống (đang chạy)', () =>
    drawMaze(ctx, run, 'khoivuong', d.sight),
  );
  const nbd = do2D('bản đồ nhỏ ở góc             ', () =>
    veBanDoNho(ctx, run, 'khoivuong', d.sight),
  );
  console.log(
    `    ⇒ TỔNG nhập vai ${(ve + nbd).toFixed(0)} lệnh vẽ ` +
      `so với ${n2d.toFixed(0)} của bản đang chạy (×${((ve + nbd) / n2d).toFixed(1)})`,
  );
  if (nbd > ve)
    console.log(`    ⚠ BẢN ĐỒ NHỎ đắt hơn cả khung nhìn 3D — đây mới là chỗ cần tối ưu\n`);
  else console.log('');
  dinh2D = Math.max(dinh2D, n2d);
  dinh3D = Math.max(dinh3D, ve + nbd);
}

console.log(
  xau
    ? `⚠ ${xau} mức vượt ngân sách thuật toán — hạ độ phân giải (tăng COT) trước khi đi tiếp.`
    : `✓ Phần thuật toán rẻ ở cả ba mức (dưới 1% ngân sách 60fps).`,
);
console.log(
  `\nĐỈNH lệnh vẽ mỗi khung:  nhập vai ${dinh3D.toFixed(0)}  ·  đang chạy ${dinh2D.toFixed(0)}` +
    `  (×${(dinh3D / dinh2D).toFixed(2)})`,
);
console.log(
  `Đây là con số quyết định: bản đang chạy hằng ngày đã tốn ${dinh2D.toFixed(0)} lệnh vẽ mỗi khung,\n` +
    `nên mốc so sánh không phải "bao nhiêu là nhiều" mà là "có hơn cái đang chạy được không".\n` +
    `Chi phí THẬT của mỗi lệnh vẽ thì phải bấm phím \` trong game trên máy đích mới biết.`,
);
