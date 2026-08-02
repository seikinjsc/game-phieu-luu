// systems/maze-run.js — trạng thái một lượt đi mê cung. Logic thuần, không vẽ, không DOM
// (để test được không cần trình duyệt, giống harness của game chạy vượt chướng ngại).
//
// CÁCH DI CHUYỂN: nhân vật luôn đi GIỮA hành lang, từ tâm ô này sang tâm ô kế.
// Đổi hướng chỉ xảy ra khi tới tâm một ô — trừ quay đầu thì cho phép ngay lập tức.
// Vì sao chọn kiểu này thay vì va chạm hộp tự do: hành lang rộng đúng 1 ô, va chạm tự do
// bắt trẻ 6 tuổi canh đúng tâm mới lách qua được, kẹt góc liên tục. Kiểu này không bao
// giờ kẹt góc, và bấm sớm vẫn ăn — giữ đúng luật "thất bại phải công bằng" của dự án.
//
// dt được kẹp ≤ 0.033 ở core/loop.js, nhưng hàm này vẫn xử lý dt lớn đúng (chia nhỏ theo
// từng đoạn tâm-ô) để tab bị treo rồi quay lại không làm nhân vật xuyên tường.

import { makeMaze, solve, bfs } from './maze.js';
import { MAZE_DIFF } from '../data/difficulty.js';
import { SO_O_THUONG } from '../data/rewards.js';
import { datQuai, diQuai, quaiCham, quaiTrongTam } from './mobs.js';
import { makeRng } from '../core/rng.js';

const OPP = (a, b) => a && b && a.x === -b.x && a.y === -b.y;

