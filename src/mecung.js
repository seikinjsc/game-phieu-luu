// mecung.js — điểm vào chế độ MÊ CUNG TRI THỨC.
//
// M1: đi mê cung, gom chìa, tìm cửa ra. M2: cửa khoá hỏi câu hỏi Toán lớp 1–5.
// M2b: điều khiển bằng CHUỘT — nút bấm kiểu game Phiêu Lưu, và bấm ô để tự đi tới đó.
//
// Ba luật cứng của vòng chơi (ME-CUNG-DESIGN.md §2), đừng sửa nếu chưa đọc lại phần đó:
//   1. Sai KHÔNG BAO GIỜ dẫn tới bế tắc — sai 3 lần thì hiện lời giải và VẪN mở cửa.
//   2. Mê cung tự nó đã vui; câu hỏi là gia vị, không phải thuế.
//   3. Không bao giờ mất tiến trình.
//
// BÀN PHÍM VẪN GIỮ NGUYÊN. Chuột là thêm vào, không thay thế: nút vẽ trên canvas không có
// tiêu điểm bàn phím, nên phím tắt là lối đi cho người không dùng được chuột.

import { createLoop } from './core/loop.js';
import { KEYMAP, inMap } from './core/input.js';
import { makeRng } from './core/rng.js';
import { makeRun } from './systems/maze-run.js';
import { makeQuiz } from './systems/quiz.js';
import { solve } from './systems/maze.js';
import { MAZE_DIFF } from './data/difficulty.js';
import { BO_DE, timBoDe, capHopLe } from './data/banks.js';
import {
  drawMaze,
  drawHud,
  drawMenu,
  drawWin,
  drawQuestion,
  drawPause,
  drawButtons,
  MAZE_SKINS,
} from './render/maze.js';
import {
  nutManChon,
  nutCauHoi,
  nutManThang,
  nutTamDung,
  nutTrongMeCung,
  batNut,
  toaDoChuot,
  MUC_AM,
} from './ui/mecung-ui.js';
import { VIEW } from './render/maze.js';
import { makeProgress } from './systems/progress.js';
import { THUONG, PHAT_GIAY_SAI } from './data/rewards.js';
import { CUA_HANG, chiSo } from './data/shop.js';
import { nutCuaHang } from './ui/mecung-ui.js';
import { drawShop } from './render/maze.js';
import { quaiTrongTam } from './systems/mobs.js';
import {
  audioCfg,
  sCoin,
  sPU,
  sLife,
  sHit,
  sWin,
  sBoom,
  sSwing,
  sKill,
  tone,
  musicStep,
} from './core/audio.js';

import { W, H } from './ui/mecung-ui.js';
const RS = 1.5; // hệ số nét khi phóng to, đúng quy ước dự án
const TOI_DA_SAI = 3; // sai đủ số lần này thì hiện lời giải và cho qua

const cv = document.createElement('canvas');
cv.width = W * RS;
cv.height = H * RS;
// Lấp đầy cửa sổ, giữ đúng tỉ lệ. Không chốt max-width nữa: màn hình to thì mê cung to theo.
cv.style.cssText = `display:block;cursor:pointer;width:min(100vw, calc(100vh * ${W} / ${H}));height:auto`;
document.getElementById('app').appendChild(cv);
const ctx = cv.getContext('2d');
ctx.scale(RS, RS);

const SKINS = Object.keys(MAZE_SKINS);
let man = 'chon'; // chon | choi | hoi | tam | thang | shop
let muc = 1,
  skin = 0,
  boDeId = 'toan', // bộ đề đang chọn: Toán · Trạng Nguyên · Olympia
  cap = '1', // cấp độ trong bộ đề đó (lớp 1 / nhóm câu đố / …). Mặc định thấp nhất.
  run = null,
  hat = 1;

// Hộp Leitner sống XUYÊN SUỐT nhiều mê cung — đó mới là chỗ việc học xảy ra.
// Tạo lại mỗi ván là mất hết tiến trình ôn tập, hỏng toàn bộ ý nghĩa của nó.
const quiz = makeQuiz(20260802);
let rng = makeRng(1);
// (nạp lại tiến trình ôn tập đã lưu ngay sau khi dựng `vi` — xem bên dưới)
let cau = null, // câu đang hỏi
  sai = [], // các đáp án đã chọn sai
  loiGiai = false; // đã sai đủ 3 lần → hiện lời giải
