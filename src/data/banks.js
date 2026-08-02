// data/banks.js — SỔ ĐĂNG KÝ BỘ ĐỀ. Thêm môn/bộ đề mới = thêm MỘT mục ở đây, không sửa
// game, không sửa giao diện, không sửa hộp Leitner.
//
// MỌI BỘ ĐỀ ĐỀU CÓ CHUNG BA THỨ:
//   capDo      danh sách cấp độ để chọn bằng nút ◀ ▶ (lớp, nhóm chủ đề, vòng thi… tuỳ bộ)
//   ids(cap)   trả danh sách id câu hỏi — hộp Leitner theo dõi theo id này
//   sinh(id)   trả câu hỏi hoàn chỉnh {q, a[4], k, why}
// Nhờ ba thứ đó mà `mecung.js` không cần biết bộ đề nào là sinh bằng khuôn mẫu, bộ nào là
// chép từ tài liệu.

import { mathIds, genMath, MATH_TEMPLATES } from './questions/math-gen.js';
import { taoBoDe } from './questions/bank.js';
import { TRANG_NGUYEN, NHOM_TN } from './questions/trang-nguyen.js';
import { OLYMPIA, NHOM_OLYMPIA } from './questions/olympia.js';

// ── Toán: sinh bằng khuôn mẫu, chia theo LỚP ────────────────────────────────
const toan = {
  id: 'toan',
  ten: '🔢 Toán',
  mo: 'Bám Chương trình GDPT 2018, chia theo lớp',
  capDo: [1, 2, 3, 4, 5].map((l) => ({ id: String(l), ten: `Lớp ${l}` })),
  ids: (cap) => mathIds(Number(cap) || 1),
  sinh: (id, rng) => genMath(id, rng),
  soCau: Infinity, // sinh bằng khuôn mẫu nên không bao giờ cạn
};

// ── Trạng Nguyên nhí: câu đố tiếng Việt tiểu học, chia theo NHÓM chủ đề ─────
// BẬT `tuSinhMoiNhu` CÓ CHỦ Ý: mọi câu trong một nhóm ở đây đều cùng một loại đáp án —
// đố con vật thì đáp án nào cũng là tên con vật, đố chữ thì đều là một tiếng. Bốc chéo
// trong nhóm cho mồi nhử tốt thật ("Con khỉ · Con cóc · Con ếch · Con thỏ").
// ĐỪNG sao chép cờ này sang bộ đề kiến thức tổng hợp — xem lý do ở đầu questions/bank.js.
const trangNguyen = taoBoDe({
  id: 'trangnguyen',
  ten: '👑 Trạng Nguyên nhí',
  mo: 'Câu đố tiếng Việt — hợp bé tiểu học',
  cau: TRANG_NGUYEN,
  nhom: NHOM_TN,
  tuSinhMoiNhu: true,
});

// Olympia: mồi nhử VIẾT TAY từng câu (không bật tuSinhMoiNhu). Kiến thức tổng hợp thì
// "cùng loại" không có nghĩa gì, máy không thể tự bịa ra mồi nhử đúng.
const olympia = taoBoDe({
  id: 'olympia',
  ten: '🏆 Olympia',
  mo: 'Kiến thức tổng hợp — THCS trở lên, khó',
  cau: OLYMPIA,
  nhom: NHOM_OLYMPIA,
});

// Bọc bộ đề tĩnh cho khớp giao diện chung (capDo lấy từ danh sách nhóm).
const boc = (b) => ({
  id: b.id,
  ten: b.ten,
  mo: b.mo,
  capDo: b.nhom,
  ids: (cap) => b.ids(cap),
  sinh: (id, rng) => b.sinh(id, rng),
  soCau: b.soCau,
});

export const BO_DE = [toan, boc(trangNguyen), boc(olympia)];

export const timBoDe = (id) => BO_DE.find((b) => b.id === id) || BO_DE[0];

// Cấp độ hợp lệ của một bộ đề; trả về cấp đầu tiên nếu id không còn tồn tại
// (đổi bộ đề thì cấp của bộ cũ vô nghĩa — không được để game kẹt vì chuyện đó).
export function capHopLe(boDe, capId) {
  const co = boDe.capDo.find((c) => c.id === capId);
  return co ? co.id : boDe.capDo[0].id;
}

// Cho test: tổng số khuôn toán, để biết bộ toán chưa cạn.
export const SO_KHUON_TOAN = MATH_TEMPLATES.length;