export function makeRun(seed, level = 1, opts = {}) {
  const d = MAZE_DIFF[level] || MAZE_DIFF[1];
  const maze = makeMaze(seed, {
    size: opts.size ?? d.size,
    gates: opts.gates ?? d.gates,
    bonus: opts.bonus ?? SO_O_THUONG[MAZE_DIFF.indexOf(d)] ?? 0,
  });
  const gioiHan = opts.time ?? d.time; // 0 = không giới hạn (mức Dễ)
  const satThuong = opts.satThuong ?? 1; // sức chém, tăng theo vũ khí đã mua
  const timToiDa = Math.max(1, (opts.tim ?? d.tim ?? 4) + (opts.themTim ?? 0));
  const { size } = maze;
  const speed = opts.speed ?? d.speed;
  const sight = opts.sight ?? d.sight;

  // HAI KHÁI NIỆM Ô, đừng lẫn — lẫn một lần rồi, la bàn quay loạn tại chỗ:
  //   cx,cy = ô GỐC NỘI SUY, điểm bắt đầu của đoạn đang đi. Lúc quay đầu giữa hành lang
  //           nó nhảy sang ô phía trước (ô mà nhân vật CHƯA hề tới) để phép nội suy đúng.
  //   lx,ly = ô có TÂM ĐÃ CHẠM gần nhất. Đây mới là "đang ở ô nào" theo nghĩa luật chơi:
  //           nhặt xu, mở cửa, tính la bàn. Chỉ đổi khi thật sự tới tâm một ô.
  let cx = maze.start.x,
    cy = maze.start.y;
  let lx = cx,
    ly = cy;
  let x = cx + 0.5,
    y = cy + 0.5; // vị trí thực, tính theo ô
  let dir = null; // hướng đang đi, null = đang đứng ở tâm ô
  // HƯỚNG NHÌN — khác `dir` ở chỗ nó KHÔNG bị xoá khi đứng lại. Đây là hướng người chơi
  // yêu cầu gần nhất (phím bấm cuối, hoặc hướng của ô vừa bấm chuột). Dùng để vẽ mắt và
  // mũi tên. Nếu vẽ theo `dir` thì mỗi lần dừng ở tâm ô nhân vật lại quay mặt về bên phải.
  let facing = { x: 1, y: 0 };

  const seen = new Uint8Array(size * size); // ô đã từng nhìn thấy → vẽ mờ trên minimap
  const opened = new Set(); // id cửa khoá đã mở
  const coins = new Set(); // chỉ số ô đã nhặt xu
  const items = new Set(maze.coins.map((p) => p.y * size + p.x));
  let time = 0,
    won = false;
  let target = null; // mục tiêu la bàn đang bám (cửa khoá, hoặc cửa ra khi đã đủ chìa)
  let pending = null; // cửa khoá đang chờ trả lời câu hỏi
  let stars = 0; // số cửa trả lời ĐÚNG NGAY LẦN ĐẦU

  // ── Quái và tim ────────────────────────────────────────────────────────────
  const rngQuai = makeRng(seed * 31337 + 7);
  const quai = datQuai(
    maze,
    rngQuai,
    opts.quai ?? d.quai ?? 0,
    bfs(maze, maze.start.x, maze.start.y),
    {
      toc: opts.tocQuai ?? d.tocQuai ?? 2.2,
    },
  );
  let tim = timToiDa;
  let batTu = 0; // giây còn bất tử sau khi trúng đòn — không có thì mất sạch tim trong 1 giây
  let hoiSinh = 0; // đếm số lần hết tim, chỉ để hiện thông báo
  let chamDon = 0; // hồi chiêu chém

  // Điểm hồi sinh: cửa khoá ĐÃ MỞ gần nhất, không có thì về điểm xuất phát.
  // Không bao giờ mất chìa, mất xu hay mất thời gian đã đi — luật §2.
  function veChoAnToan() {
    const daMo = maze.gates.filter((g) => opened.has(g.id));
    let noi = maze.start;
    if (daMo.length) {
      const dp = bfs(maze, lx, ly);
      let gan = Infinity;
      for (const g of daMo) {
        const k = dp[g.y * size + g.x];
        if (k >= 0 && k < gan) {
          gan = k;
          noi = g;
        }
      }
    }
    cx = lx = noi.x;
    cy = ly = noi.y;
    x = cx + 0.5;
    y = cy + 0.5;
    dir = null;
    tim = timToiDa;
    batTu = 2.5;
    hoiSinh++;
    look();
  }

  const demChia = () => maze.gates.reduce((n, g) => n + (opened.has(g.id) ? 1 : 0), 0);

  function look() {
    for (let j = Math.max(0, cy - sight); j <= Math.min(size - 1, cy + sight); j++)
      for (let i = Math.max(0, cx - sight); i <= Math.min(size - 1, cx + sight); i++)
        seen[j * size + i] = 1;
  }
  look();

  // Nhặt/kích hoạt mọi thứ nằm ở ô vừa bước vào.
  function arrive() {
    lx = cx;
    ly = cy;
    const i = cy * size + cx;
    if (items.has(i) && !coins.has(i)) coins.add(i);
    // Cửa khoá và ô "?" KHÔNG tự mở: treo lại chờ trả lời câu hỏi. Người gọi lấy `pending`
    // (có `.loai` là 'cua' hay 'thuong'), hỏi xong thì gọi `resolve()`. Mê cung đứng im.
    for (const g of [...maze.gates, ...maze.bonus])
      if (g.x === cx && g.y === cy && !opened.has(g.id)) pending = g;
    // Cửa ra chỉ mở khi đã đủ chìa. Đếm riêng CỬA KHOÁ — `opened` chứa cả ô "?" thưởng,
    // lấy `opened.size` sẽ mở cửa ra sớm chỉ vì bé ghé mấy ô thưởng.
    if (cx === maze.exit.x && cy === maze.exit.y && demChia() >= maze.gates.length) won = true;
    look();
  }

  // Chọn (và ghi nhớ) mục tiêu cho la bàn.
  // BÁM MỘT MỤC TIÊU cho tới khi mở được nó: nếu mỗi bước lại chọn lại "cửa gần nhất",
  // hai cửa gần bằng nhau sẽ thay nhau thắng và la bàn quay qua quay lại tại chỗ —
  // người chơi đi theo sẽ dậm chân mãi không tới đâu.
  function chonMucTieu() {
    if (target && (target.id === undefined ? won : opened.has(target.id))) target = null;
    if (!target) {
      const con = maze.gates.filter((g) => !opened.has(g.id));
      const dest = con.length ? con : [{ ...maze.exit }];
      let bestLen = Infinity;
      for (const t of dest) {
        const p = solve(maze, lx, ly, t.x, t.y);
        if (p.length && p.length < bestLen) {
          bestLen = p.length;
          target = t;
        }
      }
    }
    return target;
  }

  // Quái đi, rồi kiểm va chạm. Trúng đòn thì mất 1 tim và bất tử 1,5 giây — không có
  // khoảng bất tử thì đứng cạnh quái là mất sạch tim trong chưa tới một giây.
  let vuaMatTim = 0; // >0 nghĩa là khung này vừa trúng đòn (để lớp trên phát tiếng)
  function capNhatQuai(dt) {
    vuaMatTim = 0;
    if (batTu > 0) batTu -= dt;
    if (chamDon > 0) chamDon -= dt;
    for (const q of quai) diQuai(maze, q, dt, rngQuai);
    if (batTu > 0) return;
    const q = quaiCham(quai, x, y);
    if (!q) return;
    tim--;
    vuaMatTim = 1;
    batTu = 1.5;
    if (tim <= 0) veChoAnToan();
  }

  // Nạp lại một ván đang chơi dở. Bọc try/catch: dữ liệu lưu có thể cũ hoặc hỏng, và khi đó
  // THÀ CHƠI LẠI TỪ ĐẦU còn hơn vỡ game — người chơi mất vài phút, không mất cả buổi.
  if (opts.nap) {
    try {
      const s = opts.nap;
      const so = (v, mac) => (Number.isFinite(v) ? v : mac);
      // KIỂM Ô CÓ HỢP LỆ KHÔNG, không chỉ kiểm "là số". Bản lưu của phiên bản cũ (mê cung
      // khác cỡ) hoặc bị sửa tay sẽ cho toạ độ nằm ngoài lưới hoặc nằm trong tường —
      // nạp thẳng vào là nhân vật kẹt cứng trong đá, không đi đâu được.
      const oTot = (a, b) => !maze.isWall(a, b);
      if (oTot(so(s.cx, -1), so(s.cy, -1))) {
        cx = s.cx;
        cy = s.cy;
      }
      lx = oTot(so(s.lx, -1), so(s.ly, -1)) ? s.lx : cx;
      ly = oTot(so(s.lx, -1), so(s.ly, -1)) ? s.ly : cy;
      x = so(s.x, cx + 0.5);
      y = so(s.y, cy + 0.5);
      // Vị trí lẻ phải nằm trong đúng ô vừa nhận, nếu không thì đặt về tâm ô.
      if (maze.isWall(Math.floor(x), Math.floor(y))) {
        x = cx + 0.5;
        y = cy + 0.5;
      }
      if (s.f && (s.f.x || s.f.y)) facing = { x: Math.sign(s.f.x), y: Math.sign(s.f.y) };
      time = Math.max(0, so(s.t, 0));
      tim = Math.min(timToiDa, Math.max(1, so(s.tim, timToiDa)));
      stars = Math.max(0, so(s.sao, 0));
      hoiSinh = Math.max(0, so(s.hs, 0));
      for (const id of s.mo || []) opened.add(id);
      for (const i of s.xu || []) if (items.has(i)) coins.add(i);
      (s.q || []).forEach(([qcx, qcy, mau, song], i) => {
        const t = quai[i];
        if (!t || maze.isWall(qcx, qcy)) return;
        t.cx = qcx;
        t.cy = qcy;
        t.x = qcx + 0.5;
        t.y = qcy + 0.5;
        t.mau = Math.max(1, Math.min(t.mauToiDa, so(mau, t.mauToiDa)));
        t.song = !!song;
      });
      if (Array.isArray(s.thay) && s.thay.length === seen.length) seen.set(s.thay);
      look();
    } catch {
      /* dữ liệu lưu hỏng — bỏ qua, chơi lại ván này từ đầu */
    }
  }

  // want: {x,y} một trong bốn hướng, hoặc null khi không bấm phím nào.
  function step(dt, want) {
    if (won || pending) return; // đang trả lời câu hỏi thì mê cung đứng im, đồng hồ cũng dừng
    // Quay mặt theo hướng vừa yêu cầu, KỂ CẢ khi hướng đó là tường — bấm vào tường thì
    // nhân vật vẫn ngoảnh sang nhìn, đó là phản hồi cho người chơi biết lệnh đã nhận.
    if (want && (want.x || want.y)) facing = { x: want.x, y: want.y };
    time += dt;
    capNhatQuai(dt);
    let budget = speed * dt;
    let guard = 0; // chặn vòng lặp vô hạn nếu logic hỏng — thà đứng yên còn hơn treo game
    while (budget > 0 && guard++ < 64) {
      if (dir && want && OPP(want, dir)) {
        // Quay đầu giữa hành lang: ô đang tiến tới trở thành ô xuất phát của chiều ngược lại.
        cx += dir.x;
        cy += dir.y;
        dir = want;
      }
      if (!dir) {
        if (!want) break; // đứng yên ở tâm ô
        if (maze.isWall(cx + want.x, cy + want.y)) break; // hướng đó là tường
        dir = want;
      }
      const tx = cx + dir.x + 0.5,
        ty = cy + dir.y + 0.5;
      const rem = Math.abs(tx - x) + Math.abs(ty - y);
      if (budget < rem) {
        x += dir.x * budget;
        y += dir.y * budget;
        budget = 0;
      } else {
        x = tx;
        y = ty;
        cx += dir.x;
        cy += dir.y;
        budget -= rem;
        dir = null;
        arrive();
        // DỪNG NGAY khi vừa tới tâm một ô, bỏ phần ngân sách thừa của khung này.
        // Nếu tiêu tiếp, nhân vật sẽ lao thẳng sang ô kế bằng lệnh CŨ (lệnh tính từ ô
        // trước đó, đã lỗi thời) và cam kết đi hết ô đó — lệnh rẽ của khung sau không
        // bao giờ tới được tâm ô để có hiệu lực, người chơi rẽ mãi không được.
        // Tâm ô là nơi DUY NHẤT được quyết định hướng, nên phải trả quyền đó về cho
        // người gọi ở mỗi lần tới tâm. Mất ≤1 khung ngân sách (~0,2% tốc độ), không thấy được.
        return;
      }
    }
  }

  return {
    maze,
    seen,
    step,
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    get cell() {
      return { x: lx, y: ly };
    },
    get dir() {
      return dir;
    },
    get facing() {
      return facing;
    },
    get quai() {
      return quai;
    },
    get tim() {
      return tim;
    },
    get timToiDa() {
      return timToiDa;
    },
    get batTu() {
      return batTu > 0;
    },
    get vuaMatTim() {
      return vuaMatTim > 0;
    },
    get hoiSinh() {
      return hoiSinh;
    },
    // Chém con quái gần nhất trong tầm. Trả {trung, haGuc} để lớp trên phát tiếng và thưởng xu.
    // Có hồi chiêu để bấm liên tục không thành "giữ nút là thắng".
    chem() {
      if (chamDon > 0 || pending || won) return { trung: false, haGuc: false };
      chamDon = 0.35;
      const q = quaiTrongTam(quai, x, y);
      if (!q) return { trung: false, haGuc: false };
      q.mau -= satThuong;
      if (q.mau <= 0) {
        q.song = false;
        return { trung: true, haGuc: true };
      }
      return { trung: true, haGuc: false };
    },
    // Quay mặt ngay lập tức, không đợi khung sau. Dùng khi bấm chuột vào một ô: nhân vật
    // ngoảnh về phía đó tức thì, người chơi thấy lệnh được nhận ngay.
    nhinVe(d) {
      if (d && (d.x || d.y)) facing = { x: Math.sign(d.x), y: Math.sign(d.y) };
    },
    get time() {
      return time;
    },
    get won() {
      return won;
    },
    get keys() {
      return demChia();
    },
    // Đồng hồ: mức Dễ không giới hạn (gioiHan = 0) → luôn còn Infinity giây.
    get limit() {
      return gioiHan;
    },
    get left() {
      return gioiHan ? Math.max(0, gioiHan - time) : Infinity;
    },
    // HẾT GIỜ KHÔNG PHẢI LÀ THUA. Bé vẫn đi tiếp, vẫn qua được mê cung — chỉ mất phần
    // thưởng tốc độ. Luật §2: không bao giờ mất tiến trình.
    get timeUp() {
      return gioiHan > 0 && time >= gioiHan;
    },
    get needKeys() {
      return maze.gates.length;
    },
    get coins() {
      return coins.size;
    },
    get pending() {
      return pending;
    },
    get stars() {
      return stars;
    },
    // Đóng cửa khoá đang treo. LUẬT CỨNG (ME-CUNG-DESIGN.md §2): cửa LUÔN mở, kể cả khi
    // trả lời sai — sai chỉ mất sao và mất thời gian, KHÔNG BAO GIỜ chặn đường đi.
    // Trẻ 6 tuổi kẹt 2 phút là bỏ game, mà bỏ game thì không học được gì cả.
    resolve(dung, phatGiay = 0) {
      if (!pending) return null;
      const g = pending;
      opened.add(g.id);
      if (dung && g.loai === 'cua') stars++; // sao chỉ tính cho CỬA KHOÁ, không tính ô thưởng
      time += phatGiay;
      pending = null;
      target = null; // la bàn chọn lại mục tiêu, cửa này xong rồi
      return g;
    },
    // ── LƯU / NẠP LẠI VÁN ĐANG CHƠI DỞ ────────────────────────────────────────
    // Trả object thuần để nhét thẳng vào localStorage. Chỉ lưu thứ KHÔNG suy ra được từ
    // hạt giống: mê cung, vị trí cửa, vị trí xu đều dựng lại y hệt từ `seed`, không cần lưu.
    trangThai: () => ({
      x,
      y,
      cx,
      cy,
      lx,
      ly,
      f: facing,
      t: time,
      tim,
      sao: stars,
      hs: hoiSinh,
      mo: [...opened],
      xu: [...coins],
      // Quái: lưu ô đang đứng + máu + còn sống. Vị trí lẻ trong ô thì bỏ, nạp lại đặt về
      // tâm ô — lệch chưa tới nửa ô, không ai nhận ra, mà tiết kiệm được nửa dung lượng.
      q: quai.map((t) => [t.cx, t.cy, t.mau, t.song ? 1 : 0]),
      thay: Array.from(seen),
    }),
    isOpen: (id) => opened.has(id),
    hasCoin: (i) => items.has(i) && !coins.has(i),
    // Ô kế tiếp trên đường tới cửa gần nhất chưa mở (hoặc cửa ra nếu đã đủ chìa).
    // BÁM MỘT MỤC TIÊU cho tới khi mở được nó: nếu mỗi bước lại chọn lại "cửa gần nhất",
    // hai cửa gần bằng nhau sẽ thay nhau thắng và la bàn quay qua quay lại tại chỗ —
    // người chơi đi theo sẽ dậm chân mãi không tới đâu.
    hint() {
      const t = chonMucTieu();
      if (!t) return null;
      const p = solve(maze, lx, ly, t.x, t.y);
      return p.length > 1 ? p[1] : null;
    },
    // Ô ĐÍCH mà la bàn đang chỉ tới (cửa khoá gần nhất chưa mở, hoặc cửa ra khi đủ chìa).
    goal: () => chonMucTieu(),
  };
}