let dangBam = null; // nút đang bị nhấn giữ, để vẽ hiệu ứng lún
let duongTuDi = null; // đường đang tự đi sau khi bấm chuột vào một ô

const vi = makeProgress(); // ví xu + điểm + mức âm lượng, sống qua nhiều ván

// Đổ mức âm lượng đã lưu vào lớp âm thanh. Gọi lại mỗi khi người chơi chỉnh.
function apDungAm() {
  audioCfg.musicVol = MUC_AM[vi.amNhac];
  audioCfg.sfxVol = MUC_AM[vi.amTieng];
  audioCfg.music = vi.amNhac > 0 ? 1 : 0;
  audioCfg.sfx = vi.amTieng > 0 ? 1 : 0;
}
apDungAm();
// Trả lại tiến trình ôn tập của những buổi trước. Không có bước này thì mỗi lần mở game
// bé lại ôn từ đầu, và hộp Leitner mất sạch ý nghĩa.
if (vi.quiz) quiz.load(vi.quiz);

let xuTruoc = 0, // số xu ván trước, để phát tiếng khi nhặt được thêm
  daBaoHetGio = false;

// Nhạc nền: một vòng setTimeout tự nuôi. Chỉ kêu khi đang ở trong mê cung — nghe nhạc
// lúc đang đọc đề bài rất khó tập trung.
let mStep = 0;
function vongNhac() {
  const cho = man === 'choi' ? musicStep(mStep++, { n: muc + 1, boss: 0 }, skin) : 400;
  setTimeout(vongNhac, cho);
}
vongNhac();

const dang = []; // ngăn xếp phím hướng đang giữ; phím bấm SAU CÙNG thắng
const HUONG = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  jump: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

const trangThaiMenu = () => ({
  muc,
  mucList: MAZE_DIFF,
  tenSkin: MAZE_SKINS[SKINS[skin]].n,
  coVanCu: !!vi.van,
  boDe: boDeId,
  boDeList: BO_DE,
  capList: timBoDe(boDeId).capDo,
  cap,
  moBoDe: timBoDe(boDeId).mo,
  mucNhac: vi.amNhac,
  mucTieng: vi.amTieng,
});
let thuongCuoi = null; // bảng kê thưởng của ván vừa xong, để hiện ở màn thắng
const dongThang = () => [
  `Mức ${MAZE_DIFF[muc].n} · ${timBoDe(boDeId).ten} · mã mê cung ${hat}`,
  `⭐ ${run.stars}/${run.needKeys} cửa đúng ngay lần đầu`,
  thuongCuoi ? `+${thuongCuoi.xu} xu · +${thuongCuoi.diem} điểm` : '',
  `💰 Tổng ${vi.xu} xu · ${vi.diem} điểm  (kỷ lục ${vi.caoNhat})`,
];

// Nút đang hiện trên màn hình — dùng chung cho cả vẽ lẫn bắt chuột.
function nutHienTai() {
  if (man === 'chon') return nutManChon(trangThaiMenu());
  if (man === 'shop') return nutCuaHang(monShop(), vi.xu);
  if (man === 'tam') return nutTamDung();
  if (man === 'hoi') return nutCauHoi({ dapAn: cau.a, k: cau.k, sai, loiGiai });
  if (man === 'thang') return nutManThang();
  return nutTrongMeCung({ mucNhac: vi.amNhac, mucTieng: vi.amTieng });
}

// Chém con quái trước mặt. Hạ được thì thưởng xu — đó là lý do đáng đánh nhau thay vì né.
function chem() {
  if (man !== 'choi') return;
  const kq = run.chem();
  if (kq.haGuc) {
    sKill();
    vi.cong({ xu: 8, diem: 60 });
  } else if (kq.trung) sHit();
  else sSwing();
}

// Danh sách món kèm trạng thái đã mua — dùng chung cho cả vẽ lẫn bắt chuột.
const monShop = () => CUA_HANG.map((m) => ({ ...m, daCo: vi.coMon(m.id) }));

// ── LƯU / CHƠI TIẾP ─────────────────────────────────────────────────────────
// Lưu ĐỦ để dựng lại y hệt: hạt giống + mức + bộ đề + cấp + phiên bản, cộng trạng thái ván.
// Mê cung, vị trí cửa, vị trí xu đều sinh lại từ hạt giống nên không cần lưu.
function luuVanDangCho() {
  if (!run || run.won) return;
  vi.luuVan({ hat, muc, boDeId, cap, skin, run: run.trangThai() });
  vi.luuQuiz(quiz.state());
}

