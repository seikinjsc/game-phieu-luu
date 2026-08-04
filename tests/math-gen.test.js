import { describe, it, expect } from 'vitest';
import { makeRng } from '../src/core/rng.js';
import { MATH_TEMPLATES, mathIds, genMath } from '../src/data/questions/math-gen.js';

const BY_ID = (id) => MATH_TEMPLATES.find((t) => t.id === id);

// Sinh N mẫu của một khuôn với hạt cố định → tất định, lỗi tái hiện được.
const samples = (id, N = 300, seed = 12345) => {
  const rng = makeRng(seed);
  return Array.from({ length: N }, () => genMath(id, rng));
};

describe('math-gen: hợp đồng chung của mọi khuôn', () => {
  for (const t of MATH_TEMPLATES) {
    it(`${t.id} — luôn ra 4 đáp án phân biệt, k đúng chỗ, có lời giải`, () => {
      for (const c of samples(t.id, 200)) {
        expect(c.a).toHaveLength(4);
        expect(new Set(c.a).size).toBe(4); // không được có 2 lựa chọn trùng nhau
        expect(c.k).toBeGreaterThanOrEqual(0);
        expect(c.k).toBeLessThan(4);
        expect(c.q.length).toBeGreaterThan(3);
        // `why` là bắt buộc: không có lời giải thì chỉ là đố vui, không dạy được gì
        expect(c.why.length).toBeGreaterThan(10);
        expect(c.grade).toBe(t.grade);
      }
    });

    it(`${t.id} — không có đáp án âm khi kết quả không âm`, () => {
      for (const c of samples(t.id, 200)) {
        const ans = Number(c.a[c.k]);
        if (!Number.isFinite(ans) || ans < 0) continue;
        for (const o of c.a) {
          const v = Number(o);
          if (Number.isFinite(v)) expect(v).toBeGreaterThanOrEqual(0);
        }
      }
    });
  }

  it('cùng hạt → cùng câu (tất định, chia sẻ được giữa hai máy)', () => {
    const a = genMath('m2-cong-nho', makeRng(7));
    const b = genMath('m2-cong-nho', makeRng(7));
    expect(a).toEqual(b);
    expect(genMath('m2-cong-nho', makeRng(8))).not.toEqual(a);
  });

  it('id khuôn không tồn tại thì báo lỗi, không trả câu rác', () => {
    expect(() => genMath('khong-co-that', makeRng(1))).toThrow();
  });
});

