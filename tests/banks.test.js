import { describe, it, expect } from 'vitest';
import { BO_DE, timBoDe, capHopLe } from '../src/data/banks.js';
import { taoBoDe } from '../src/data/questions/bank.js';
import { TRANG_NGUYEN } from '../src/data/questions/trang-nguyen.js';
import { OLYMPIA } from '../src/data/questions/olympia.js';
import { makeRng } from '../src/core/rng.js';

describe('data/banks: sổ đăng ký bộ đề', () => {
  it('mọi bộ đề đều đủ ba thứ giao diện chung: capDo · ids · sinh', () => {
    for (const b of BO_DE) {
      expect(b.id, 'id').toBeTruthy();
      expect(b.ten.length).toBeGreaterThan(2);
      expect(b.mo.length).toBeGreaterThan(5);
      expect(b.capDo.length).toBeGreaterThan(0);
      expect(typeof b.ids).toBe('function');
      expect(typeof b.sinh).toBe('function');
    }
  });

  it('id bộ đề không trùng nhau', () => {
    const s = new Set(BO_DE.map((b) => b.id));
    expect(s.size).toBe(BO_DE.length);
  });

  // Đây là hợp đồng khiến mecung.js không cần biết bộ nào sinh máy, bộ nào chép tay.
  it('MỌI bộ đề, MỌI cấp độ đều sinh ra câu hỏi hợp lệ', () => {
    const rng = makeRng(2026);
    for (const b of BO_DE)
      for (const c of b.capDo) {
        const ids = b.ids(c.id);
        expect(ids.length, `${b.id}/${c.id}`).toBeGreaterThan(0);
        for (const id of ids.slice(0, 12)) {
          const q = b.sinh(id, rng);
          expect(q.a, `${b.id}/${id}`).toHaveLength(4);
          expect(new Set(q.a).size, `${b.id}/${id} trùng lựa chọn`).toBe(4);
          expect(q.k).toBeGreaterThanOrEqual(0);
          expect(q.k).toBeLessThan(4);
          expect(q.q.length).toBeGreaterThan(5);
          expect(q.why.length, `${b.id}/${id} thiếu lời giải`).toBeGreaterThan(8);
        }
      }
  });

  it('câu hỏi KHÔNG dài quá khung màn hình (đề ≤ 150, lựa chọn ≤ 34 ký tự)', () => {
    const rng = makeRng(7);
    for (const b of BO_DE)
      for (const c of b.capDo)
        for (const id of b.ids(c.id)) {
          const q = b.sinh(id, rng);
          expect(q.q.length, `${b.id}/${id}: "${q.q}"`).toBeLessThanOrEqual(150);
          for (const o of q.a) expect(o.length, `${b.id}/${id}: "${o}"`).toBeLessThanOrEqual(34);
        }
  });

  it('cấp độ không còn tồn tại thì rơi về cấp đầu, không để game kẹt', () => {
    const tn = timBoDe('trangnguyen');
    expect(capHopLe(tn, '5')).toBe(tn.capDo[0].id); // '5' là lớp của bộ Toán, vô nghĩa ở đây
    expect(capHopLe(tn, 'dochu')).toBe('dochu');
    expect(timBoDe('khong-co-that').id).toBe(BO_DE[0].id);
  });
});

