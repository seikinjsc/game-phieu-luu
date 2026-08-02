// ui/mecung-ui.js — BỐ CỤC NÚT và bắt chuột. Thuần, không vẽ, không DOM → test được.
//
// Vì sao nút vẽ trên canvas chứ không dùng thẻ <button>: cả dự án đóng gói thành MỘT tệp
// .html, mọi thứ vẽ bằng lệnh Canvas (CLAUDE.md ràng buộc #2, #3). Đổi sang DOM sẽ phải
// đồng bộ hai hệ toạ độ và kéo thêm CSS vào bản dựng một tệp.
// ĐÁNH ĐỔI ĐÃ BIẾT: nút canvas không có tiêu điểm bàn phím và trình đọc màn hình không
// thấy. Vì vậy MỌI nút đều giữ phím tắt tương đương — bàn phím không bao giờ bị bỏ rơi.
//
// Phong cách lấy từ game Phiêu Lưu (legacy): nút viên thuốc, chữ đậm, bóng đổ khối
// `0 4px 0` màu tối hơn, bấm xuống thì lún 3px.

// KHUNG LOGIC của trang mê cung: 900×640 (không phải 900×500 của game chạy vượt chướng ngại).
// Chọn tỉ lệ cao hơn vì mê cung là hình VUÔNG: canvas càng dẹt thì ô mê cung càng bé.
// 640 cao cho mê cung cạnh 568 — to hơn bản 480 cũ khoảng 40% diện tích.
export const W = 900;
export const H = 640;
export const THANH_TREN = 52; // chiều cao thanh thông tin phủ trên đỉnh

export const NAVY = '#22306E';

// [mặt nút, bóng đổ]. Lấy đúng bảng màu của game Phiêu Lưu.
export const MAU = {
  hong: ['#E8447F', '#A62B57'],
  xanh: ['#3F7BD6', '#27528F'],
  luc: ['#2FA84F', '#1D6B33'],
  vang: ['#FFB300', '#A8761A'],
  xam: ['#4A5568', '#2D3648'],
  trang: ['#FFFFFF', '#C3CCDA'],
};

// Xếp một hàng nút chia đều trong bề ngang cho trước.
export function hangNut(items, { x, y, w, h, gap = 12 }) {
  const bw = (w - gap * (items.length - 1)) / items.length;
  return items.map((it, i) => ({ ...it, x: x + i * (bw + gap), y, w: bw, h }));
}

