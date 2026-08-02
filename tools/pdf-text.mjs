// tools/pdf-text.mjs — bóc CHỮ ra khỏi tệp PDF, chỉ dùng thư viện chuẩn của Node (zlib).
//
// Chạy:  node tools/pdf-text.mjs <tệp.pdf> > ra.txt
//
// Vì sao tự viết thay vì cài pdf-parse: CLAUDE.md cấm tự ý thêm thư viện ngoài, mà việc
// cần làm chỉ là lấy chữ từ một tệp PDF chữ thuần. zlib có sẵn trong Node là đủ.
//
// CÁCH LÀM (hai bước, bước 2 mới là chỗ quan trọng với tiếng Việt):
//   1. PDF chứa các "stream" nén Flate. Giải nén ra sẽ thấy lệnh vẽ chữ:
//        (chuỗi) Tj        vẽ một chuỗi
//        [(a) -20 (b)] TJ  vẽ nhiều mảnh, số ở giữa là khoảng cách
//        T*  Td  TD  '  "  xuống dòng
//   2. NHƯNG chuỗi đó KHÔNG phải chữ. PDF tiếng Việt hầu hết dùng phông nhúng mã hoá
//      `Identity-H`: mỗi ký tự là MỘT SỐ 2 BYTE trỏ vào bảng hình chữ riêng của phông đó.
//      Đọc thẳng ra thì mọi chữ có dấu đều biến mất — "Phố cổ Hội An" thành "Ph c Hi An".
//      Phải đọc bảng `/ToUnicode` của phông (dạng CMap, có beginbfchar/beginbfrange) để
//      dịch ngược số 2 byte → ký tự Unicode. Đó là bước bắt buộc, không có đường tắt.
//
// GIỚI HẠN ĐÃ BIẾT (đọc trước khi trách công cụ):
//   - Chỉ đọc được PDF chữ thuần. PDF ảnh scan thì không có chữ để lấy.
//   - Gộp CHUNG bảng ToUnicode của mọi phông thay vì theo dõi lệnh Tf từng phông. Đơn giản
//     hơn nhiều và đúng khi các bảng không mâu thuẫn — có kiểm tra và cảnh báo nếu mâu thuẫn.
//   - Không giữ bố cục bảng biểu, chỉ giữ thứ tự dòng.

import { readFileSync } from 'node:fs';
import { inflateSync, unzipSync } from 'node:zlib';

const tep = process.argv[2];
if (!tep) {
  console.error('Thiếu tên tệp. Dùng: node tools/pdf-text.mjs <tệp.pdf>');
  process.exit(1);
}

const buf = readFileSync(tep);

// Giải mã chuỗi PDF: \n \r \t \( \) \\ và mã bát phân \053
function giaiChuoi(s) {
  let ra = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '\\') {
      ra += s[i];
      continue;
    }
    const c = s[++i];
    if (c === 'n') ra += '\n';
    else if (c === 'r') ra += '\r';
    else if (c === 't') ra += '\t';
    else if (c === 'b' || c === 'f') ra += ' ';
    else if (c >= '0' && c <= '7') {
      let oct = c;
      while (oct.length < 3 && s[i + 1] >= '0' && s[i + 1] <= '7') oct += s[++i];
      ra += String.fromCharCode(parseInt(oct, 8));
    } else ra += c;
  }
  return ra;
}