describe('questions/bank: biến tự luận thành trắc nghiệm', () => {
  // Nhóm test này kiểm PHẦN SINH TỰ ĐỘNG nên bật cờ. Bộ đề thật thì phải viết tay mồi nhử.
  const bo = (cau) =>
    taoBoDe({ id: 'thu', ten: 'Thử', mo: 'bộ thử nghiệm', cau, nhom: [], tuSinhMoiNhu: true });

  it('đáp án đúng LUÔN nằm trong 4 lựa chọn, và k chỉ đúng nó', () => {
    const b = bo(
      Array.from({ length: 8 }, (_, i) => ({ id: 'c' + i, q: 'Câu hỏi số ' + i, ans: 'Đáp' + i })),
    );
    const rng = makeRng(1);
    for (const id of b.ids()) {
      const q = b.sinh(id, rng);
      expect(q.a[q.k]).toBe(b.ids().indexOf(id) >= 0 ? q.a[q.k] : null);
      expect(q.a).toContain('Đáp' + id.slice(1));
      expect(q.a[q.k]).toBe('Đáp' + id.slice(1));
    }
  });

  // Nếu đáp án đúng là số mà ba mồi nhử là chữ thì bé khoanh trúng ngay chẳng cần biết gì.
  it('MỒI NHỬ CÙNG KIỂU: số đi với số, chữ đi với chữ', () => {
    const cau = [
      ...['12', '25', '37', '48', '59', '66'].map((v, i) => ({
        id: 's' + i,
        q: 'Số nào đây ' + i + '?',
        ans: v,
      })),
      ...['Hà Nội', 'Huế', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'].map((v, i) => ({
        id: 't' + i,
        q: 'Thành phố nào đây ' + i + '?',
        ans: v,
      })),
    ];
    const b = bo(cau);
    const rng = makeRng(5);
    const laSo = (s) => /^\d+$/.test(s);
    for (const id of b.ids()) {
      const q = b.sinh(id, rng);
      const kieuDung = laSo(q.a[q.k]);
      for (const o of q.a) expect(laSo(o), `"${q.a[q.k]}" lẫn với "${o}"`).toBe(kieuDung);
    }
  });

  // Lấy "Bút chì" làm mồi nhử cho câu đố con khỉ thì bé loại trừ ngay, chẳng cần nghĩ.
  it('MỒI NHỬ CÙNG NHÓM: đố con vật thì mồi nhử cũng phải là con vật', () => {
    const tn = timBoDe('trangnguyen');
    const rng = makeRng(3);
    const nhomCua = Object.fromEntries(TRANG_NGUYEN.map((c) => [c.ans, c.nhom]));
    for (const nhom of ['convat', 'dochu', 'dodung'])
      for (const id of tn.ids(nhom)) {
        const q = tn.sinh(id, rng);
        for (const o of q.a)
          expect(nhomCua[o], `nhóm ${nhom}: "${q.a[q.k]}" lẫn với "${o}"`).toBe(nhom);
      }
  });

  it('cùng một câu, hạt khác nhau cho thứ tự lựa chọn khác nhau (không thuộc vị trí)', () => {
    const b = bo(
      Array.from({ length: 12 }, (_, i) => ({
        id: 'c' + i,
        q: 'Hỏi gì đó ' + i,
        ans: 'Trả lời ' + i,
      })),
    );
    const bo1 = b.sinh('c0', makeRng(1)).a.join('|');
    const bo2 = b.sinh('c0', makeRng(99)).a.join('|');
    expect(bo1).not.toBe(bo2);
  });

  it('cùng hạt → cùng câu y hệt (tất định)', () => {
    const b = bo(
      Array.from({ length: 8 }, (_, i) => ({ id: 'c' + i, q: 'Hỏi ' + i, ans: 'Đáp ' + i })),
    );
    expect(b.sinh('c3', makeRng(4))).toEqual(b.sinh('c3', makeRng(4)));
  });

  it('bộ đề TÍ HON (chỉ 2 câu) vẫn ra đủ 4 lựa chọn, không vỡ', () => {
    const b = bo([
      { id: 'a', q: 'Câu hỏi thứ nhất?', ans: 'Một' },
      { id: 'b', q: 'Câu hỏi thứ hai?', ans: 'Hai' },
    ]);
    const q = b.sinh('a', makeRng(1));
    expect(q.a).toHaveLength(4);
    expect(new Set(q.a).size).toBe(4);
    expect(q.a[q.k]).toBe('Một');
  });

  it('id không có thật thì báo lỗi rõ ràng', () => {
    expect(() => bo([{ id: 'a', q: 'Câu hỏi?', ans: 'X' }]).sinh('zzz', makeRng(1))).toThrow(/zzz/);
  });

  it('thiếu lời giải thì tự sinh câu nói rõ đáp án — không để trống', () => {
    const q = bo([
      { id: 'a', q: 'Thủ đô nước ta?', ans: 'Hà Nội' },
      { id: 'b', q: 'Sông dài nhất?', ans: 'Mê Kông' },
    ]).sinh('a', makeRng(1));
    expect(q.why).toContain('Hà Nội');
  });
});

