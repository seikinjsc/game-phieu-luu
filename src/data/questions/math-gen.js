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