// ─── Ràng buộc theo Chương trình GDPT 2018. Đây là lý do tệp test này tồn tại. ───
describe('math-gen: bám đúng miền số của từng lớp', () => {
  it('lớp 1 — cộng KHÔNG NHỚ, tổng trong phạm vi 100', () => {
    for (const c of samples('m1-cong', 400)) {
      const [, a, b] = c.q.match(/^(\d+) \+ (\d+) = \?$/).map(Number);
      expect((a % 10) + (b % 10)).toBeLessThanOrEqual(9); // không nhớ hàng đơn vị
      expect(Math.floor(a / 10) + Math.floor(b / 10)).toBeLessThanOrEqual(9);
      expect(a + b).toBeLessThanOrEqual(100);
    }
  });

  it('lớp 1 — trừ KHÔNG MƯỢN, kết quả không âm', () => {
    for (const c of samples('m1-tru', 400)) {
      const [, a, b] = c.q.match(/^(\d+) − (\d+) = \?$/).map(Number);
      expect(a % 10).toBeGreaterThanOrEqual(b % 10); // không mượn hàng đơn vị
      expect(Math.floor(a / 10)).toBeGreaterThanOrEqual(Math.floor(b / 10));
      expect(a - b).toBeGreaterThan(0);
    }
  });

  it('lớp 2 — cộng có nhớ ĐÚNG 1 LƯỢT, không phải 2', () => {
    for (const c of samples('m2-cong-nho', 400)) {
      const [, a, b] = c.q.match(/^(\d+) \+ (\d+) = \?$/).map(Number);
      expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10); // có nhớ
      expect(Math.floor(a / 10) + Math.floor(b / 10) + 1).toBeLessThanOrEqual(9); // không nhớ lượt 2
      expect(a + b).toBeLessThanOrEqual(1000);
    }
  });

  it('lớp 2 — nhân/chia CHỈ dùng bảng 2 và 5', () => {
    for (const c of samples('m2-nhan', 300)) {
      const b = Number(c.q.match(/× (\d+)/)[1]);
      expect([2, 5]).toContain(b);
    }
    for (const c of samples('m2-chia', 300)) {
      const b = Number(c.q.match(/: (\d+)/)[1]);
      expect([2, 5]).toContain(b);
    }
  });

  it('lớp 3 — nhân/chia với số có ĐÚNG một chữ số', () => {
    for (const c of samples('m3-nhan1cs', 300)) {
      expect(Number(c.q.match(/× (\d+)/)[1])).toBeLessThanOrEqual(9);
    }
    for (const c of samples('m3-chia1cs', 300)) {
      expect(Number(c.q.match(/: (\d+)/)[1])).toBeLessThanOrEqual(9);
    }
  });

  it('lớp 4 — mẫu số phân số không vượt quá 12', () => {
    for (const c of samples('m4-phanso', 300)) {
      const [, , b, , d] = c.q.match(/^(\d+)\/(\d+) \+ (\d+)\/(\d+) = \?$/).map(Number);
      expect(b).toBeLessThanOrEqual(12);
      expect(d).toBeLessThanOrEqual(12);
    }
  });

  // Ba ràng buộc dưới đây là lỗi thật đã lọt qua vòng test đầu, chỉ lộ ra khi đọc
  // câu sinh ra bằng mắt. Giữ test để chúng không quay lại.
  it('lớp 3 hình — chiều rộng LUÔN nhỏ hơn chiều dài (đề không tự mâu thuẫn)', () => {
    for (const c of samples('m3-hinh', 400)) {
      const [, w, h] = c.q.match(/dài (\d+) cm, rộng (\d+) cm/).map(Number);
      expect(h).toBeLessThan(w);
    }
  });

  it('lớp 3 nhân — phép nhân LUÔN có nhớ, mồi nhử "quên nhớ" luôn khác đáp án', () => {
    // Nhớ có thể sinh ra ở hàng đơn vị HOẶC hàng chục (vd 30 × 4). Bất biến đúng là:
    // kết quả "quên nhớ" phải khác kết quả đúng — nếu bằng nhau thì phép nhân không
    // có nhớ, khuôn chẳng dạy gì.
    const quenNho = (a, b) => {
      let out = 0,
        x = a,
        p = 1;
      while (x > 0) {
        out += (((x % 10) * b) % 10) * p;
        x = Math.floor(x / 10);
        p *= 10;
      }
      return out;
    };
    for (const c of samples('m3-nhan1cs', 400)) {
      const [, a, b] = c.q.match(/^(\d+) × (\d+) = \?$/).map(Number);
      const sai = quenNho(a, b);
      expect(sai).toBeGreaterThan(0);
      expect(sai).not.toBe(a * b);
      expect(c.a).toContain(String(sai)); // mồi nhử số 1 luôn có mặt
      expect(c.a).not.toContain('0');
    }
  });

  it('lớp 4 phân số — phân số trong ĐỀ luôn tối giản (SGK không viết "2/4")', () => {
    const gcd = (x, y) => (y ? gcd(y, x % y) : x);
    for (const c of samples('m4-phanso', 400)) {
      const [, a, b, cc, d] = c.q.match(/^(\d+)\/(\d+) \+ (\d+)\/(\d+) = \?$/).map(Number);
      expect(gcd(a, b)).toBe(1);
      expect(gcd(cc, d)).toBe(1);
    }
  });

  it('lớp 5 vận tốc — vận tốc xe hợp lý (≥ 20 km/giờ)', () => {
    for (const c of samples('m5-vantoc', 300)) {
      // Hai biến thể: hỏi quãng đường (vận tốc nằm trong đề) hoặc hỏi vận tốc (nằm ở đáp án).
      const m = c.q.match(/vận tốc (\d+) km\/giờ/);
      const v = Number((m ? m[1] : c.a[c.k]).toString().match(/\d+/)[0]);
      expect(v).toBeGreaterThanOrEqual(20);
    }
  });

  it('lớp 1 — bậc nhẩm luôn nằm trong phạm vi 10', () => {
    for (const c of samples('m1-nham', 400)) {
      const m = c.q.match(/^(\d+) ([+−]) (\d+) = \?$/);
      const [a, dau, b] = [Number(m[1]), m[2], Number(m[3])];
      expect(a).toBeLessThanOrEqual(10);
      expect(b).toBeLessThanOrEqual(10);
      expect(dau === '+' ? a + b : a - b).toBeGreaterThanOrEqual(0);
      expect(dau === '+' ? a + b : a - b).toBeLessThanOrEqual(10);
    }
  });

  it('lớp 1 — so sánh số: luôn có CẶP ĐẢO CHỮ SỐ làm bẫy, mọi lựa chọn ≤ 99', () => {
    for (const c of samples('m1-sosanh', 400)) {
      const so = c.a.map(Number);
      expect(new Set(so).size).toBe(4);
      for (const v of so) expect(v).toBeLessThanOrEqual(99);
      const dung = Number(c.a[c.k]);
      expect(c.q.includes('LỚN NHẤT') ? Math.max(...so) : Math.min(...so)).toBe(dung);
      // trong bộ phải tồn tại một cặp đảo chữ số (37/73) — đó là mồi nhử tự nhiên
      const coCapDao = so.some((v) =>
        so.includes(Number(String(v).split('').reverse().join('')))
          ? String(v).length === 2 &&
            so.includes(Number(String(v).split('').reverse().join(''))) &&
            v !== Number(String(v).split('').reverse().join(''))
          : false,
      );
      expect(coCapDao).toBe(true);
    }
  });

  it('lớp 2 — trừ có nhớ ĐÚNG 1 LƯỢT, kết quả không âm', () => {
    for (const c of samples('m2-tru-nho', 400)) {
      const [, a, b] = c.q.match(/^(\d+) − (\d+) = \?$/).map(Number);
      expect(a % 10).toBeLessThan(b % 10); // hàng đơn vị phải mượn
      expect(Math.floor(a / 10)).toBeGreaterThan(Math.floor(b / 10)); // mượn xong không âm
      expect(a - b).toBeGreaterThan(0);
      expect(a).toBeLessThanOrEqual(100);
    }
  });

  it('lớp 2 trừ — luôn có mồi nhử "trừ ngược cho khỏi mượn"', () => {
    for (const c of samples('m2-tru-nho', 300)) {
      const [, a, b] = c.q.match(/^(\d+) − (\d+) = \?$/).map(Number);
      const nguoc = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + ((b % 10) - (a % 10));
      expect(c.a).toContain(String(nguoc));
    }
  });

  // Không chốt cứng danh sách id nữa — thêm khuôn mới là việc thường xuyên, mà chốt cứng
  // thì mỗi lần thêm lại phải sửa test, dễ sinh thói sửa test cho xanh.
  it('mathIds lọc đúng theo lớp và mức', () => {
    for (let lop = 1; lop <= 5; lop++) {
      const ds = mathIds(lop);
      expect(ds.length, `lớp ${lop}`).toBe(MATH_TEMPLATES.filter((t) => t.grade === lop).length);
      for (const id of ds) expect(BY_ID(id).grade, id).toBe(lop);
    }
    const de = mathIds(2, 1); // maxLevel = 1 → mức 2 và 3 bị loại
    expect(de.length).toBeGreaterThan(0);
    expect(de.length).toBeLessThan(mathIds(2).length);
    for (const id of de) expect(BY_ID(id).level, id).toBeLessThanOrEqual(1);
    expect(mathIds(9)).toEqual([]); // chưa có khuôn THCS — không được ném lỗi
  });

  // Hộp Leitner chống lặp bằng cửa sổ = số khuôn / 2. Lớp nào chỉ có 3 khuôn thì cửa sổ
  // chỉ rộng 1 — đi vài cửa là gặp lại đúng kỹ năng cũ. Nay sai còn mất tim nên bé sẽ
  // học thuộc dạng thay vì học kỹ năng. Bảy khuôn mỗi lớp là mức sàn.
  it('mỗi lớp có ít nhất 7 khuôn — đủ đa dạng để hộp Leitner giãn cách được', () => {
    for (let lop = 1; lop <= 5; lop++)
      expect(mathIds(lop).length, `lớp ${lop}`).toBeGreaterThanOrEqual(7);
  });

  it('id khuôn không trùng nhau', () => {
    const s = new Set(MATH_TEMPLATES.map((t) => t.id));
    expect(s.size).toBe(MATH_TEMPLATES.length);
  });
});