// Nút nào nằm dưới con trỏ? Trả id, hoặc null. Nút `tat: true` bị bỏ qua.
export function batNut(nut, mx, my) {
  for (const b of nut)
    if (!b.tat && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return b.id;
  return null;
}

// ── Danh sách nút của từng màn. Dùng CHUNG cho cả vẽ lẫn bắt chuột, nên không bao giờ
// lệch nhau — nút vẽ ở đâu là bấm được đúng chỗ đó.

// ── LƯỚI BỐ CỤC MÀN CHỌN ────────────────────────────────────────────────────
// Mỗi khối là [nhãn mục, hàng nút], cách nhau đều đặn. Toạ độ gom hết vào bảng này để
// nhìn một chỗ là thấy ngay khối nào đè khối nào — trước đây rải rác nên bị chồng lấp.
// MỘT CỘT NỘI DUNG DUY NHẤT: x = 100..800. Mọi hàng đều bám đúng hai mép này.
// Trước đây mỗi hàng một bề ngang (600 / 720 / 300) nên nhìn xô lệch dù không chồng nhau.
export const COT = { x: 100, w: 700 };

export const MENU_Y = {
  tieuDe: 54,
  nhan1: 96, // "① ĐỘ KHÓ MÊ CUNG"
  hangMuc: 108, // 3 nút mức khó, cao 52 → 108..160
  ghiChu: 182, // "15×15 ô · 3 cửa khoá…"
  nhan2: 216, // "② NGÂN HÀNG CÂU HỎI"
  hangBoDe: 228, // 3 nút bộ đề, cao 52 → 228..280
  hangCap: 292, // ◀ [cấp độ] ▶, cao 52 → 292..344
  moBoDe: 366, // mô tả ngắn của bộ đề đang chọn
  nhan3: 400, // "③ TUỲ CHỌN"
  hangPhu: 412, // phiên bản + toàn màn hình + 2 nút âm lượng, cao 48 → 412..460
  hangChinh: 496, // Cửa hàng + BẮT ĐẦU, cao 66 → 496..562
  nhacPhim: 600,
};

export function nutManChon(st) {
  const Y = MENU_Y;
  // Cấp độ là danh sách tuỳ bộ đề (lớp 1–5, nhóm câu đố, "tất cả"…) nên nút ◀ ▶ tắt/bật
  // theo VỊ TRÍ trong danh sách, không chốt cứng 1..5 như trước.
  const iCap = Math.max(
    0,
    st.capList.findIndex((c) => c.id === st.cap),
  );
  const C = COT;
  return [
    ...hangNut(
      st.mucList.map((d, i) => ({ id: 'muc' + i, nhan: d.n, mau: 'xanh', chon: st.muc === i })),
      { x: C.x, y: Y.hangMuc, w: C.w, h: 52 },
    ),
    ...hangNut(
      st.boDeList.map((b) => ({
        id: 'bode_' + b.id,
        nhan: b.ten,
        mau: 'xanh',
        chon: st.boDe === b.id,
      })),
      { x: C.x, y: Y.hangBoDe, w: C.w, h: 52 },
    ),
    // Bộ chọn cấp độ: ◀ [ô tên cấp] ▶ — canh giữa cột, tổng bề ngang 400.
    { id: 'capLui', nhan: '◀', mau: 'xam', x: 250, y: Y.hangCap, w: 56, h: 52, tat: iCap <= 0 },
    {
      id: 'capTien',
      nhan: '▶',
      mau: 'xam',
      x: 594,
      y: Y.hangCap,
      w: 56,
      h: 52,
      tat: iCap >= st.capList.length - 1,
    },
    { id: 'phienBan', nhan: st.tenSkin, mau: 'trang', x: C.x, y: Y.hangPhu, w: 290, h: 48 },
    { id: 'toanManHinh', nhan: '⛶', mau: 'xam', x: 402, y: Y.hangPhu, w: 48, h: 48 },
    // Hai nút âm lượng ghi rõ NHẠC / TIẾNG. Trước đây cả hai đều chỉ ghi "To" nên nhìn
    // không biết nút nào là nhạc nút nào là hiệu ứng.
    ...nutAmThanh(st, Y.hangPhu, 462, 48, 164), // 462..626 và 636..800
    { id: 'moShop', nhan: '🛒 Cửa hàng', mau: 'vang', x: C.x, y: Y.hangChinh, w: 210, h: 66 },
    // Có ván đang chơi dở thì CHƠI TIẾP là nút chính, ván mới lùi xuống nút phụ. Mở game lên
    // mà nút to nhất là "bắt đầu lại" thì rất dễ bấm nhầm, mất sạch ván đang dở.
    ...(st.coVanCu
      ? [
          {
            id: 'choiTiep',
            nhan: '▶  CHƠI TIẾP',
            mau: 'hong',
            x: 322,
            y: Y.hangChinh,
            w: 302,
            h: 66,
            lon: true,
          },
          { id: 'batDau', nhan: 'Ván mới', mau: 'xanh', x: 636, y: Y.hangChinh, w: 164, h: 66 },
        ]
      : [
          {
            id: 'batDau',
            nhan: '▶  BẮT ĐẦU',
            mau: 'hong',
            x: 322,
            y: Y.hangChinh,
            w: 478,
            h: 66,
            lon: true,
          },
        ]),
  ];
}

export function nutCauHoi(st) {
  // Bốn đáp án xếp 2×2, đúng chỗ đang vẽ ở render/maze.js
  const nut = [0, 1, 2, 3].map((i) => ({
    id: 'dapAn' + i,
    nhan: st.dapAn[i],
    so: i + 1,
    x: 90 + (i % 2) * 380,
    y: 208 + ((i / 2) | 0) * 96,
    w: 340,
    h: 76,
    sai: st.sai.includes(i),
    dung: st.loiGiai && i === st.k,
  }));
  if (st.loiGiai)
    nut.push({ id: 'tiepTuc', nhan: 'Đi tiếp  ▶', mau: 'luc', x: 330, y: 552, w: 240, h: 58 });
  return nut;
}

// Cửa hàng: mỗi món một nút. Đã mua thì nút chuyển xanh lục và tắt (không mua lại được),
// không đủ xu thì mờ đi — nhìn là biết ngay, không cần bấm thử rồi bị từ chối.
export function nutCuaHang(mon, viXu) {
  const nut = mon.map((m, i) => ({
    id: 'mua_' + m.id,
    nhan: m.daCo ? `${m.ten} ✓` : `${m.ten} — ${m.gia} xu`,
    mau: m.daCo ? 'luc' : viXu >= m.gia ? 'vang' : 'xam',
    tat: m.daCo || viXu < m.gia,
    x: 90 + (i % 2) * 380,
    y: 138 + ((i / 2) | 0) * 104,
    w: 340,
    h: 58,
  }));
  nut.push({ id: 've', nhan: '☰ Quay lại', mau: 'xam', x: 330, y: 552, w: 240, h: 58 });
  return nut;
}

// Màn TẠM DỪNG — cùng bộ lựa chọn với game Phiêu Lưu (tiếp tục · chơi lại · lưu & thoát ·
// thoát không lưu). Xếp dọc một cột để bé không bấm nhầm, và tách hẳn nút "thoát không lưu"
// xuống dưới cùng: đó là nút duy nhất làm mất tiến trình.
export function nutTamDung() {
  const x = 300,
    w = 300;
  return [
    { id: 'tiepTuc', nhan: '▶  Tiếp tục', mau: 'hong', x, y: 250, w, h: 62, lon: true },
    { id: 'lai', nhan: '🔄 Chơi lại mê cung này', mau: 'xanh', x, y: 326, w, h: 52 },
    { id: 'luuThoat', nhan: '💾 Lưu & ra màn chọn', mau: 'luc', x, y: 390, w, h: 52 },
    { id: 'boVan', nhan: '🚪 Thoát, không lưu', mau: 'xam', x, y: 466, w, h: 48 },
  ];
}

export function nutManThang() {
  return hangNut(
    [
      { id: 'tiep', nhan: '▶ Mê cung sau', mau: 'hong' },
      { id: 'lai', nhan: '⟲ Chơi lại', mau: 'xanh' },
      { id: 've', nhan: '☰ Màn chọn', mau: 'xam' },
    ],
    { x: 150, y: 500, w: 600, h: 62 },
  );
}

// Nút bật/tắt tiếng. Bắt buộc phải có và phải dễ thấy: nhạc nền là thứ người lớn ngồi
// cạnh muốn tắt đầu tiên, giấu nó trong menu con là làm khó người dùng.
// BỐN MỨC ÂM LƯỢNG. Là hệ số nhân truyền thẳng vào core/audio.js.
// Bấm nút là xoay vòng qua bốn mức — không dùng thanh trượt vì thanh trượt trên canvas
// cần bắt cả thao tác kéo, mà bốn mức đã đủ dùng cho một game của trẻ con.
export const MUC_AM = [0, 0.9, 1.8, 2.6];
export const TEN_AM = ['Tắt', 'Nhỏ', 'Vừa', 'To'];
const ICON_NHAC = ['🔇', '♪', '♫', '🎵'];
const ICON_TIENG = ['🔇', '🔈', '🔉', '🔊'];

// `rong` > 90 thì hiện kèm TÊN LOẠI và mức ("🎵 Nhạc: To"); hẹp hơn thì chỉ hiện biểu
// tượng (thanh trên mê cung). Phải ghi rõ Nhạc/Tiếng — hai nút cùng ghi "To" thì vô nghĩa.
export function nutAmThanh(st, y, x = 726, h = 44, rong = 76) {
  const nhan = (icon, muc, loai) => (rong > 90 ? `${icon} ${loai}: ${TEN_AM[muc]}` : icon);
  const mn = st.mucNhac ?? (st.nhac ? 3 : 0);
  const mt = st.mucTieng ?? (st.tieng ? 3 : 0);
  return [
    {
      id: 'nhac',
      nhan: nhan(ICON_NHAC[mn], mn, 'Nhạc'),
      mau: mn ? 'xanh' : 'xam',
      x,
      y,
      w: rong,
      h,
    },
    {
      id: 'tieng',
      nhan: nhan(ICON_TIENG[mt], mt, 'Tiếng'),
      mau: mt ? 'xanh' : 'xam',
      x: x + rong + 10,
      y,
      w: rong,
      h,
    },
  ];
}

// Trong mê cung: nút nằm gọn trên THANH THÔNG TIN ở đỉnh, không chiếm chỗ của mê cung.
export function nutTrongMeCung(st = { nhac: 1, tieng: 1 }) {
  return [
    { id: 've', nhan: '☰', mau: 'xam', x: 596, y: 4, w: 56, h: 44 },
    { id: 'toanManHinh', nhan: '⛶', mau: 'xam', x: 660, y: 4, w: 56, h: 44 },
    ...nutAmThanh(st, 4, 728, 44), // nhac 728..804 · tieng 814..890 — vừa khít mép phải
  ];
}

// Đổi toạ độ chuột trên trang thành toạ độ LOGIC 900×500 của canvas.
// Canvas bị CSS co giãn nên không dùng thẳng offsetX/offsetY được.
export function toaDoChuot(rect, clientX, clientY, w = W, h = H) {
  if (!rect || !rect.width || !rect.height) return null;
  return {
    x: ((clientX - rect.left) / rect.width) * w,
    y: ((clientY - rect.top) / rect.height) * h,
  };
}
