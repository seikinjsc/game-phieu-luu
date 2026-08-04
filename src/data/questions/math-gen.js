// data/questions/math-gen.js — bộ SINH câu hỏi Toán từ khuôn mẫu.
//
// Vì sao sinh chứ không gõ tay: một khuôn cho ra hàng nghìn câu khác nhau, không
// bao giờ cạn. Toán là môn duy nhất sinh được sạch sẽ như vậy — Tiếng Việt và
// Lý/Hoá vẫn phải viết tay (xem ME-CUNG-NOI-DUNG.md §C.5).
//
// RÀNG BUỘC BẮT BUỘC — bám Chương trình GDPT 2018 (Thông tư 32/2018/TT-BGDĐT):
//   Lớp 1: 0–100, cộng trừ KHÔNG NHỚ
//   Lớp 2: 0–1000, cộng trừ nhớ ≤ 1 lượt; nhân/chia CHỈ bảng 2 và 5
//   Lớp 3: 0–100 000, nhân/chia với số 1 chữ số; chu vi + diện tích chữ nhật/vuông
//   Lớp 4: phân số 4 phép tính (mẫu ≤ 12); đổi đơn vị; trung bình cộng
//   Lớp 5: tỉ số phần trăm; vận tốc–quãng đường–thời gian; số thập phân
// Sinh ra câu vi phạm miền số là lỗi IM LẶNG: game vẫn chạy, chỉ có bé là khổ.
// Vì vậy tests/math-gen.test.js kiểm tra lại từng ràng buộc trên hàng trăm mẫu.
//
// MỒI NHỬ (distractor) không được là số ngẫu nhiên. Mỗi khuôn khai báo mồi nhử là
// KẾT QUẢ CỦA LỖI SAI THẬT (quên nhớ, cộng tử cộng mẫu, nhầm chu vi với diện tích...).
// Nhờ vậy khi bé chọn sai, ta biết bé sai ở đâu, và `why` nói trúng chỗ đó.

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const r2 = (x) => Math.round(x * 100) / 100; // làm tròn 2 chữ số thập phân
const frac = (n, d) => {
  const g = gcd(Math.abs(n), Math.abs(d)) || 1;
  const nn = n / g,
    dd = d / g;
  return dd === 1 ? String(nn) : `${nn}/${dd}`;
};

// Số thập phân viết theo lối Việt Nam: dấu PHẨY, không phải dấu chấm.
const pt = (x) => String(r2(x)).replace('.', ',');
// Đổi số nguyên "phần mười" thành chuỗi thập phân: 26 → "2,6". Giữ mọi phép tính trên số
// NGUYÊN rồi mới đổi ra chữ — làm thẳng trên số thực thì 0.1 + 0.2 ra 0,30000000000000004.
const p10 = (n) => pt(n / 10);