// Tạm dừng. LƯU LUÔN lúc dừng chứ không đợi bấm nút "Lưu": trẻ con hay tắt máy giữa
// chừng, và luật §2 là không bao giờ mất tiến trình.
function tamDung(luu = true) {
  if (man !== 'choi') return;
  man = 'tam';
  dang.length = 0; // buông hết phím, tránh vừa vào lại là chạy vọt đi
  duongTuDi = null;
  if (luu) luuVanDangCho();
}

function choiTiep() {
  const v = vi.van;
  if (!v) return;
  boDeId = v.boDeId || boDeId;
  cap = capHopLe(timBoDe(boDeId), v.cap);
  skin = Number.isInteger(v.skin) ? v.skin % SKINS.length : skin;
  batDau(v.hat, v.muc, v.run);
}

function batDau(seed, m = muc, napLai = null) {
  hat = seed;
  muc = m;
  const cs = chiSo(vi.daMua); // vũ khí/giáp/giày/đèn đã mua ăn vào ván này
  run = makeRun(seed, muc, {
    nap: napLai,
    satThuong: cs.satThuong,
    themTim: cs.themTim,
    speed: MAZE_DIFF[muc].speed * cs.tocDo,
    sight: MAZE_DIFF[muc].sight + (MAZE_DIFF[muc].sight >= 99 ? 0 : cs.themNhin),
  });
  rng = makeRng(seed * 7919); // câu hỏi cũng gieo hạt → cùng mã mê cung, cùng bộ câu
  man = 'choi';
  dang.length = 0;
  duongTuDi = null;
  xuTruoc = 0;
  daBaoHetGio = false;
  thuongCuoi = null;
}

// Đổi cấp độ trong bộ đề đang chọn. `xoayVong` dùng cho phím L (bấm mãi thì quay lại đầu),
// còn nút ◀ ▶ thì dừng ở hai đầu và tự tắt.
function doiCap(buoc, xoayVong = false) {
  const ds = timBoDe(boDeId).capDo;
  const i = Math.max(
    0,
    ds.findIndex((c) => c.id === cap),
  );
  const j = xoayVong
    ? (i + buoc + ds.length) % ds.length
    : Math.max(0, Math.min(ds.length - 1, i + buoc));
  return ds[j].id;
}

// Nhãn ngắn hiện trên HUD lúc chơi, để luôn biết câu hỏi đang lấy từ đâu.
function nhanCap() {
  const b = timBoDe(boDeId);
  return `${b.ten} · ${(b.capDo.find((c) => c.id === cap) || b.capDo[0]).ten}`;
}

function moCauHoi() {
  // Ô "?" hỏi câu KHÓ HƠN MỘT BẬC trong cùng bộ đề (đã ở bậc cuối thì giữ nguyên). Nó không
  // bắt buộc và sai cũng không bị phạt gì, nên khó hơn một chút là thử thách chứ không phải bẫy.
  const laThuong = run.pending.loai === 'thuong';
  const b = timBoDe(boDeId);
  cau = b.sinh(quiz.pick(b.ids(laThuong ? doiCap(1) : cap)), rng);
  cau.thuong = laThuong;
  sai = [];
  loiGiai = false;
  duongTuDi = null; // dừng tự đi, người chơi phải trả lời đã
  man = 'hoi';
}

// Cộng thưởng vào ví và phát tiếng tương ứng.
function nhanThuong(t, vui) {
  if (!t || (!t.xu && !t.diem)) return;
  vi.cong(t);
  (vui || sCoin)();
}

function traLoi(i) {
  if (loiGiai || sai.includes(i)) return;
  const laThuong = cau.thuong;
  if (i === cau.k) {
    quiz.answer(cau.id, sai.length === 0); // chỉ tính ĐÚNG khi trúng ngay lần đầu
    // Ô "?" sai cũng không bị phạt giây — nó là phần thưởng, không phải cửa ải.
    run.resolve(true, laThuong ? 0 : sai.length * PHAT_GIAY_SAI);
    if (laThuong) nhanThuong(THUONG.thuongDung, sLife);
    else nhanThuong(sai.length === 0 ? THUONG.cuaDungNgay : THUONG.cuaDungSauSai, sPU);
    man = 'choi';
    return;
  }
  sai.push(i);
  sHit();
  if (sai.length >= TOI_DA_SAI) {
    quiz.answer(cau.id, false);
    loiGiai = true; // vẫn cho qua, nhưng phải đọc lời giải đã
  }
}

