// systems/quiz.js — chọn câu hỏi theo HỘP LEITNER ba ngăn.
//
// Vì sao không chọn ngẫu nhiên: tổng hợp 242 nghiên cứu / 169.179 người cho thấy hai
// kỹ thuật học hiệu quả nhất là "luyện nhớ lại" (retrieval practice) và "giãn cách"
// (spacing) — và hiệu ứng này đã được đo rõ ở trẻ tiểu học. Hộp Leitner là cách rẻ
// nhất để có cả hai: câu trả lời sai quay lại sớm, câu đã thuộc giãn ra xa dần.
//
// Kết quả: bé ôn đúng những chỗ mình yếu mà KHÔNG có màn hình "ôn tập" nào cả — nó
// ẩn hoàn toàn trong việc đi mê cung. Bỏ phần này thì game chỉ còn là đố vui ngẫu nhiên.
//
// THEO DÕI THEO ID NÀO:
//   - Câu SINH TỰ ĐỘNG (math-gen) → id là id KHUÔN, ví dụ 'm2-cong-nho'.
//     Hộp theo dõi KỸ NĂNG "cộng có nhớ lớp 2", không phải một phép tính cụ thể.
//     Đúng về mặt sư phạm: cần luyện lại kỹ năng, không phải luyện lại con số.
//   - Câu VIẾT TAY → id riêng của từng câu. Hộp theo dõi từng đơn vị kiến thức.

import { makeRng } from '../core/rng.js';

// Số cửa phải đi qua trước khi được gặp lại, theo hộp. Chỉ số = số hộp (1..3).
export const DELAY = [0, 3, 10, 30];

// Tỉ lệ ưu tiên khi bốc: 60% hộp 1 (yếu nhất) · 30% hộp 2 · 10% hộp 3.
const WEIGHT = [0, 60, 30, 10];

const RECENT_MAX = 50; // cửa sổ chống lặp tối đa

export function makeQuiz(seed = 1) {
  const rng = makeRng(seed);
  let n = 0; // số câu đã ra — dùng làm "đồng hồ" cho việc giãn cách
  let boxes = {}; // id → hộp 1..3
  let due = {}; // id → số thứ tự câu sớm nhất được gặp lại
  let recent = []; // id vừa ra, mới nhất ở cuối

  const boxOf = (id) => boxes[id] || 1; // chưa gặp bao giờ = hộp 1 (ưu tiên cao)

  // Bốc một id từ danh sách cho trước. Trả null nếu danh sách rỗng.
  // LUẬT CỨNG: luôn phải trả về được câu. Không bao giờ để người chơi kẹt vì
  // "chưa tới hạn ôn" — thà ra câu sớm còn hơn chặn đường đi trong mê cung.
  function pick(ids) {
    if (!ids || !ids.length) return null;
    n++;

    // Cửa sổ chống lặp không được nuốt quá nửa kho câu, nếu không sẽ không còn gì để bốc.
    const win = Math.min(RECENT_MAX, Math.floor(ids.length / 2));
    const blocked = new Set(win > 0 ? recent.slice(-win) : []);
    let pool = ids.filter((id) => !blocked.has(id));
    if (!pool.length) pool = ids.slice();

    // Ưu tiên câu đã tới hạn ôn; nếu chưa câu nào tới hạn thì bỏ điều kiện này.
    const ready = pool.filter((id) => (due[id] || 0) <= n);
    if (ready.length) pool = ready;

    // Gom theo hộp rồi bốc hộp theo trọng số, bỏ qua hộp rỗng.
    const byBox = [null, [], [], []];
    for (const id of pool) byBox[boxOf(id)].push(id);
    let total = 0;
    for (let b = 1; b <= 3; b++) if (byBox[b].length) total += WEIGHT[b];
    let r = rng.next() * total;
    let chosen = null;
    for (let b = 1; b <= 3; b++) {
      if (!byBox[b].length) continue;
      r -= WEIGHT[b];
      if (r <= 0) {
        chosen = rng.pick(byBox[b]);
        break;
      }
    }
    if (chosen == null) chosen = rng.pick(pool); // lưới an toàn cho sai số dấu phẩy động

    recent.push(chosen);
    if (recent.length > RECENT_MAX) recent = recent.slice(-RECENT_MAX);
    return chosen;
  }

  // Ghi nhận kết quả. ok = true khi trả lời đúng NGAY LẦN ĐẦU.
  // Sai rồi thử lại đúng vẫn tính là sai — nếu không thì hộp mất hết ý nghĩa.
  function answer(id, ok) {
    const b = ok ? Math.min(3, boxOf(id) + 1) : 1;
    boxes[id] = b;
    due[id] = n + DELAY[b];
    return b;
  }

  return {
    pick,
    answer,
    boxOf,
    // Trả object thuần để save.js đem JSON.stringify + base64 vào mã BPL2.
    state: () => ({ n, boxes: { ...boxes }, due: { ...due }, recent: recent.slice() }),
    load(s) {
      if (!s || typeof s !== 'object') return;
      n = s.n | 0;
      boxes = { ...(s.boxes || {}) };
      due = { ...(s.due || {}) };
      recent = Array.isArray(s.recent) ? s.recent.slice(-RECENT_MAX) : [];
    },
  };
}