describe('dữ liệu nguồn', () => {
  it('Trạng Nguyên: id không trùng, mọi câu có nhóm và đáp án ngắn gọn', () => {
    const ids = new Set();
    for (const c of TRANG_NGUYEN) {
      expect(ids.has(c.id), c.id).toBe(false);
      ids.add(c.id);
      expect(c.nhom).toBeTruthy();
      expect(c.ans.length).toBeLessThanOrEqual(20);
      expect(c.q.length).toBeGreaterThan(15);
    }
    expect(TRANG_NGUYEN.length).toBeGreaterThan(35);
  });

  it('mỗi nhóm Trạng Nguyên có đủ câu để làm mồi nhử cho nhau (≥ 5)', () => {
    for (const n of ['convat', 'dochu', 'dodung'])
      expect(TRANG_NGUYEN.filter((c) => c.nhom === n).length, n).toBeGreaterThanOrEqual(5);
  });

  it('Olympia: mọi câu có đủ 3 mồi nhử VIẾT TAY, không trùng đáp án', () => {
    expect(OLYMPIA.length).toBeGreaterThan(40);
    const ids = new Set();
    for (const c of OLYMPIA) {
      expect(ids.has(c.id), c.id).toBe(false);
      ids.add(c.id);
      expect(Array.isArray(c.sai), `${c.id} thiếu mồi nhử`).toBe(true);
      expect(c.sai.length, c.id).toBe(3);
      expect(new Set(c.sai).size, `${c.id} mồi nhử trùng nhau`).toBe(3);
      expect(c.sai, `${c.id} mồi nhử trùng đáp án`).not.toContain(c.ans);
      expect(c.nhom, `${c.id} thiếu nhóm`).toBeTruthy();
    }
  });

  // BA LỖI THẬT người dùng chụp màn hình báo. Mỗi lỗi một phép canh riêng.
  it('KHÔNG câu nào có đáp án nằm sẵn trong đề bài', () => {
    // Phép canh này bắt luôn cả dạng "A hay B": "…đo trí thông minh sáng tạo hay trí thông
    // minh CẢM XÚC?" thì đáp án nằm ngay trong đề nên bị bắt. Không cần canh riêng chữ "hay"
    // — "dù thức hay ngủ" là tiếng Việt bình thường, canh chữ đó sẽ báo động giả.
    for (const c of [...OLYMPIA, ...TRANG_NGUYEN]) {
      // đáp án chép nguyên vào đề (trừ câu đố chữ, vốn cố ý nhắc lại một phần)
      if (c.nhom !== 'dochu')
        expect(
          c.q.toLowerCase().includes(c.ans.toLowerCase()),
          `${c.id}: đáp án "${c.ans}" nằm trong đề`,
        ).toBe(false);
    }
  });

  it('KHÔNG câu nào bê sẵn danh sách lựa chọn a./b./c. vào đề bài', () => {
    for (const c of [...OLYMPIA, ...TRANG_NGUYEN]) {
      expect(c.q, `${c.id}: có a./b./c. trong đề`).not.toMatch(
        /\b[a-dA-D][.)]\s+\S+.*\b[b-dB-D][.)]\s/,
      );
      expect(c.q, `${c.id}: liệt kê lựa chọn sau dấu hai chấm`).not.toMatch(
        /:\s*\S+,\s*\S+,\s*\S+\?/,
      );
    }
  });

  it('KHÔNG câu nào là dạng điền vào chỗ trống', () => {
    for (const c of [...OLYMPIA, ...TRANG_NGUYEN])
      expect(c.q, `${c.id}: dạng điền chỗ trống`).not.toMatch(/\.{3,}|…\s*\?*$/);
  });

  it('đề bài và mọi lựa chọn đủ ngắn để vừa màn hình', () => {
    for (const c of OLYMPIA) {
      expect(c.q.length, `${c.id}: "${c.q}"`).toBeLessThanOrEqual(80);
      for (const o of [c.ans, ...c.sai])
        expect(o.length, `${c.id}: "${o}"`).toBeLessThanOrEqual(30);
    }
  });

  it('mỗi nhóm Olympia có ít nhất 5 câu để chơi được ra hồn', () => {
    const dem = {};
    for (const c of OLYMPIA) dem[c.nhom] = (dem[c.nhom] || 0) + 1;
    for (const [n, s] of Object.entries(dem)) expect(s, `nhóm ${n}`).toBeGreaterThanOrEqual(5);
  });
});

describe('luật cứng: mồi nhử phải do người viết', () => {
  it('bộ đề thiếu `sai` mà KHÔNG bật cờ thì NÉM LỖI ngay lúc nạp, không âm thầm bịa', () => {
    expect(() =>
      taoBoDe({
        id: 'hong',
        ten: 'Hỏng',
        mo: 'thiếu mồi nhử',
        nhom: [],
        cau: [{ id: 'a', q: 'Câu hỏi gì đó?', ans: 'X' }],
      }),
    ).toThrow(/thiếu mồi nhử/);
  });

  it('thông báo lỗi phải chỉ rõ câu nào thiếu, để sửa được ngay', () => {
    try {
      taoBoDe({
        id: 'hong',
        ten: 'Hỏng',
        mo: 'thiếu mồi nhử',
        nhom: [],
        cau: [
          { id: 'cau-so-7', q: 'Câu hỏi gì đó?', ans: 'X' },
          { id: 'ok', q: 'Câu này ổn?', ans: 'Y', sai: ['a', 'b', 'c'] },
        ],
      });
      throw new Error('lẽ ra phải ném lỗi');
    } catch (e) {
      expect(e.message).toContain('cau-so-7');
      expect(e.message).not.toContain('ok,'); // câu đủ mồi nhử thì không bị nêu tên
    }
  });

  it('mồi nhử viết tay ĐƯỢC DÙNG NGUYÊN VĂN, không bị máy thay bằng thứ khác', () => {
    const b = taoBoDe({
      id: 'tay',
      ten: 'Tay',
      mo: 'viết tay',
      nhom: [],
      cau: [
        { id: 'a', q: 'Thủ đô nước ta?', ans: 'Hà Nội', sai: ['Huế', 'Đà Nẵng', 'Cần Thơ'] },
        { id: 'b', q: 'Sông dài nhất?', ans: 'Mê Kông', sai: ['Sông Hồng', 'Sông Mã', 'Sông Đà'] },
      ],
    });
    const q = b.sinh('a', makeRng(9));
    expect(new Set(q.a)).toEqual(new Set(['Hà Nội', 'Huế', 'Đà Nẵng', 'Cần Thơ']));
    expect(q.a[q.k]).toBe('Hà Nội');
  });
});
