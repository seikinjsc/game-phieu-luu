// data/questions/bank.js — HẠ TẦNG cho các bộ đề TĨNH (chép từ tài liệu có sẵn).
//
// VẤN ĐỀ CẦN GIẢI: mọi tài liệu thật (Olympia, Trạng Nguyên, đề thi) đều ở dạng
// "câu hỏi → đáp án", tức là TỰ LUẬN NGẮN. Còn màn hình game chỉ có 4 nút bấm.
// Bắt bé gõ đáp án thì phải chấm chính tả, dấu, viết hoa — đã cắt từ đầu (ME-CUNG-DESIGN §1.2).
//
// ── QUY TẮC SỐ MỘT: MỒI NHỬ PHẢI DO NGƯỜI VIẾT ────────────────────────────────
// Mỗi câu khai báo `sai: [3 phương án]`. Không có thì `taoBoDe` NÉM LỖI ngay lúc nạp
// mô-đun — hỏng là biết liền, không phải chờ bé gặp câu hỏi vô nghĩa mới phát hiện.
//
// Vì sao khắt khe vậy: bản trước để máy tự bịa mồi nhử bằng cách bốc đáp án của câu khác
// trong cùng bộ. Với kho kiến thức tổng hợp thì ra thế này:
//     "Hợp chất nào của nitơ dùng làm chất gây lạnh?"  →  Đức · tâm · NH3 · xiếc
// Chỉ NH3 là công thức hoá học nên bé khoanh trúng mà chẳng cần biết gì. Bài trắc nghiệm
// mà mồi nhử vô nghĩa thì không đo được gì cả, và tệ hơn: dạy bé thói loại trừ bằng hình
// thức thay vì bằng kiến thức.
//
// ── NGOẠI LỆ CÓ KIỂM SOÁT: `tuSinhMoiNhu` ────────────────────────────────────
// Bộ đề mà MỌI câu trong cùng một nhóm đều cùng một loại đáp án (đố con vật → toàn tên
// con vật; đố chữ → toàn từ một tiếng) thì bốc chéo trong nhóm cho mồi nhử tốt thật.
// Bộ nào muốn dùng phải BẬT CỜ RÕ RÀNG, để việc này là lựa chọn có cân nhắc chứ không
// phải hành vi mặc định lẳng lặng xảy ra.
//
// Khi sinh tự động, lọc theo hai tiêu chí:
//   1. CÙNG NHÓM — đố con vật thì mồi nhử phải là con vật.
//   2. CÙNG KIỂU — số đi với số, chữ đi với chữ.

const laSo = (s) => /^[\d\s.,/-]+$/.test(s);
const chuan = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');

// Chấm điểm "hợp làm mồi nhử" — càng thấp càng hợp.
function diemHop(dung, ung) {
  if (laSo(dung) !== laSo(ung)) return 1000; // khác kiểu → loại gần như tuyệt đối
  return Math.abs(dung.length - ung.length);
}

/**
 * Tạo một bộ đề tĩnh dùng chung giao diện với bộ sinh Toán.
 * @param {object} c  {id, ten, mo, cau: [{id, q, ans, nhom, why}], nhom: [{id, ten}]}
 */