function dongCauHoi() {
  run.resolve(false, cau.thuong ? 0 : TOI_DA_SAI * PHAT_GIAY_SAI);
  man = 'choi';
}

// Tổng kết khi ra khỏi mê cung: thưởng cơ bản + mỗi sao + mỗi giây còn dư.
function tinhThuongCuoi() {
  const conLai = run.left === Infinity ? 0 : Math.floor(run.left);
  const xu = THUONG.quaMeCung.xu + run.stars * THUONG.moiSao.xu + conLai * THUONG.moiGiayConLai.xu;
  const diem =
    THUONG.quaMeCung.diem + run.stars * THUONG.moiSao.diem + conLai * THUONG.moiGiayConLai.diem;
  thuongCuoi = { xu, diem, conLai };
  vi.cong(thuongCuoi);
  vi.luuVan(null); // qua được rồi thì bản lưu ván này hết nghĩa
  vi.luuQuiz(quiz.state());
  sWin();
}

// Toàn màn hình. Bọc try/catch: trình duyệt chặn nếu không phải do người dùng bấm, và
// một lỗi ở đây không được phép làm chết vòng lặp game.
function toanManHinh() {
  try {
    const d = document;
    if (d.fullscreenElement) d.exitFullscreen?.();
    else d.documentElement?.requestFullscreen?.();
  } catch {
    /* trình duyệt từ chối — bỏ qua, chơi cửa sổ thường vẫn được */
  }
}

// ── Chuột ───────────────────────────────────────────────────────────────────
function bamNut(id) {
  if (id == null) return false;
  if (id.startsWith('muc')) muc = +id.slice(3);
  else if (id === 'capLui') cap = doiCap(-1);
  else if (id === 'capTien') cap = doiCap(1);
  else if (id.startsWith('bode_')) {
    boDeId = id.slice(5);
    cap = capHopLe(timBoDe(boDeId), cap); // cấp của bộ cũ vô nghĩa ở bộ mới
  } else if (id === 'phienBan') skin = (skin + 1) % SKINS.length;
  // Ván mới thì bỏ hẳn bản lưu cũ — giữ lại sẽ thành bản lưu ma, bấm CHƠI TIẾP ra ván lạ.
  else if (id === 'batDau') {
    vi.luuVan(null);
    batDau(hat + 1);
  } else if (id === 'choiTiep') choiTiep();
  else if (id.startsWith('dapAn')) traLoi(+id.slice(5));
  else if (id === 'tiepTuc') {
    if (man === 'tam')
      man = 'choi'; // cùng id với nút ở màn câu hỏi → phân biệt theo màn
    else dongCauHoi();
  } else if (id === 'luuThoat') {
    luuVanDangCho();
    man = 'chon';
  } else if (id === 'boVan') {
    vi.luuVan(null);
    man = 'chon';
  } else if (id === 'tiep') batDau(hat + 1);
  else if (id === 'lai') batDau(hat);
  // Nút ☰ trong mê cung: LƯU rồi mới ra, đúng tinh thần "không bao giờ mất tiến trình".
  else if (id === 've') {
    if (man === 'choi' || man === 'tam') luuVanDangCho();
    man = 'chon';
  }
  // Bấm là xoay vòng qua 4 mức Tắt → Nhỏ → Vừa → To
  else if (id === 'nhac') {
    vi.datAm((vi.amNhac + 1) % MUC_AM.length, vi.amTieng);
    apDungAm();
  } else if (id === 'tieng') {
    vi.datAm(vi.amNhac, (vi.amTieng + 1) % MUC_AM.length);
    apDungAm();
  } else if (id === 'moShop') man = 'shop';
  else if (id === 'toanManHinh') toanManHinh();
  else if (id.startsWith('mua_')) {
    const m = CUA_HANG.find((t) => t.id === id.slice(4));
    if (m && vi.mua(m.id, m.gia)) sLife();
  } else return false;
  tone(680, 0.05, 'triangle', 0.04); // tiếng "tách" xác nhận đã bấm trúng nút
  return true;
}