// Đọc mọi bảng /ToUnicode trong tệp và gộp thành MỘT bảng mã 2 byte → ký tự.
function bangMa(streams) {
  const M = new Map();
  let mauThuan = 0;
  const dat = (k, v) => {
    if (M.has(k) && M.get(k) !== v) mauThuan++;
    else M.set(k, v);
  };
  const chuoiTu = (hex) =>
    String.fromCharCode(...(hex.match(/.{4}/g) || [hex]).map((h) => parseInt(h, 16)));
  for (const t of streams) {
    if (!/beginbfchar|beginbfrange/.test(t)) continue;
    for (const blk of t.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for (const [, a, c] of blk.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g))
        dat(parseInt(a, 16), chuoiTu(c));
    for (const blk of t.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for (const [, a, z, c] of blk.matchAll(
        /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
      )) {
        const s0 = parseInt(a, 16),
          e0 = parseInt(z, 16),
          u0 = parseInt(c, 16);
        for (let i = s0; i <= e0 && i - s0 < 65535; i++) dat(i, String.fromCharCode(u0 + (i - s0)));
      }
  }
  return { M, mauThuan };
}

// Chuỗi PDF (đã giải mã escape) → chữ thật.
//
// MỘT TỆP CÓ THỂ TRỘN HAI LOẠI PHÔNG: phông nhúng (mã 2 byte, tra bảng ToUnicode) và
// phông chuẩn như Times (mã 1 byte, đọc thẳng). Đọc tất cả theo 2 byte thì phần 1 byte
// vỡ vụn, và ngược lại. Muốn biết chắc phải bám lệnh `Tf` rồi tra tài nguyên của trang —
// dài và dễ sai. Ở đây GIẢI CẢ HAI CÁCH RỒI CHỌN CÁCH KHỚP BẢNG NHIỀU HƠN: phông 2 byte
// thì gần như mã nào cũng có trong bảng, phông 1 byte đọc nhầm thì tra trượt gần hết.
function dichChuoi(tho, M) {
  if (!tho.length) return '';
  let hai = '',
    khop = 0,
    tong = 0;
  for (let i = 0; i + 1 < tho.length; i += 2) {
    tong++;
    const c = M.get((tho.charCodeAt(i) << 8) | tho.charCodeAt(i + 1));
    if (c !== undefined) {
      hai += c;
      khop++;
    }
  }
  if (tong && khop / tong >= 0.6) return hai;
  // Cách 1 byte: mã ASCII đọc thẳng, ngoài ra thử tra bảng theo mã đơn.
  let mot = '';
  for (let i = 0; i < tho.length; i++) {
    const b = tho.charCodeAt(i);
    mot += b >= 32 && b < 127 ? tho[i] : (M.get(b) ?? '');
  }
  return mot;
}

// Lấy chữ từ nội dung một stream đã giải nén.
function chuTrongStream(noi, M) {
  let ra = '';
  // Bắt cả TJ (mảng) lẫn Tj (chuỗi đơn) lẫn chuỗi HEX <...> lẫn lệnh xuống dòng.
  const re = /\[((?:[^\][\\]|\\.)*)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*Tj|(T\*|Td|TD|'|")/g;
  const hex = (h) =>
    String.fromCharCode(...(h.replace(/\s/g, '').match(/.{2}/g) || []).map((x) => parseInt(x, 16)));
  let m;
  while ((m = re.exec(noi))) {
    if (m[1] !== undefined) {
      const re2 = /\(((?:[^()\\]|\\.)*)\)|<([0-9A-Fa-f\s]+)>|(-?\d+(?:\.\d+)?)/g;
      let m2;
      while ((m2 = re2.exec(m[1]))) {
        if (m2[1] !== undefined) ra += dichChuoi(giaiChuoi(m2[1]), M);
        else if (m2[2] !== undefined) ra += dichChuoi(hex(m2[2]), M);
        // Giãn cách đủ rộng giữa hai mảnh → đó là dấu cách bị nuốt mất.
        else if (Number(m2[3]) < -100) ra += ' ';
      }
    } else if (m[2] !== undefined) ra += dichChuoi(giaiChuoi(m[2]), M);
    else ra += '\n';
  }
  return ra;
}

// Duyệt mọi stream trong tệp, thử giải nén, gom chữ lại.
const bytes = buf;
const daGiaiNen = [];
let soStream = 0,
  soHong = 0;
const KHOA_STREAM = Buffer.from('stream');
const KHOA_HET = Buffer.from('endstream');

let vt = 0;
for (;;) {
  const b = bytes.indexOf(KHOA_STREAM, vt);
  if (b < 0) break;
  const e = bytes.indexOf(KHOA_HET, b);
  if (e < 0) break;
  vt = e + KHOA_HET.length;
  // bỏ ký tự xuống dòng ngay sau chữ "stream"
  let d = b + KHOA_STREAM.length;
  if (bytes[d] === 0x0d) d++;
  if (bytes[d] === 0x0a) d++;
  const than = bytes.subarray(d, e);
  soStream++;
  let noi = null;
  for (const gi of [inflateSync, unzipSync]) {
    try {
      noi = gi(than).toString('latin1');
      break;
    } catch {
      /* thử cách kế */
    }
  }
  if (noi === null) {
    const tho = than.toString('latin1');
    if (/\bTJ\b|\bTj\b|beginbfchar/.test(tho)) noi = tho;
    else {
      soHong++;
      continue;
    }
  }
  daGiaiNen.push(noi);
}

// Bảng mã phải dựng TRƯỚC khi dịch nội dung — không có nó thì mọi chữ có dấu đều mất.
const { M, mauThuan } = bangMa(daGiaiNen);
if (!M.size)
  console.error('⚠️  Không thấy bảng /ToUnicode nào. PDF có thể là ảnh scan → không lấy được chữ.');
if (mauThuan)
  console.error(`⚠️  ${mauThuan} mã bị hai phông gán khác nhau — chữ có thể sai lác đác.`);

let vanBan = '';
for (const noi of daGiaiNen) {
  if (!/\bTJ\b|\bTj\b/.test(noi)) continue; // bảng mã / phông / ảnh, không phải nội dung trang
  vanBan += chuTrongStream(noi, M) + '\n';
}
const sach = vanBan
  .split('\n')
  .map((d) => d.replace(/[ \t]+/g, ' ').trim())
  .filter(Boolean)
  .join('\n');

console.error(`Đọc ${soStream} stream (${soHong} không giải nén được) → ${sach.length} ký tự.`);

// ── BA PHÉP KIỂM CHẤT LƯỢNG. Chữ hỏng mà im lặng còn tệ hơn không đọc được: dữ liệu sai
// lọt vào một game dạy trẻ con thì bé học phải cái sai.
const canh = [];

// 1. Ký tự lạ: dấu hiệu ảnh scan hoặc bảng mã hoàn toàn không đọc được.
const rac = (sach.match(/[^\p{L}\p{N}\s.,;:?!()"'’“”/%°+\-–—…]/gu) || []).length;
if (sach.length && rac / sach.length > 0.08)
  canh.push(`${((rac / sach.length) * 100).toFixed(1)}% ký tự lạ — có thể là PDF ảnh scan`);

// 2. Chữ của PHÔNG TIẾNG VIỆT ĐỜI CŨ (VNI/TCVN3, phông VnTime): ƣ ơ ð đứng lẻ, hoặc
//    Ð thay cho Đ. Gặp là biết chữ có dấu đã bị dịch sai, dù nhìn qua vẫn "đọc tạm được".
// Viết bằng mã chứ không viết chữ: Ð (U+00D0, chữ Iceland) NHÌN GIỐNG HỆT Đ (U+0110,
// chữ Việt đúng) nhưng là hai ký tự khác nhau. Nhìn bằng mắt không phân biệt nổi.
//   U+01A3 ƣ · U+00F0 ð · U+00D0 Ð  — đều là dấu hiệu chữ đã bị dịch sai bảng mã.
if (/[ƣðÐ]/.test(sach))
  canh.push('có ký tự của phông tiếng Việt đời cũ (VNI/TCVN3) → chữ có dấu bị dịch sai');

// 3. Thiếu dấu: tiếng Việt bình thường có rất nhiều nguyên âm có dấu. Tỉ lệ thấp bất
//    thường nghĩa là dấu đã bị nuốt mất — đây đúng là lỗi bản đầu tiên mắc phải.
const coDau = (
  sach.match(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/giu) || []
).length;
const chuCai = (sach.match(/\p{L}/gu) || []).length;
if (chuCai > 500 && coDau / chuCai < 0.12)
  canh.push(
    `chỉ ${((coDau / chuCai) * 100).toFixed(1)}% chữ cái có dấu (tiếng Việt thường ~20%) — dấu bị nuốt`,
  );

if (canh.length) {
  console.error('⚠️  KẾT QUẢ KHÔNG ĐÁNG TIN:');
  for (const c of canh) console.error('   - ' + c);
  console.error('   → Cách chắc ăn: mở PDF bằng Word rồi Lưu thành .docx, sau đó nhập từ .docx.');
}

process.stdout.write(sach);