// Nhân nhưng QUÊN NHỚ — mô phỏng lỗi thật của học sinh: 27 × 3 → 61 (đúng là 81).
// Mỗi chữ số nhân riêng rồi chỉ lấy hàng đơn vị, không cộng phần nhớ sang trái.
function mulForgetCarry(a, b) {
  let out = 0,
    x = a,
    p = 1;
  while (x > 0) {
    out += (((x % 10) * b) % 10) * p;
    x = Math.floor(x / 10);
    p *= 10;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// KHUÔN MẪU. Mỗi khuôn: { id, grade, level, name, gen(rng) }
// gen trả { q, ans, wrong[], why }. `wrong` xếp theo thứ tự ưu tiên — mồi nhử
// "lỗi kinh điển" đứng đầu để chắc chắn được chọn vào 4 đáp án.
// `level` 1–3 là độ khó TRONG cùng một lớp, không phải độ khó mê cung.
// ─────────────────────────────────────────────────────────────────────────────
export const MATH_TEMPLATES = [
  // ── LỚP 1 ──────────────────────────────────────────────────────────────────
  {
    id: 'm1-nham',
    grade: 1,
    level: 1,
    name: 'Nhẩm cộng trừ trong 10',
    // Chương trình lớp 1 tách riêng "tính nhẩm trong phạm vi 10" khỏi "cộng trừ trong 100".
    // Đây là bậc dễ nhất của cả bộ — chỗ đứng cho bé 6 tuổi mới vào lớp 1.
    gen(rng) {
      const cong = rng.int(0, 1) === 0;
      if (cong) {
        const a = rng.int(1, 8);
        const b = rng.int(1, 9 - a); // tổng ≤ 9, nằm gọn trong phạm vi 10
        return {
          q: `${a} + ${b} = ?`,
          ans: a + b,
          wrong: [a + b + 1, a + b - 1, a * b, a + b + 2, Math.abs(a - b)],
          why: `Đếm thêm ${b} bắt đầu từ ${a}: được ${a + b}.`,
        };
      }
      const a = rng.int(3, 10);
      const b = rng.int(1, a - 1);
      return {
        q: `${a} − ${b} = ?`,
        ans: a - b,
        wrong: [a - b + 1, a - b - 1, a + b, a - b + 2, b],
        why: `Đếm lùi ${b} bước từ ${a}: được ${a - b}.`,
      };
    },
  },
  {
    id: 'm1-sosanh',
    grade: 1,
    level: 1,
    name: 'So sánh số trong 100',
    gen(rng) {
      let a;
      do {
        a = rng.int(11, 89);
      } while (a % 10 === 0 || a % 11 === 0); // tránh số tròn chục và số đảo lại chính nó
      const dao = Number(String(a).split('').reverse().join(''));
      const bo = new Set([a, dao]);
      while (bo.size < 4) bo.add(rng.int(10, 99));
      const arr = [...bo];
      const lon = rng.int(0, 1) === 0;
      const ans = lon ? Math.max(...arr) : Math.min(...arr);
      return {
        q: `Số nào ${lon ? 'LỚN NHẤT' : 'BÉ NHẤT'}?`,
        ans,
        // Mồi nhử tự nhiên: trong bộ luôn có CẶP ĐẢO CHỮ SỐ (vd 37 và 73) — bé nhìn
        // lướt hàng đơn vị là chọn nhầm ngay.
        wrong: arr.filter((v) => v !== ans),
        why: `So hàng chục trước: số nào có hàng chục ${lon ? 'lớn' : 'bé'} hơn thì ${lon ? 'lớn' : 'bé'} hơn. Hàng chục bằng nhau mới so hàng đơn vị. Đáp án là ${ans}.`,
      };
    },
  },
  {
    id: 'm1-cong',
    grade: 1,
    level: 1,
    name: 'Cộng không nhớ trong 100',
    gen(rng) {
      let a, b;
      do {
        const u1 = rng.int(0, 8);
        const u2 = rng.int(0, 9 - u1); // tổng hàng đơn vị ≤ 9 → không nhớ
        const t1 = rng.int(1, 8);
        const t2 = rng.int(0, 9 - t1); // tổng hàng chục ≤ 9 → ≤ 99
        a = t1 * 10 + u1;
        b = t2 * 10 + u2;
      } while (b < 1);
      const ans = a + b;
      return {
        q: `${a} + ${b} = ?`,
        ans,
        // lỗi thật ở lớp 1: cộng nhầm hàng (lệch 10), đếm lệch 1
        wrong: [ans + 10, ans - 10, ans + 1, ans - 1, ans + 20],
        why: `Cộng hàng đơn vị: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. Cộng hàng chục: ${Math.floor(a / 10)} + ${Math.floor(b / 10)} = ${Math.floor(a / 10) + Math.floor(b / 10)}. Vậy ${ans}.`,
      };
    },
  },
  {
    id: 'm1-tru',
    grade: 1,
    level: 1,
    name: 'Trừ không mượn trong 100',
    gen(rng) {
      let a, b;
      do {
        const ta = rng.int(1, 9),
          ua = rng.int(0, 9);
        const tb = rng.int(0, ta),
          ub = rng.int(0, ua); // mỗi hàng đều ≤ hàng tương ứng → không mượn
        a = ta * 10 + ua;
        b = tb * 10 + ub;
      } while (b < 1 || a === b);
      const ans = a - b;
      return {
        q: `${a} − ${b} = ?`,
        ans,
        wrong: [a + b, ans + 10, ans + 1, ans - 1, ans + 20], // a+b = nhầm dấu
        why: `Trừ hàng đơn vị: ${a % 10} − ${b % 10} = ${(a % 10) - (b % 10)}. Trừ hàng chục: ${Math.floor(a / 10)} − ${Math.floor(b / 10)} = ${Math.floor(a / 10) - Math.floor(b / 10)}. Vậy ${ans}.`,
      };
    },
  },

  {
    id: 'm1-lienke',
    grade: 1,
    level: 1,
    name: 'Số liền trước, số liền sau',
    gen(rng) {
      const n = rng.int(11, 98);
      const sau = rng.int(0, 1) === 0;
      const ans = sau ? n + 1 : n - 1;
      return {
        q: `Số liền ${sau ? 'sau' : 'trước'} của ${n} là số nào?`,
        ans,
        // MỒI NHỬ SỐ 1: đổi chiều — hỏi "liền sau" mà lấy số liền trước. Lỗi phổ biến nhất
        // vì bé mới học chỉ nhớ "hai số cạnh nhau", chưa phân biệt trước/sau.
        wrong: [sau ? n - 1 : n + 1, n, ans + 10, ans - 10, ans + 2],
        why: `Liền ${sau ? 'sau' : 'trước'} là ${sau ? 'thêm' : 'bớt'} 1 đơn vị: ${n} ${sau ? '+' : '−'} 1 = ${ans}.`,
      };
    },
  },
  {
    id: 'm1-timso',
    grade: 1,
    level: 1,
    name: 'Tìm số còn thiếu trong phạm vi 10',
    gen(rng) {
      const ans = rng.int(1, 9);
      const b = rng.int(1, 10 - ans);
      const tong = ans + b;
      return {
        q: `? + ${b} = ${tong}. Số cần tìm là số nào?`,
        ans,
        // MỒI NHỬ SỐ 1: chép luôn kết quả bên phải — bé chưa hiểu dấu "=" nghĩa là hai bên
        // bằng nhau, thấy số nào to nhất thì chọn.
        wrong: [tong, ans + 1, ans - 1, tong + b, b],
        why: `Lấy tổng trừ đi số đã biết: ${tong} − ${b} = ${ans}. Thử lại: ${ans} + ${b} = ${tong}.`,
      };
    },
  },
  {
    id: 'm1-gio',
    grade: 1,
    level: 2,
    name: 'Xem đồng hồ — giờ đúng',
    gen(rng) {
      const h = rng.int(1, 12);
      return {
        q: `Kim ngắn chỉ số ${h}, kim dài chỉ số 12. Đồng hồ chỉ mấy giờ?`,
        ans: `${h} giờ`,
        // MỒI NHỬ SỐ 1: đọc theo KIM DÀI (12 giờ) — lỗi kinh điển của bé mới học xem đồng hồ.
        wrong: [
          '12 giờ',
          `${h === 12 ? 1 : h + 1} giờ`,
          `${h === 1 ? 12 : h - 1} giờ`,
          `${h} giờ 30 phút`,
          '6 giờ',
        ],
        why: `Kim dài chỉ số 12 nghĩa là ĐÚNG giờ. Giờ đọc theo kim NGẮN, kim ngắn chỉ số ${h} nên là ${h} giờ.`,
      };
    },
  },
  {
    id: 'm1-chuc-donvi',
    grade: 1,
    level: 2,
    name: 'Cấu tạo số: chục và đơn vị',
    gen(rng) {
      let t, u;
      do {
        t = rng.int(2, 9);
        u = rng.int(1, 9);
        // t phải KHÁC u, nếu không mồi nhử "đọc ngược" sẽ trùng đúng đáp án.
      } while (t === u);
      const n = t * 10 + u;
      return {
        q: `Số ${n} gồm mấy chục và mấy đơn vị?`,
        ans: `${t} chục ${u} đơn vị`,
        // MỒI NHỬ SỐ 1: đảo hai hàng cho nhau — bé đọc số từ phải sang trái.
        wrong: [
          `${u} chục ${t} đơn vị`,
          `${t} chục ${t} đơn vị`,
          `${u} chục ${u} đơn vị`,
          `${t + 1} chục ${u} đơn vị`,
          `${t} chục ${u + 1} đơn vị`,
        ],
        why: `Chữ số ĐỨNG TRƯỚC là hàng chục (${t}), chữ số đứng sau là hàng đơn vị (${u}). Vậy ${n} gồm ${t} chục ${u} đơn vị.`,
      };
    },
  },

  // ── LỚP 2 ──────────────────────────────────────────────────────────────────
  {
    id: 'm2-cong-nho',
    grade: 2,
    level: 1,
    name: 'Cộng có nhớ 1 lượt',
    gen(rng) {
      const u1 = rng.int(1, 9);
      const u2 = rng.int(10 - u1, 9); // hàng đơn vị ≥ 10 → nhớ đúng 1 lượt
      const t1 = rng.int(1, 4);
      const t2 = rng.int(0, 4); // t1+t2+1 ≤ 9 → không nhớ lượt thứ hai
      const a = t1 * 10 + u1,
        b = t2 * 10 + u2;
      const ans = a + b;
      return {
        q: `${a} + ${b} = ?`,
        ans,
        // MỒI NHỬ SỐ 1: quên nhớ → thiếu đúng 10. Đây là lỗi phổ biến nhất ở lớp 2.
        wrong: [ans - 10, ans + 10, ans - 1, ans + 1, ans - 20],
        why: `${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)} → viết ${((a % 10) + (b % 10)) % 10}, NHỚ 1. Hàng chục: ${Math.floor(a / 10)} + ${Math.floor(b / 10)} + 1 = ${Math.floor(a / 10) + Math.floor(b / 10) + 1}. Vậy ${ans}. Quên nhớ 1 sẽ ra ${ans - 10}.`,
      };
    },
  },
  {
    id: 'm2-tru-nho',
    grade: 2,
    level: 1,
    name: 'Trừ có nhớ 1 lượt',
    gen(rng) {
      const ub = rng.int(1, 8);
      const ua = rng.int(0, ub - 1); // đơn vị số bị trừ NHỎ HƠN → phải mượn
      const tb = rng.int(1, 8);
      const ta = rng.int(tb + 1, 9); // hàng chục đủ để mượn mà không âm
      const a = ta * 10 + ua,
        b = tb * 10 + ub;
      const ans = a - b;
      return {
        q: `${a} − ${b} = ?`,
        ans,
        // MỒI NHỬ SỐ 1: "trừ ngược" — ở mỗi hàng lấy chữ số lớn trừ chữ số bé để khỏi
        // phải mượn. Đây là lỗi sai kinh điển nhất của phép trừ có nhớ.
        wrong: [(ta - tb) * 10 + (ub - ua), ans + 10, ans - 10, ans + 1, a + b],
        why: `${ua} không trừ được ${ub}, phải MƯỢN 1 chục: ${ua + 10} − ${ub} = ${ua + 10 - ub}. Hàng chục còn ${ta} − 1 = ${ta - 1}, rồi ${ta - 1} − ${tb} = ${ta - 1 - tb}. Vậy ${ans}. Nếu lấy ${ub} − ${ua} cho khỏi mượn thì ra ${(ta - tb) * 10 + (ub - ua)} — sai.`,
      };
    },
  },
  {
    id: 'm2-nhan',
    grade: 2,
    level: 2,
    name: 'Bảng nhân 2 và 5',
    gen(rng) {
      const b = rng.pick([2, 5]); // chương trình lớp 2 CHỈ có bảng 2 và 5
      const a = rng.int(2, 10);
      const other = b === 2 ? 5 : 2;
      const ans = a * b;
      return {
        q: `${a} × ${b} = ?`,
        ans,
        // lỗi thật: tra nhầm bảng, lệch một bậc trong bảng, nhầm nhân thành cộng
        wrong: [a * other, ans + b, ans - b, a + b, ans + a],
        why: `${a} × ${b} nghĩa là ${b} được lấy ${a} lần: ${ans}. Nhầm sang bảng ${other} sẽ ra ${a * other}.`,
      };
    },
  },
  {
    id: 'm2-chia',
    grade: 2,
    level: 2,
    name: 'Bảng chia 2 và 5',
    gen(rng) {
      const b = rng.pick([2, 5]);
      const ans = rng.int(2, 10);
      const a = ans * b;
      return {
        q: `${a} : ${b} = ?`,
        ans,
        wrong: [a - b, ans + 1, ans - 1, a * b, ans + b],
        why: `${ans} × ${b} = ${a}, nên ${a} : ${b} = ${ans}.`,
      };
    },
  },

  {
    id: 'm2-cong-1000',
    grade: 2,
    level: 2,
    name: 'Cộng trong phạm vi 1000',
    gen(rng) {
      // Mỗi hàng cộng lại đều ≤ 9 → không nhớ, đúng miền lớp 2 khi làm quen số ba chữ số.
      const h1 = rng.int(1, 8),
        h2 = rng.int(1, 9 - h1);
      const t1 = rng.int(0, 8),
        t2 = rng.int(0, 9 - t1);
      const u1 = rng.int(0, 8),
        u2 = rng.int(0, 9 - u1);
      const a = h1 * 100 + t1 * 10 + u1,
        b = h2 * 100 + t2 * 10 + u2;
      const ans = a + b;
      return {
        q: `${a} + ${b} = ?`,
        ans,
        // MỒI NHỬ SỐ 1: đặt tính lệch cột, cộng nhầm trăm với chục → lệch đúng 100.
        wrong: [ans + 100, ans - 100, ans + 10, ans - 10, ans + 1],
        why: `Cộng từ phải sang: đơn vị ${u1} + ${u2} = ${u1 + u2}, chục ${t1} + ${t2} = ${t1 + t2}, trăm ${h1} + ${h2} = ${h1 + h2}. Vậy ${ans}.`,
      };
    },
  },
  {
    id: 'm2-donvi-dodai',
    grade: 2,
    level: 2,
    name: 'Đổi đơn vị đo độ dài',
    gen(rng) {
      // Chỉ dm · cm · m · km — đúng bộ đơn vị độ dài của lớp 2. g, ml để dành lớp 3.
      const P = [
        ['dm', 'cm', 10],
        ['m', 'dm', 10],
        ['m', 'cm', 100],
        ['km', 'm', 1000],
      ];
      const [from, to, f] = rng.pick(P);
      const n = rng.int(2, 9);
      const ans = n * f;
      return {
        q: `${n} ${from} = ? ${to}`,
        ans: `${ans} ${to}`,
        // MỒI NHỬ SỐ 1: đơn vị nào cũng nhân 10 — bé học thuộc "đổi là thêm số 0".
        wrong: [
          `${n * 10} ${to}`,
          `${ans * 10} ${to}`,
          `${n + f} ${to}`,
          `${n} ${to}`,
          `${ans / 10} ${to}`,
        ],
        why: `1 ${from} = ${f} ${to}, nên ${n} ${from} = ${n} × ${f} = ${ans} ${to}.`,
      };
    },
  },
  {
    id: 'm2-gio-ruoi',
    grade: 2,
    level: 2,
    name: 'Xem đồng hồ — giờ rưỡi',
    gen(rng) {
      const h = rng.int(1, 11);
      return {
        q: `Kim ngắn ở giữa số ${h} và số ${h + 1}, kim dài chỉ số 6. Mấy giờ rồi?`,
        ans: `${h} giờ 30 phút`,
        // MỒI NHỬ SỐ 1: lấy giờ theo số ĐỨNG SAU vì kim ngắn đã nhích qua.
        wrong: [
          `${h + 1} giờ 30 phút`,
          `${h} giờ`,
          `${h + 1} giờ`,
          `${h} giờ 6 phút`,
          `6 giờ ${h} phút`,
        ],
        why: `Kim dài chỉ số 6 là 30 phút. Kim ngắn chưa qua hẳn số ${h + 1} nên giờ vẫn là ${h}: ${h} giờ 30 phút.`,
      };
    },
  },
  {
    id: 'm2-tien',
    grade: 2,
    level: 2,
    name: 'Tiền Việt Nam',
    gen(rng) {
      const a = rng.int(1, 9) * 1000;
      // Hai món phải KHÁC giá: cùng giá thì mồi nhử "trừ thay vì cộng" ra 0 đồng, mà
      // "mua hai thứ hết 0 đồng" thì bé loại ngay không cần tính.
      let b = rng.int(1, 8) * 1000;
      if (b >= a) b += 1000;
      const ans = a + b;
      return {
        q: `Mua quyển vở ${a} đồng và cái bút ${b} đồng. Hết tất cả bao nhiêu tiền?`,
        ans: `${ans} đồng`,
        // MỒI NHỬ SỐ 1: trừ thay vì cộng — bé bám chữ "còn/hết" thay vì hiểu đề.
        wrong: [
          `${Math.abs(a - b)} đồng`,
          `${ans + 1000} đồng`,
          `${ans - 1000} đồng`,
          `${a} đồng`,
          `${b} đồng`,
        ],
        why: `"Hết tất cả" là gộp hai thứ lại, phải CỘNG: ${a} + ${b} = ${ans} đồng.`,
      };
    },
  },
  {
    id: 'm2-loivan-nhan',
    grade: 2,
    level: 2,
    name: 'Bài toán có lời văn — phép nhân',
    gen(rng) {
      const b = rng.pick([2, 5]); // lớp 2 CHỈ có bảng 2 và 5
      const a = rng.int(3, 9);
      const [vat, thu] = rng.pick([
        ['hộp', 'cái bánh'],
        ['rổ', 'quả cam'],
        ['đĩa', 'chiếc kẹo'],
        ['túi', 'quả trứng'],
      ]);
      const ans = a * b;
      return {
        q: `Mỗi ${vat} có ${b} ${thu}. Hỏi ${a} ${vat} có bao nhiêu ${thu}?`,
        ans,
        // MỒI NHỬ SỐ 1: cộng hai số trong đề — phản xạ của bé chưa nhận ra đây là phép nhân.
        wrong: [a + b, a * (b === 2 ? 5 : 2), ans + b, ans - b, ans + a],
        why: `Mỗi ${vat} có ${b} ${thu}, lấy ${b} lần ${a} lần: ${b} × ${a} = ${ans}. Cộng ${a} + ${b} = ${a + b} là sai — đề này là phép NHÂN.`,
      };
    },
  },

  // ── LỚP 3 ──────────────────────────────────────────────────────────────────
  {
    id: 'm3-nhan1cs',
    grade: 3,
    level: 2,
    name: 'Nhân với số có một chữ số',
    gen(rng) {
      let a, b, quenNho;
      do {
        a = rng.int(12, 99);
        b = rng.int(2, 9);
        quenNho = mulForgetCarry(a, b);
        // Bắt buộc phép nhân PHẢI có nhớ: nếu không thì khuôn này chẳng dạy gì, và
        // mồi nhử "quên nhớ" sẽ trùng đáp án đúng (hoặc ra 0 — đáp án rác lộ liễu).
      } while (quenNho === a * b || quenNho <= 0);
      const ans = a * b;
      return {
        q: `${a} × ${b} = ?`,
        ans,
        // MỒI NHỬ SỐ 1: nhân từng chữ số nhưng quên cộng phần nhớ sang trái
        wrong: [quenNho, ans + a, ans - a, ans + b, ans - 10],
        why: `${a} × ${b}: ${a % 10} × ${b} = ${(a % 10) * b} → viết ${((a % 10) * b) % 10}, nhớ ${Math.floor(((a % 10) * b) / 10)}. Rồi ${Math.floor(a / 10)} × ${b} = ${Math.floor(a / 10) * b}, cộng phần nhớ. Kết quả ${ans}.`,
      };
    },
  },
  {
    id: 'm3-chia1cs',
    grade: 3,
    level: 2,
    name: 'Chia cho số có một chữ số',
    gen(rng) {
      const b = rng.int(2, 9);
      const ans = rng.int(12, 99);
      const a = ans * b;
      return {
        q: `${a} : ${b} = ?`,
        ans,
        wrong: [ans + 10, ans - 10, ans + 1, a - b, ans + b],
        why: `Thử lại bằng phép nhân: ${ans} × ${b} = ${a}. Vậy ${a} : ${b} = ${ans}.`,
      };
    },
  },
  {
    id: 'm3-hinh',
    grade: 3,
    level: 3,
    name: 'Chu vi và diện tích hình chữ nhật',
    gen(rng) {
      const w = rng.int(3, 20); // dài
      const h = rng.int(2, w - 1); // rộng — LUÔN nhỏ hơn dài, nếu không đề bài tự mâu thuẫn
      const cv = 2 * (w + h),
        dt = w * h;
      if (rng.int(0, 1) === 0) {
        return {
          q: `Hình chữ nhật dài ${w} cm, rộng ${h} cm. Chu vi bằng bao nhiêu?`,
          ans: `${cv} cm`,
          // MỒI NHỬ SỐ 1: nhầm sang công thức diện tích — lỗi kinh điển của lớp 3
          wrong: [`${dt} cm`, `${w + h} cm`, `${2 * w + h} cm`, `${4 * w} cm`, `${cv + 2} cm`],
          why: `Chu vi = (dài + rộng) × 2 = (${w} + ${h}) × 2 = ${cv} cm. Nếu lấy ${w} × ${h} = ${dt} là đang tính DIỆN TÍCH, không phải chu vi.`,
        };
      }
      return {
        q: `Hình chữ nhật dài ${w} cm, rộng ${h} cm. Diện tích bằng bao nhiêu?`,
        ans: `${dt} cm²`,
        wrong: [`${cv} cm²`, `${w + h} cm²`, `${2 * dt} cm²`, `${dt + w} cm²`, `${dt - h} cm²`],
        why: `Diện tích = dài × rộng = ${w} × ${h} = ${dt} cm². Nếu lấy (${w} + ${h}) × 2 = ${cv} là đang tính CHU VI.`,
      };
    },
  },

  {
    id: 'm3-bangnhan',
    grade: 3,
    level: 1,
    name: 'Bảng nhân 6, 7, 8, 9',
    gen(rng) {
      const b = rng.int(6, 9); // lớp 3 học nốt các bảng còn lại sau bảng 2 và 5
      const a = rng.int(2, 10);
      const ans = a * b;
      return {
        q: `${a} × ${b} = ?`,
        ans,
        // MỒI NHỬ SỐ 1 & 2: lệch ĐÚNG MỘT BẬC trong bảng — dấu hiệu của đọc vẹt bảng nhân.
        wrong: [ans - b, ans + b, a * (b - 1), a + b, a * (b + 1)],
        why: `${a} × ${b} = ${ans}. Đọc lệch một bậc trong bảng ${b} sẽ ra ${ans - b} hoặc ${ans + b}.`,
      };
    },
  },
  {
    id: 'm3-chia-du',
    grade: 3,
    level: 2,
    name: 'Chia có dư',
    gen(rng) {
      const b = rng.int(3, 9);
      const thuong = rng.int(3, 12);
      const du = rng.int(1, b - 1); // số dư LUÔN nhỏ hơn số chia
      const a = thuong * b + du;
      return {
        q: `${a} : ${b} = ? (viết thương và số dư)`,
        ans: `${thuong} dư ${du}`,
        // MỒI NHỬ SỐ 1: lấy số dư là "phần thiếu để tròn" (b − du) thay vì phần thừa.
        wrong: [
          `${thuong} dư ${b - du}`,
          `${thuong + 1} dư ${du}`,
          `${thuong} dư 0`,
          `${thuong - 1} dư ${du}`,
          `${du} dư ${thuong}`,
        ],
        why: `${thuong} × ${b} = ${thuong * b}, còn thừa ${a} − ${thuong * b} = ${du}. Vậy ${a} : ${b} = ${thuong} dư ${du}. Số dư LUÔN phải nhỏ hơn số chia ${b}.`,
      };
    },
  },
  {
    id: 'm3-gap-giam',
    grade: 3,
    level: 2,
    name: 'Gấp lên và giảm đi một số lần',
    gen(rng) {
      const n = rng.int(2, 9);
      if (rng.int(0, 1) === 0) {
        const a = rng.int(4, 30);
        const ans = a * n;
        return {
          q: `Gấp ${a} lên ${n} lần thì được số nào?`,
          ans,
          // MỒI NHỬ SỐ 1: "gấp lên" hiểu thành "thêm vào" → cộng thay vì nhân.
          wrong: [a + n, Math.round(a / n), ans + a, ans - a, a - n],
          why: `Gấp lên ${n} lần là NHÂN với ${n}: ${a} × ${n} = ${ans}. Thêm ${n} đơn vị (ra ${a + n}) là "nhiều hơn", không phải "gấp".`,
        };
      }
      const ans = rng.int(3, 12);
      const b = ans * n;
      return {
        q: `Giảm ${b} đi ${n} lần thì được số nào?`,
        ans,
        // MỒI NHỬ SỐ 1: "giảm đi n lần" hiểu thành "bớt n đơn vị" → trừ thay vì chia.
        wrong: [b - n, b + n, b, ans + n, ans - n],
        why: `Giảm đi ${n} lần là CHIA cho ${n}: ${b} : ${n} = ${ans}. Bớt ${n} đơn vị (ra ${b - n}) là "ít hơn", không phải "giảm đi ${n} lần".`,
      };
    },
  },
  {
    id: 'm3-tim-x',
    grade: 3,
    level: 2,
    name: 'Tìm thành phần chưa biết',
    gen(rng) {
      const kieu = rng.int(0, 2);
      if (kieu === 0) {
        const x = rng.int(6, 40),
          b = rng.int(3, 9);
        const c = x * b;
        return {
          q: `Tìm x, biết x × ${b} = ${c}`,
          ans: x,
          wrong: [c * b, c + b, c - b, x + b, x - b],
          why: `Muốn tìm THỪA SỐ chưa biết, lấy tích chia cho thừa số kia: ${c} : ${b} = ${x}.`,
        };
      }
      if (kieu === 1) {
        const x = rng.int(12, 90),
          b = rng.int(5, 40);
        const c = x + b;
        return {
          q: `Tìm x, biết x + ${b} = ${c}`,
          ans: x,
          // MỒI NHỬ SỐ 1: cộng tiếp thay vì trừ ngược — bé làm theo dấu nhìn thấy trong đề.
          wrong: [c + b, c, b, x + 1, x - 1],
          why: `Muốn tìm SỐ HẠNG chưa biết, lấy tổng trừ số hạng kia: ${c} − ${b} = ${x}.`,
        };
      }
      const x = rng.int(20, 90),
        b = rng.int(5, 19);
      const c = x - b;
      return {
        q: `Tìm x, biết x − ${b} = ${c}`,
        ans: x,
        wrong: [c - b, c, b, x + 1, x - 1],
        why: `Muốn tìm SỐ BỊ TRỪ, lấy hiệu cộng số trừ: ${c} + ${b} = ${x}.`,
      };
    },
  },
  {
    id: 'm3-hinhvuong',
    grade: 3,
    level: 2,
    name: 'Chu vi và diện tích hình vuông',
    gen(rng) {
      const a = rng.int(3, 20);
      const cv = a * 4,
        dt = a * a;
      if (rng.int(0, 1) === 0) {
        return {
          q: `Hình vuông có cạnh ${a} cm. Chu vi bằng bao nhiêu?`,
          ans: `${cv} cm`,
          // MỒI NHỬ SỐ 1: nhầm sang diện tích — y hệt lỗi ở hình chữ nhật.
          wrong: [`${dt} cm`, `${a * 2} cm`, `${cv + a} cm`, `${a * 3} cm`, `${cv * 2} cm`],
          why: `Chu vi hình vuông = cạnh × 4 = ${a} × 4 = ${cv} cm. Lấy ${a} × ${a} = ${dt} là DIỆN TÍCH, không phải chu vi.`,
        };
      }
      return {
        q: `Hình vuông có cạnh ${a} cm. Diện tích bằng bao nhiêu?`,
        ans: `${dt} cm²`,
        wrong: [`${cv} cm²`, `${a * 2} cm²`, `${dt + a} cm²`, `${dt * 2} cm²`, `${a * 3} cm²`],
        why: `Diện tích hình vuông = cạnh × cạnh = ${a} × ${a} = ${dt} cm². Lấy ${a} × 4 = ${cv} là CHU VI.`,
      };
    },
  },
  {
    id: 'm3-donvi-khoiluong',
    grade: 3,
    level: 2,
    name: 'Đổi sang đơn vị nhỏ: g, ml, mm',
    gen(rng) {
      // g · ml · mm mới xuất hiện ở lớp 3 — tách khỏi bộ dm/cm/m/km của lớp 2.
      const P = [
        ['kg', 'g', 1000],
        ['l', 'ml', 1000],
        ['m', 'mm', 1000],
        ['cm', 'mm', 10],
        ['dm', 'mm', 100],
      ];
      const [from, to, f] = rng.pick(P);
      const n = rng.int(2, 9);
      const ans = n * f;
      return {
        q: `${n} ${from} = ? ${to}`,
        ans: `${ans} ${to}`,
        wrong: [
          `${n * 10} ${to}`,
          `${ans * 10} ${to}`,
          `${n + f} ${to}`,
          `${n} ${to}`,
          `${ans / 10} ${to}`,
        ],
        why: `1 ${from} = ${f} ${to}, nên ${n} ${from} = ${n} × ${f} = ${ans} ${to}.`,
      };
    },
  },

  // ── LỚP 4 ──────────────────────────────────────────────────────────────────
  {
    id: 'm4-phanso',
    grade: 4,
    level: 2,
    name: 'Cộng hai phân số khác mẫu',
    gen(rng) {
      let a, b, c, d;
      do {
        b = rng.int(2, 12);
        d = rng.int(2, 12);
        a = rng.int(1, b - 1);
        c = rng.int(1, d - 1);
        // Phân số trong đề phải TỐI GIẢN — SGK không bao giờ viết "2/4".
      } while (b === d || gcd(a, b) !== 1 || gcd(c, d) !== 1);
      const num = a * d + c * b,
        den = b * d;
      return {
        q: `${a}/${b} + ${c}/${d} = ?`,
        ans: frac(num, den),
        // MỒI NHỬ SỐ 1: cộng tử với tử, mẫu với mẫu — lỗi kinh điển nhất của phân số
        wrong: [
          frac(a + c, b + d),
          frac(a + c, den),
          frac(num + 1, den),
          frac(a * c, den),
          frac(num - 1, den),
        ],
        why: `Quy đồng mẫu số ${b} và ${d} thành ${den}: ${a}/${b} = ${a * d}/${den}, ${c}/${d} = ${c * b}/${den}. Cộng tử số: ${a * d} + ${c * b} = ${num}. Vậy ${frac(num, den)}. KHÔNG được cộng tử với tử và mẫu với mẫu (ra ${frac(a + c, b + d)}) — đó là sai.`,
      };
    },
  },
  {
    id: 'm4-doidonvi',
    grade: 4,
    level: 2,
    name: 'Đổi đơn vị đo',
    gen(rng) {
      const P = [
        ['tấn', 'kg', 1000],
        ['tạ', 'kg', 100],
        ['yến', 'kg', 10],
        ['km', 'm', 1000],
        ['m', 'cm', 100],
        ['m²', 'dm²', 100],
        ['dm²', 'cm²', 100],
      ];
      const [from, to, f] = rng.pick(P);
      const n = rng.int(2, 9);
      const ans = n * f;
      return {
        q: `${n} ${from} = ? ${to}`,
        ans: `${ans} ${to}`,
        // MỒI NHỬ SỐ 1: dùng hệ số 10 cho mọi đơn vị — sai nặng nhất ở đơn vị DIỆN TÍCH
        wrong: [
          `${n * 10} ${to}`,
          `${ans * 10} ${to}`,
          `${ans / 10} ${to}`,
          `${n + f} ${to}`,
          `${ans / 100} ${to}`,
        ],
        // Chỉ nhắc luật diện tích khi đề THỰC SỰ là đơn vị diện tích — nhắc bừa gây rối.
        why:
          `1 ${from} = ${f} ${to}, nên ${n} ${from} = ${n} × ${f} = ${ans} ${to}.` +
          (from.includes('²')
            ? ' Đơn vị DIỆN TÍCH đổi theo 100, không phải 10 — đây là chỗ hay nhầm nhất.'
            : ''),
      };
    },
  },
  {
    id: 'm4-trungbinh',
    grade: 4,
    level: 3,
    name: 'Trung bình cộng',
    gen(rng) {
      const k = rng.int(3, 4);
      const ans = rng.int(5, 40);
      const xs = [];
      let rest = ans * k;
      for (let i = 0; i < k - 1; i++) {
        const lo = Math.max(1, rest - (k - 1 - i) * (ans * 2));
        const hi = Math.min(ans * 2, rest - (k - 1 - i));
        const v = rng.int(lo, Math.max(lo, hi));
        xs.push(v);
        rest -= v;
      }
      xs.push(rest);
      const sum = ans * k;
      return {
        q: `Trung bình cộng của ${xs.join(', ')} là bao nhiêu?`,
        ans,
        // lỗi thật: quên chia, chia nhầm số lượng
        wrong: [sum, Math.round(sum / (k + 1)), ans + 1, ans - 1, Math.round(sum / (k - 1))],
        why: `Tổng ${xs.join(' + ')} = ${sum}. Có ${k} số nên chia cho ${k}: ${sum} : ${k} = ${ans}.`,
      };
    },
  },

  {
    id: 'm4-nhan2cs',
    grade: 4,
    level: 2,
    name: 'Nhân với số có hai chữ số',
    gen(rng) {
      const a = rng.int(12, 99),
        b = rng.int(11, 29);
      const bd = b % 10,
        bc = Math.floor(b / 10);
      const ans = a * b;
      const quenLui = a * bd + a * bc; // tích riêng thứ hai KHÔNG viết lùi một cột
      return {
        q: `${a} × ${b} = ?`,
        ans,
        // MỒI NHỬ SỐ 1: quên viết tích riêng thứ hai lùi sang trái một cột. Đây là lỗi
        // đặt tính phổ biến nhất khi mới học nhân hai chữ số.
        wrong: [quenLui, ans + a, ans - a, a * bd, ans + b],
        why: `${a} × ${bd} = ${a * bd}. ${a} × ${bc} chục = ${a * bc * 10}. Cộng lại: ${ans}. Quên viết lùi một cột sẽ ra ${quenLui}.`,
      };
    },
  },
  {
    id: 'm4-chia-het',
    grade: 4,
    level: 2,
    name: 'Dấu hiệu chia hết',
    gen(rng) {
      const d = rng.pick([3, 5, 9]); // bỏ dấu hiệu chia hết cho 2: nhìn là thấy, không đố được
      const thuong = rng.int(4, 40);
      const ans = thuong * d;
      // Mồi nhử là các số SÁT NGAY đáp án mà không chia hết — buộc phải dùng dấu hiệu
      // để loại, không đoán được bằng mắt.
      const w = [];
      for (let k = 1; w.length < 5; k++)
        for (const cand of [ans + k, ans - k]) {
          if (w.length >= 5) break;
          if (cand > 0 && cand % d !== 0 && !w.includes(cand)) w.push(cand);
        }
      const dau = {
        3: 'tổng các chữ số chia hết cho 3',
        5: 'chữ số tận cùng là 0 hoặc 5',
        9: 'tổng các chữ số chia hết cho 9',
      }[d];
      return {
        q: `Số nào dưới đây chia hết cho ${d}?`,
        ans,
        wrong: w,
        why: `Dấu hiệu chia hết cho ${d}: ${dau}. Đúng là ${ans} vì ${ans} : ${d} = ${thuong}.`,
      };
    },
  },
  {
    id: 'm4-rut-gon',
    grade: 4,
    level: 2,
    name: 'Rút gọn phân số',
    gen(rng) {
      let n, d, k;
      do {
        k = rng.int(2, 4);
        n = rng.int(1, 8);
        d = rng.int(n + 1, 9);
        // Phân số SAU khi rút gọn phải tối giản, nếu không đề có nhiều đáp án đúng.
      } while (gcd(n, d) !== 1);
      return {
        q: `Rút gọn phân số ${n * k}/${d * k} được phân số nào?`,
        ans: `${n}/${d}`,
        // MỒI NHỬ SỐ 1: chỉ chia TỬ SỐ, để nguyên mẫu số.
        wrong: [
          `${n}/${d * k}`,
          `${n * k}/${d}`,
          `${n * k}/${d * k}`,
          `${n + 1}/${d}`,
          `${n}/${d + 1}`,
        ],
        why: `Phải chia CẢ tử và mẫu cho ${k}: ${n * k} : ${k} = ${n} và ${d * k} : ${k} = ${d}. Vậy được ${n}/${d}. Chỉ chia mỗi tử số là sai.`,
      };
    },
  },
  {
    id: 'm4-so-sanh-ps',
    grade: 4,
    level: 2,
    name: 'So sánh phân số',
    gen(rng) {
      const ds = [];
      while (ds.length < 4) {
        const b = rng.int(2, 12);
        const a = rng.int(1, b - 1);
        if (gcd(a, b) !== 1) continue;
        const v = a / b;
        if (ds.some((t) => Math.abs(t.v - v) < 1e-9)) continue; // hai phân số bằng nhau → vô nghiệm
        ds.push({ s: `${a}/${b}`, v });
      }
      const lon = rng.int(0, 1) === 0;
      ds.sort((x, y) => y.v - x.v);
      const dung = lon ? ds[0] : ds[3];
      return {
        q: `Phân số nào ${lon ? 'LỚN NHẤT' : 'BÉ NHẤT'}?`,
        ans: dung.s,
        // Ba phân số còn lại chính là mồi nhử — trong đó luôn có cái tử số to nhất hoặc
        // mẫu số bé nhất, đúng hai cái bẫy của bài so sánh phân số.
        wrong: ds.filter((t) => t !== dung).map((t) => t.s),
        why: `Quy đồng mẫu số (hoặc so từng phân số với 1/2) rồi mới so được. ${dung.s} là phân số ${lon ? 'lớn' : 'bé'} nhất. Tử số to KHÔNG có nghĩa là phân số lớn — còn phải nhìn mẫu số.`,
      };
    },
  },
  {
    id: 'm4-tru-phanso',
    grade: 4,
    level: 2,
    name: 'Trừ hai phân số khác mẫu',
    gen(rng) {
      let a, b, c, d;
      do {
        b = rng.int(2, 12);
        d = rng.int(2, 12);
        a = rng.int(1, b - 1);
        c = rng.int(1, d - 1);
        // Hiệu phải DƯƠNG (tiểu học chưa học số âm) và phân số trong đề phải tối giản.
      } while (b === d || gcd(a, b) !== 1 || gcd(c, d) !== 1 || a * d <= c * b);
      const num = a * d - c * b,
        den = b * d;
      return {
        q: `${a}/${b} − ${c}/${d} = ?`,
        ans: frac(num, den),
        // MỒI NHỬ SỐ 1: trừ tử với tử, mẫu với mẫu — anh em sinh đôi của lỗi cộng phân số.
        wrong: [
          frac(Math.abs(a - c), Math.abs(b - d)),
          frac(a * d + c * b, den),
          frac(num + 1, den),
          frac(num + 2, den),
          frac(Math.abs(a - c), den),
        ],
        why: `Quy đồng mẫu ${b} và ${d} thành ${den}: ${a}/${b} = ${a * d}/${den}, ${c}/${d} = ${c * b}/${den}. Trừ tử số: ${a * d} − ${c * b} = ${num}. Vậy ${frac(num, den)}. KHÔNG được trừ tử với tử rồi mẫu với mẫu.`,
      };
    },
  },
  {
    id: 'm4-phanso-cua-so',
    grade: 4,
    level: 3,
    name: 'Tìm phân số của một số',
    gen(rng) {
      const b = rng.pick([2, 3, 4, 5, 6, 8]);
      const a = rng.int(1, b - 1);
      const k = rng.int(2, 12);
      const n = b * k;
      const ans = a * k;
      return {
        q: `${a}/${b} của ${n} là bao nhiêu?`,
        ans,
        // MỒI NHỬ SỐ 1: chỉ chia cho mẫu rồi quên nhân với tử.
        wrong: [k, a * n, n - a, Math.round(n / a), ans + k],
        why: `Lấy ${n} : ${b} = ${k} (một phần), rồi nhân với ${a} phần: ${k} × ${a} = ${ans}. Chia xong mà quên nhân tử số sẽ ra ${k}.`,
      };
    },
  },
  {
    id: 'm4-tong-hieu',
    grade: 4,
    level: 3,
    name: 'Tìm hai số biết tổng và hiệu',
    gen(rng) {
      const be = rng.int(5, 40);
      const hieu = rng.int(2, 30);
      const lon = be + hieu;
      const tong = be + lon;
      const hoiLon = rng.int(0, 1) === 0;
      const ans = hoiLon ? lon : be;
      return {
        q: `Hai số có tổng ${tong} và hiệu ${hieu}. Số ${hoiLon ? 'lớn' : 'bé'} là số nào?`,
        ans,
        // MỒI NHỬ SỐ 1: tìm ra rồi trả lời nhầm số kia — bé giải đúng nhưng đọc đề vội.
        wrong: [hoiLon ? be : lon, Math.round(tong / 2), tong - hieu, ans + hieu, ans - hieu],
        why: `Số bé = (tổng − hiệu) : 2 = (${tong} − ${hieu}) : 2 = ${be}. Số lớn = ${be} + ${hieu} = ${lon}. Đề hỏi số ${hoiLon ? 'LỚN' : 'BÉ'} nên đáp án là ${ans}.`,
      };
    },
  },

  // ── LỚP 5 ──────────────────────────────────────────────────────────────────
  {
    id: 'm5-phantram',
    grade: 5,
    level: 2,
    name: 'Tỉ số phần trăm',
    gen(rng) {
      const p = rng.pick([5, 10, 20, 25, 50, 75]);
      const b = rng.int(1, 20) * 20; // bội của 20 → kết quả luôn là số nguyên
      const ans = (p * b) / 100;
      return {
        q: `${p}% của ${b} là bao nhiêu?`,
        ans,
        // MỒI NHỬ SỐ 1: nhân xong quên chia 100
        wrong: [p * b, b - p, ans * 10, ans + p, Math.round(b / p)],
        why: `${p}% của ${b} = ${b} × ${p} : 100 = ${ans}. Nhân xong phải chia 100, nếu quên sẽ ra ${p * b}.`,
      };
    },
  },
  {
    id: 'm5-vantoc',
    grade: 5,
    level: 3,
    name: 'Vận tốc – quãng đường – thời gian',
    gen(rng) {
      const v = rng.int(4, 16) * 5; // 20–80 km/giờ — dưới 20 thì xe cộ đi chậm hơn người đi bộ
      const t = rng.int(2, 8);
      const s = v * t;
      if (rng.int(0, 1) === 0) {
        return {
          q: `Một xe đi với vận tốc ${v} km/giờ trong ${t} giờ. Quãng đường đi được là bao nhiêu?`,
          ans: `${s} km`,
          // MỒI NHỬ SỐ 1: chia thay vì nhân
          wrong: [
            `${Math.round(v / t)} km`,
            `${v + t} km`,
            `${v - t} km`,
            `${s * 2} km`,
            `${Math.round(s / 2)} km`,
          ],
          why: `Quãng đường = vận tốc × thời gian = ${v} × ${t} = ${s} km.`,
        };
      }
      return {
        q: `Một xe đi ${s} km hết ${t} giờ. Vận tốc của xe là bao nhiêu?`,
        ans: `${v} km/giờ`,
        // s = quên chia thời gian · s*t = nhân thay vì chia
        wrong: [
          `${s} km/giờ`,
          `${s * t} km/giờ`,
          `${v + t} km/giờ`,
          `${s - t} km/giờ`,
          `${v * 2} km/giờ`,
        ],
        why: `Vận tốc = quãng đường : thời gian = ${s} : ${t} = ${v} km/giờ.`,
      };
    },
  },
  {
    id: 'm5-thapphan',
    grade: 5,
    level: 3,
    name: 'Nhân số thập phân',
    gen(rng) {
      const x = rng.pick([0.1, 0.2, 0.25, 0.5, 1.5]);
      const n = rng.int(2, 9);
      const ans = r2(x * n);
      return {
        q: `${String(x).replace('.', ',')} × ${n} = ?`,
        ans: String(ans).replace('.', ','),
        // MỒI NHỬ SỐ 1: niềm tin "nhân thì kết quả phải to hơn" → chia ngược lại
        wrong: [
          String(r2(n / x)).replace('.', ','),
          String(r2(ans * 10)).replace('.', ','),
          String(r2(x + n)).replace('.', ','),
          String(n),
          String(r2(ans / 10)).replace('.', ','),
        ],
        why: `${String(x).replace('.', ',')} × ${n} = ${String(ans).replace('.', ',')}. Nhân với số bé hơn 1 thì kết quả NHỎ ĐI — "nhân là phải to hơn" chỉ đúng với số tự nhiên.`,
      };
    },
  },
  {
    id: 'm5-cong-thapphan',
    grade: 5,
    level: 2,
    name: 'Cộng, trừ số thập phân',
    gen(rng) {
      // Tính toàn bộ trên số nguyên "phần mười" rồi mới đổi ra chữ — làm thẳng trên số
      // thực thì 12.5 − 3.4 ra 9.099999999999998 và đáp án hiện ra sai bét.
      const cong = rng.int(0, 1) === 0;
      let x = rng.int(15, 199),
        y = rng.int(11, 140);
      if (!cong && y >= x) [x, y] = [y + 5, x]; // hiệu phải dương
      const kq = cong ? x + y : x - y;
      // MỒI NHỬ SỐ 1: đặt tính thẳng mép phải thay vì thẳng DẤU PHẨY → sai đúng 10 lần.
      const cand = [kq * 10, kq + 10, kq - 10, kq + 1, kq - 1, kq + 2].filter((v) => v > 0);
      return {
        q: `${p10(x)} ${cong ? '+' : '−'} ${p10(y)} = ?`,
        ans: p10(kq),
        wrong: cand.map(p10),
        why: `Đặt tính THẲNG DẤU PHẨY rồi ${cong ? 'cộng' : 'trừ'} như số tự nhiên, dấu phẩy ở kết quả thẳng hàng dấu phẩy phía trên: ${p10(x)} ${cong ? '+' : '−'} ${p10(y)} = ${p10(kq)}.`,
      };
    },
  },
  {
    id: 'm5-chia-thapphan',
    grade: 5,
    level: 3,
    name: 'Chia số thập phân cho số tự nhiên',
    gen(rng) {
      const thuong = rng.int(11, 99); // phần mười
      const b = rng.int(2, 9);
      const a = thuong * b;
      return {
        q: `${p10(a)} : ${b} = ?`,
        ans: p10(thuong),
        // MỒI NHỬ SỐ 1: chia đúng nhưng QUÊN ĐẶT DẤU PHẨY vào thương → to gấp 10 lần.
        wrong: [p10(thuong * 10), p10(a), p10(thuong + 10), p10(thuong + 1), p10(a - b)],
        why: `Chia như chia số tự nhiên, chia hết phần nguyên thì ĐẶT NGAY dấu phẩy vào thương rồi chia tiếp: ${p10(a)} : ${b} = ${p10(thuong)}. Thử lại: ${p10(thuong)} × ${b} = ${p10(a)}.`,
      };
    },
  },
  {
    id: 'm5-dt-tamgiac',
    grade: 5,
    level: 2,
    name: 'Diện tích hình tam giác',
    gen(rng) {
      const a = rng.int(2, 15) * 2; // đáy chẵn → diện tích luôn là số nguyên
      const h = rng.int(2, 20);
      const dt = (a * h) / 2;
      return {
        q: `Tam giác có đáy ${a} cm, chiều cao ${h} cm. Diện tích bằng bao nhiêu?`,
        ans: `${dt} cm²`,
        // MỒI NHỬ SỐ 1: quên chia 2 — lỗi số một của diện tích tam giác.
        wrong: [
          `${a * h} cm²`,
          `${a * h * 2} cm²`,
          `${dt + h} cm²`,
          `${dt + a} cm²`,
          `${a + h} cm²`,
        ],
        why: `Diện tích tam giác = đáy × chiều cao : 2 = ${a} × ${h} : 2 = ${dt} cm². Quên chia 2 sẽ ra ${a * h} cm² — gấp đôi đáp án đúng.`,
      };
    },
  },
  {
    id: 'm5-dt-hinhthang',
    grade: 5,
    level: 3,
    name: 'Diện tích hình thang',
    gen(rng) {
      const a = rng.int(5, 20); // đáy lớn
      const b = rng.int(2, a - 1); // đáy bé — LUÔN nhỏ hơn đáy lớn
      const h = rng.int(1, 9) * 2; // chiều cao chẵn → diện tích nguyên
      const dt = ((a + b) * h) / 2;
      return {
        q: `Hình thang có hai đáy ${a} cm và ${b} cm, cao ${h} cm. Diện tích bằng bao nhiêu?`,
        ans: `${dt} cm²`,
        // MỒI NHỬ SỐ 1: quên chia 2 · SỐ 2: nhân hai đáy với nhau như hình chữ nhật.
        wrong: [
          `${(a + b) * h} cm²`,
          `${a * b} cm²`,
          `${dt * 4} cm²`,
          `${dt + h} cm²`,
          `${a + b + h} cm²`,
        ],
        why: `Diện tích hình thang = (đáy lớn + đáy bé) × chiều cao : 2 = (${a} + ${b}) × ${h} : 2 = ${dt} cm². Quên chia 2 sẽ ra ${(a + b) * h} cm².`,
      };
    },
  },
  {
    id: 'm5-hinhtron',
    grade: 5,
    level: 3,
    name: 'Chu vi và diện tích hình tròn',
    gen(rng) {
      const r = rng.int(2, 12);
      const cv = r2(2 * r * 3.14),
        dt = r2(r * r * 3.14);
      if (rng.int(0, 1) === 0) {
        return {
          q: `Hình tròn bán kính ${r} cm. Chu vi bằng bao nhiêu? (lấy π = 3,14)`,
          ans: `${pt(cv)} cm`,
          // MỒI NHỬ SỐ 1: dùng công thức diện tích — hai công thức rất dễ lẫn.
          wrong: [
            `${pt(dt)} cm`,
            `${pt(r * 3.14)} cm`,
            `${pt(cv * 2)} cm`,
            `${pt(2 * r)} cm`,
            `${pt(cv / 2)} cm`,
          ],
          why: `Chu vi = 2 × bán kính × 3,14 = 2 × ${r} × 3,14 = ${pt(cv)} cm. Lấy ${r} × ${r} × 3,14 = ${pt(dt)} là DIỆN TÍCH.`,
        };
      }
      return {
        q: `Hình tròn bán kính ${r} cm. Diện tích bằng bao nhiêu? (lấy π = 3,14)`,
        ans: `${pt(dt)} cm²`,
        wrong: [
          `${pt(cv)} cm²`,
          `${pt(cv * 2)} cm²`,
          `${pt(dt * 2)} cm²`,
          `${pt(r * r)} cm²`,
          `${pt(dt / 2)} cm²`,
        ],
        why: `Diện tích = bán kính × bán kính × 3,14 = ${r} × ${r} × 3,14 = ${pt(dt)} cm². Lấy 2 × ${r} × 3,14 = ${pt(cv)} là CHU VI.`,
      };
    },
  },
  {
    id: 'm5-thetich',
    grade: 5,
    level: 3,
    name: 'Thể tích hình hộp chữ nhật',
    gen(rng) {
      const a = rng.int(2, 12),
        b = rng.int(2, 12),
        c = rng.int(2, 12);
      const v = a * b * c;
      return {
        q: `Hình hộp chữ nhật dài ${a} cm, rộng ${b} cm, cao ${c} cm. Thể tích bằng bao nhiêu?`,
        ans: `${v} cm³`,
        // MỒI NHỬ SỐ 1: dừng ở diện tích ĐÁY, quên nhân chiều cao.
        wrong: [
          `${a * b} cm³`,
          `${v * 2} cm³`,
          `${v + a} cm³`,
          `${2 * (a + b) * c} cm³`,
          `${a + b + c} cm³`,
        ],
        why: `Thể tích = dài × rộng × cao = ${a} × ${b} × ${c} = ${v} cm³. Lấy ${a} × ${b} = ${a * b} mới chỉ là DIỆN TÍCH ĐÁY, còn thiếu nhân chiều cao.`,
      };
    },
  },
  {
    id: 'm5-tim-so-phantram',
    grade: 5,
    level: 3,
    name: 'Tìm một số biết giá trị phần trăm của nó',
    gen(rng) {
      const p = rng.pick([10, 20, 25, 50]);
      const ans = rng.int(2, 40) * 20; // bội của 20 → giá trị phần trăm luôn nguyên
      const phan = (ans * p) / 100;
      return {
        q: `${p}% của một số là ${phan}. Số đó là số nào?`,
        ans,
        // MỒI NHỬ SỐ 1: làm ngược chiều — nhân với phần trăm thay vì chia.
        wrong: [phan * p, Math.round(phan / p), phan, ans + phan, Math.round(ans / 2)],
        why: `Làm ngược lại phép tính phần trăm: ${phan} : ${p} × 100 = ${ans}. Kiểm lại: ${p}% của ${ans} đúng bằng ${phan}.`,
      };
    },
  },
];

const BY_ID = Object.fromEntries(MATH_TEMPLATES.map((t) => [t.id, t]));

// Danh sách id hợp lệ cho một lớp. maxLevel giới hạn độ khó trong lớp đó.
export function mathIds(grade, maxLevel = 3) {
  return MATH_TEMPLATES.filter((t) => t.grade === grade && t.level <= maxLevel).map((t) => t.id);
}

// Sinh một câu hoàn chỉnh từ id khuôn. rng là bộ gieo hạt (core/rng.js) → cùng
// hạt luôn ra cùng câu, nên test được và chia sẻ được "mê cung y hệt" giữa hai máy.
export function genMath(id, rng) {
  const t = BY_ID[id];
  if (!t) throw new Error('Không có khuôn toán: ' + id);
  const r = t.gen(rng);
  const correct = String(r.ans);
  const opts = [correct];

  const ansNum = Number(r.ans);
  const ansIsNonNegNum = Number.isFinite(ansNum) && ansNum >= 0;
  for (const w of r.wrong) {
    if (opts.length === 4) break;
    const s = String(w);
    if (opts.includes(s)) continue;
    // Đáp án âm là vô nghĩa ở tiểu học — bé loại trừ được ngay, mồi nhử mất tác dụng.
    if (ansIsNonNegNum && Number.isFinite(Number(w)) && Number(w) < 0) continue;
    opts.push(s);
  }
  // ponytail: đệm khi mồi nhử trùng nhau. Chỉ chạy với đáp án dạng số; khuôn trả
  // chuỗi (phân số, có đơn vị) phải tự cấp đủ 5 mồi nhử phân biệt — test canh việc đó.
  for (let d = 1; opts.length < 4 && d < 60; d++) {
    for (const cand of [ansNum + d, ansNum - d]) {
      if (opts.length === 4) break;
      if (!Number.isFinite(cand) || (ansIsNonNegNum && cand < 0)) continue;
      const s = String(cand);
      if (!opts.includes(s)) opts.push(s);
    }
  }
  if (opts.length < 4) throw new Error('Khuôn ' + id + ' không đủ 4 đáp án phân biệt');

  // Trộn Fisher–Yates bằng rng gieo hạt, rồi tìm lại vị trí đáp án đúng.
  for (let i = opts.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return {
    id,
    subject: 'math',
    grade: t.grade,
    level: t.level,
    q: r.q,
    a: opts,
    k: opts.indexOf(correct),
    why: r.why,
  };
}