// Bấm vào một ô trong mê cung → tự đi tới đó. Chỉ nhận ô ĐÃ NHÌN THẤY và không phải tường,
// nếu không thì thành ra chỉ đường qua vùng bé chưa khám phá — mất hết ý nghĩa mê cung.
function bamO(p) {
  const u = VIEW.s / run.maze.size;
  const gx = Math.floor((p.x - VIEW.x) / u),
    gy = Math.floor((p.y - VIEW.y) / u);
  if (gx < 0 || gy < 0 || gx >= run.maze.size || gy >= run.maze.size) return;
  if (run.maze.isWall(gx, gy) || !run.seen[gy * run.maze.size + gx]) return;
  const c = run.cell;
  const d = solve(run.maze, c.x, c.y, gx, gy);
  duongTuDi = d.length > 1 ? d.slice(1) : null;
  // Quay mặt ngay về phía vừa bấm, đừng đợi khung sau — người chơi phải thấy lệnh được nhận.
  // Bấm vào chính ô đang đứng thì ngoảnh về phía ô đó so với mình.
  if (duongTuDi) run.nhinVe({ x: duongTuDi[0].x - c.x, y: duongTuDi[0].y - c.y });
  else run.nhinVe({ x: gx - c.x, y: gy - c.y });
}

cv.addEventListener('mousedown', (e) => {
  const p = toaDoChuot(cv.getBoundingClientRect(), e.clientX, e.clientY, W, H);
  if (!p) return;
  dangBam = batNut(nutHienTai(), p.x, p.y);
});

cv.addEventListener('mouseup', (e) => {
  const p = toaDoChuot(cv.getBoundingClientRect(), e.clientX, e.clientY, W, H);
  const nhan = dangBam;
  dangBam = null;
  if (!p) return;
  const id = batNut(nutHienTai(), p.x, p.y);
  // Chỉ tính là bấm khi nhả chuột ĐÚNG trên nút đã nhấn xuống — như nút thật.
  if (id && id === nhan) return void bamNut(id);
  if (man !== 'choi' || id) return;
  // Bấm trúng con quái trong tầm thì CHÉM, không phải đi tới đó — bấm vào quái mà nhân
  // vật lững thững đi tới cho nó đụng là phản trực giác nhất có thể.
  const u = VIEW.s / run.maze.size;
  const gx = (p.x - VIEW.x) / u,
    gy = (p.y - VIEW.y) / u;
  if (quaiTrongTam(run.quai, gx, gy) && quaiTrongTam(run.quai, run.x, run.y)) return chem();
  bamO(p);
});
cv.addEventListener('mouseleave', () => {
  dangBam = null;
});
cv.addEventListener('contextmenu', (e) => e.preventDefault());

// ── Bàn phím (giữ nguyên, là lối đi thay thế cho chuột) ─────────────────────
window.addEventListener('keydown', (e) => {
  if (man === 'hoi') {
    if (loiGiai && inMap(KEYMAP.ok, e.code)) return dongCauHoi();
    const m = /^(?:Digit|Numpad)([1-4])$/.exec(e.code); // nhận cả hàng số trên và bàn phím số
    if (m) traLoi(+m[1] - 1);
    return; // đang trả lời thì mọi phím khác bị nuốt, không đi được
  }
  // Phím đánh (PHÍM CÁCH / J / K / F / SHIFT…) — kiểm TRƯỚC phím hướng vì 'jump' của
  // game gốc dùng chung PHÍM CÁCH, mà ở mê cung phím cách phải là chém chứ không phải đi lên.
  if (man === 'choi' && (e.code === 'Space' || inMap(KEYMAP.atk, e.code))) {
    e.preventDefault();
    return chem();
  }
  for (const act of ['left', 'right', 'jump', 'down'])
    if (inMap(KEYMAP[act], e.code)) {
      if (!dang.includes(act)) dang.push(act);
      duongTuDi = null; // chạm bàn phím là huỷ tự đi, người chơi giành lại quyền lái
      e.preventDefault();
      return;
    }
  if (inMap(KEYMAP.retry, e.code)) return batDau(hat + 1);
  if (man === 'chon') {
    if (e.code === 'Digit1') return batDau(hat, 0);
    if (e.code === 'Digit2') return batDau(hat, 1);
    if (e.code === 'Digit3') return batDau(hat, 2);
    if (inMap(KEYMAP.ok, e.code)) return batDau(hat);
    if (e.code === 'KeyB') skin = (skin + 1) % SKINS.length;
    if (e.code === 'KeyL') cap = doiCap(1, true);
    if (e.code === 'KeyS') man = 'shop';
  } else if (man === 'shop' && inMap(KEYMAP.pause, e.code)) man = 'chon';
  else if (man === 'thang' && inMap(KEYMAP.ok, e.code)) batDau(hat + 1);
  else if (man === 'choi' && inMap(KEYMAP.pause, e.code)) tamDung(true);
  else if (man === 'tam' && inMap(KEYMAP.pause, e.code)) man = 'choi';
});
window.addEventListener('keyup', (e) => {
  for (const act of ['left', 'right', 'jump', 'down'])
    if (inMap(KEYMAP[act], e.code)) {
      const i = dang.indexOf(act);
      if (i >= 0) dang.splice(i, 1);
    }
});