// ─── Mồi nhử phải là LỖI SAI THẬT, không phải số ngẫu nhiên. ───
describe('math-gen: mồi nhử là lỗi sai điển hình', () => {
  it('lớp 2 cộng có nhớ — luôn có phương án "quên nhớ 1" (thiếu đúng 10)', () => {
    for (const c of samples('m2-cong-nho', 300)) {
      const ans = Number(c.a[c.k]);
      expect(c.a).toContain(String(ans - 10));
    }
  });

  it('lớp 3 hình — chu vi có mồi nhử là diện tích, và ngược lại', () => {
    for (const c of samples('m3-hinh', 300)) {
      const [, w, h] = c.q.match(/dài (\d+) cm, rộng (\d+) cm/).map(Number);
      const cv = 2 * (w + h),
        dt = w * h;
      if (c.q.includes('Chu vi')) {
        expect(c.a[c.k]).toBe(`${cv} cm`);
        if (dt !== cv) expect(c.a).toContain(`${dt} cm`); // nhầm sang diện tích
      } else {
        expect(c.a[c.k]).toBe(`${dt} cm²`);
        if (dt !== cv) expect(c.a).toContain(`${cv} cm²`); // nhầm sang chu vi
      }
    }
  });

  it('lớp 4 phân số — luôn có mồi nhử "cộng tử với tử, mẫu với mẫu"', () => {
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const frac = (n, d) => {
      const g = gcd(n, d) || 1;
      return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
    };
    let seen = 0;
    for (const c of samples('m4-phanso', 300)) {
      const [, a, b, cc, d] = c.q.match(/^(\d+)\/(\d+) \+ (\d+)\/(\d+) = \?$/).map(Number);
      const naive = frac(a + cc, b + d);
      if (naive === c.a[c.k]) continue; // trùng đáp án đúng thì không dùng làm mồi nhử được
      expect(c.a).toContain(naive);
      seen++;
    }
    expect(seen).toBeGreaterThan(250); // đại đa số trường hợp phải có mồi nhử này
  });

  it('lớp 5 thập phân — luôn có mồi nhử "nhân thì phải to hơn"', () => {
    for (const c of samples('m5-thapphan', 200)) {
      const ans = Number(c.a[c.k].replace(',', '.'));
      const bigger = c.a.some((o) => Number(o.replace(',', '.')) > ans);
      expect(bigger).toBe(true);
    }
  });
});
