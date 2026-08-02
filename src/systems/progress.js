// systems/progress.js — VÍ XU và ĐIỂM, sống xuyên suốt nhiều ván.
//
// Tách khỏi `maze-run` (chỉ biết một lượt chơi) vì xu phải tích luỹ qua nhiều mê cung thì
// mới mua nổi vũ khí. Kho lưu được TIÊM VÀO chứ không gọi thẳng localStorage — nhờ vậy
// test chạy được ở môi trường node không có localStorage.
//
// KHÔNG đụng tới mã lưu BPL của game 60 cửa (CLAUDE.md mục 7). Khoá riêng, định dạng riêng.

export const KHOA = 'mecung1';

// Kho giả dùng khi không có localStorage (node, hoặc trình duyệt chặn lưu trữ).
const khoTam = () => {
  let d = {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => (d[k] = String(v)) };
};

function khoMacDinh() {
  try {
    const ls = globalThis.localStorage;
    // Thử ghi thật: chế độ riêng tư của một số trình duyệt vẫn có đối tượng nhưng ném khi ghi.
    if (ls) {
      ls.setItem(KHOA + '_t', '1');
      return ls;
    }
  } catch {
    /* rơi về kho tạm */
  }
  return khoTam();
}

export function makeProgress(kho = khoMacDinh()) {
  let xu = 0,
    diem = 0,
    caoNhat = 0,
    daMua = [];
  // Mức âm lượng 0..3 (Tắt/Nhỏ/Vừa/To). Nhạc để thấp hơn hiệu ứng một bậc: nhạc nền to
  // ngang tiếng nhặt xu thì át mất phản hồi của thao tác.
  let amNhac = 2,
    amTieng = 3;
  // Ván đang chơi dở (null = không có) và tiến trình hộp Leitner.
  // Hộp Leitner PHẢI được lưu: đó là toàn bộ việc học tích luỹ được. Mất nó thì mỗi lần mở
  // game lại là bé bắt đầu ôn từ con số không, hỏng hẳn ý nghĩa của cách chọn câu.
  let van = null,
    quiz = null;

  try {
    const d = JSON.parse(kho.getItem(KHOA) || '{}');
    xu = Math.max(0, d.xu | 0);
    diem = Math.max(0, d.diem | 0);
    caoNhat = Math.max(0, d.caoNhat | 0);
    daMua = Array.isArray(d.daMua) ? d.daMua.filter((v) => typeof v === 'string') : [];
    const kep = (v, mac) => (Number.isInteger(v) && v >= 0 && v <= 3 ? v : mac);
    amNhac = kep(d.amNhac, 2);
    amTieng = kep(d.amTieng, 3);
    van = d.van && typeof d.van === 'object' ? d.van : null;
    quiz = d.quiz && typeof d.quiz === 'object' ? d.quiz : null;
  } catch {
    /* dữ liệu hỏng thì bắt đầu lại từ 0, không để vỡ game */
  }

  const ghi = () => {
    try {
      kho.setItem(KHOA, JSON.stringify({ xu, diem, caoNhat, daMua, amNhac, amTieng, van, quiz }));
    } catch {
      /* hết dung lượng hoặc bị chặn — cứ chơi tiếp, chỉ mất phần lưu */
    }
  };

  // Tiêu xu. Trả false nếu không đủ — người gọi phải kiểm, ví không bao giờ âm.
  function tieu(n) {
    n = Math.floor(n);
    if (!(n > 0) || n > xu) return false;
    xu -= n;
    ghi();
    return true;
  }

  return {
    get xu() {
      return xu;
    },
    get diem() {
      return diem;
    },
    get caoNhat() {
      return caoNhat;
    },
    get daMua() {
      return daMua.slice();
    },
    get amNhac() {
      return amNhac;
    },
    get amTieng() {
      return amTieng;
    },
    get van() {
      return van;
    },
    get quiz() {
      return quiz;
    },
    // Lưu ván đang chơi dở. Gọi `luuVan(null)` để xoá khi đã qua mê cung hoặc khi bỏ ván.
    luuVan(v) {
      van = v && typeof v === 'object' ? v : null;
      ghi();
    },
    luuQuiz(q) {
      quiz = q && typeof q === 'object' ? q : null;
      ghi();
    },
    // Đặt mức âm lượng, kẹp về 0..3 rồi lưu lại — mở game lần sau không phải chỉnh lại.
    datAm(nhac, tieng) {
      const kep = (v, cu) => (Number.isInteger(v) && v >= 0 && v <= 3 ? v : cu);
      amNhac = kep(nhac, amNhac);
      amTieng = kep(tieng, amTieng);
      ghi();
    },
    // Cộng thưởng. Số âm bị bỏ qua — luật §2: không bao giờ trừ điểm của bé.
    cong({ xu: dx = 0, diem: dd = 0 } = {}) {
      if (dx > 0) xu += Math.floor(dx);
      if (dd > 0) diem += Math.floor(dd);
      if (diem > caoNhat) caoNhat = diem;
      ghi();
    },
    tieu,
    coMon: (id) => daMua.includes(id),
    // Mua một món. Đã có rồi thì không mua lại, và không trừ xu oan.
    mua(id, gia) {
      if (daMua.includes(id)) return false;
      if (!tieu(gia)) return false;
      daMua.push(id);
      ghi();
      return true;
    },
  };
}