export function taoBoDe(c) {
  const theoId = Object.fromEntries(c.cau.map((x) => [x.id, x]));

  // KIỂM NGAY LÚC NẠP MÔ-ĐUN, không đợi tới lúc chơi. Thiếu mồi nhử là lỗi dữ liệu, và
  // lỗi dữ liệu phải làm vỡ ngay chứ không được lặng lẽ sinh ra câu hỏi vô nghĩa.
  if (!c.tuSinhMoiNhu) {
    const thieu = c.cau.filter((x) => !Array.isArray(x.sai) || x.sai.length < 3);
    if (thieu.length)
      throw new Error(
        `Bộ đề "${c.id}": ${thieu.length} câu thiếu mồi nhử viết tay (cần \`sai\` đủ 3 phương án). ` +
          `Ví dụ: ${thieu
            .slice(0, 3)
            .map((x) => x.id)
            .join(', ')}. ` +
          `Muốn máy tự sinh mồi nhử thì phải bật cờ \`tuSinhMoiNhu: true\` — đọc kỹ phần đầu tệp trước.`,
      );
  }

  // Danh sách id câu theo nhóm. 'tatca' (hoặc nhóm không tồn tại) → toàn bộ.
  function ids(nhomId) {
    const co = c.cau.filter((x) => x.nhom === nhomId);
    return (co.length ? co : c.cau).map((x) => x.id);
  }

  // Ba mồi nhử cho một câu. Ưu tiên tuyệt đối phương án viết tay.
  function moiNhu(q, rng) {
    if (Array.isArray(q.sai) && q.sai.length >= 3) {
      const ds = q.sai.slice();
      for (let i = ds.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [ds[i], ds[j]] = [ds[j], ds[i]];
      }
      return ds.slice(0, 3);
    }
    return tuSinh(q, rng);
  }

  function tuSinh(q, rng) {
    // Gom ứng viên mồi nhử: cùng nhóm trước, rồi cả bộ. Bỏ câu trùng đáp án.
    const dung = chuan(q.ans);
    const gap = new Set([dung]);
    const gom = (ds) => {
      const ra = [];
      for (const x of ds) {
        const k = chuan(x.ans);
        if (gap.has(k)) continue;
        gap.add(k);
        ra.push(x.ans);
      }
      return ra;
    };
    const cungNhom = gom(c.cau.filter((x) => x.nhom === q.nhom));
    const khac = gom(c.cau);

    // HAI ĐIỀU KIỆN CỨNG cho mồi nhử, không phải điểm cộng:
    //   1. CÙNG NHÓM — đố con vật thì mồi nhử phải là con vật. Lấy "Bút chì" làm mồi cho
    //      câu đố con khỉ thì bé loại trừ được ngay mà chẳng cần nghĩ.
    //   2. CÙNG KIỂU — số đi với số, chữ đi với chữ.
    // Chỉ khi không đủ 3 mồi nhử thoả thì mới nới ra. Xếp hạng rồi cắt ngọn là KHÔNG đủ:
    // bộ đề ít câu vẫn để lọt loại khác vào.
    const dungKieu = (ds) => ds.filter((u) => laSo(u) === laSo(q.ans));
    const nguon =
      dungKieu(cungNhom).length >= 3
        ? dungKieu(cungNhom)
        : cungNhom.length >= 3
          ? cungNhom
          : dungKieu([...cungNhom, ...khac]).length >= 3
            ? dungKieu([...cungNhom, ...khac])
            : [...cungNhom, ...khac];
    nguon.sort((a, b) => diemHop(q.ans, a) - diemHop(q.ans, b));
    // Lấy từ 10 ứng viên hợp nhất rồi bốc ngẫu nhiên 3 — nếu luôn lấy 3 câu hợp nhất thì
    // cùng một câu hỏi sẽ luôn có y hệt bộ lựa chọn, bé thuộc vị trí thay vì thuộc đáp án.
    const hop = nguon.slice(0, Math.max(3, Math.min(10, nguon.length)));
    for (let i = hop.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [hop[i], hop[j]] = [hop[j], hop[i]];
    }
    return hop.slice(0, 3);
  }

  function sinh(qid, rng) {
    const q = theoId[qid];
    if (!q) throw new Error(`Bộ đề ${c.id} không có câu: ${qid}`);

    const a = [q.ans, ...moiNhu(q, rng)];
    let d = 1;
    while (a.length < 4) a.push(q.ans + ' '.repeat(d++)); // bộ đề quá nhỏ — hiếm, có test canh
    for (let i = a.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return {
      id: q.id,
      boDe: c.id,
      subject: c.id,
      nhom: q.nhom,
      q: q.q,
      a,
      k: a.indexOf(q.ans),
      // Tài liệu gốc chỉ có đáp án, không có lời giải. Nói thẳng đáp án còn hơn để trống —
      // trường `why` là bắt buộc, không có thì màn hình "sai 3 lần" trống trơn.
      why: q.why || `Đáp án đúng là “${q.ans}”.`,
    };
  }

  return { id: c.id, ten: c.ten, mo: c.mo, nhom: c.nhom, ids, sinh, soCau: c.cau.length };
}