// Hướng đi của khung này: phím giữ được ưu tiên, không thì bám theo đường tự đi.
function huongDi() {
  if (dang.length) return HUONG[dang[dang.length - 1]];
  if (!duongTuDi || !duongTuDi.length) return null;
  const c = run.cell;
  const t = duongTuDi[0];
  if (c.x === t.x && c.y === t.y) {
    duongTuDi.shift();
    if (!duongTuDi.length) return (duongTuDi = null);
    return huongDi();
  }
  return { x: Math.sign(t.x - c.x), y: Math.sign(t.y - c.y) };
}

// ── Vòng lặp ────────────────────────────────────────────────────────────────
// Rời trang / đóng tab giữa chừng cũng phải giữ được ván. Không có cái này thì bé tắt máy
// là mất sạch, mà đó đúng là cách trẻ con thoát game.
window.addEventListener('beforeunload', luuVanDangCho);

createLoop((dt) => {
  if (man === 'chon') {
    ctx.fillStyle = MAZE_SKINS[SKINS[skin]].bg;
    ctx.fillRect(0, 0, W, H);
    drawMenu(ctx, trangThaiMenu(), nutManChon(trangThaiMenu()), dangBam);
    return;
  }

  if (man === 'shop') {
    ctx.fillStyle = MAZE_SKINS[SKINS[skin]].bg;
    ctx.fillRect(0, 0, W, H);
    drawShop(ctx, monShop(), nutCuaHang(monShop(), vi.xu), vi.xu, dangBam);
    return;
  }

  if (man === 'choi') {
    run.step(dt, huongDi());
    if (run.vuaMatTim) {
      sBoom();
      duongTuDi = null; // trúng đòn thì dừng tự đi, để bé giành lại quyền lái mà chạy
    }
    if (run.coins > xuTruoc) {
      // nhặt được xu rơi ở ngõ cụt
      nhanThuong(THUONG.nhatXu);
      xuTruoc = run.coins;
    }
    if (run.timeUp && !daBaoHetGio) {
      daBaoHetGio = true;
      sBoom(); // hết giờ: chỉ mất thưởng tốc độ, KHÔNG thua, vẫn đi tiếp được
    }
    if (run.pending) moCauHoi();
    else if (run.won) {
      tinhThuongCuoi();
      man = 'thang';
    }
  }

  const cfg = MAZE_DIFF[muc];
  drawMaze(ctx, run, SKINS[skin], cfg.sight);
  drawHud(ctx, run, cfg, nhanCap(), vi);
  if (man === 'choi')
    drawButtons(ctx, nutTrongMeCung({ mucNhac: vi.amNhac, mucTieng: vi.amTieng }), dangBam);

  if (man === 'tam')
    drawPause(
      ctx,
      [
        `${MAZE_DIFF[muc].n} · ${timBoDe(boDeId).ten} · mã mê cung ${hat}`,
        `🔑 ${run.keys}/${run.needKeys} chìa · 🪙 ${run.coins} xu · ⭐ ${run.stars} sao`,
        '💾 Ván này đã được lưu — tắt máy vẫn chơi tiếp được',
      ],
      nutTamDung(),
      dangBam,
    );
  else if (man === 'hoi') drawQuestion(ctx, cau, sai, loiGiai);
  else if (man === 'thang') drawWin(ctx, dongThang(), nutManThang(), dangBam);
}).start();
