// tools/import-olympia.mjs — CHUYỂN tài liệu Olympia (.docx đã bóc thành .txt) sang dữ liệu game.
//
// Chạy:  node tools/import-olympia.mjs <tệp.txt> > src/data/questions/olympia.js
//
// Vì sao có bước này thay vì gõ tay: tài liệu gốc dạng "N. câu hỏi / Đáp án: X", vài trăm câu.
// Gõ tay vừa lâu vừa sai. Có bộ chuyển đổi thì bổ sung tài liệu mới chỉ là chạy lại lệnh.
//
// LỌC BỎ (ghi rõ ra stderr để người nhập biết mình mất gì):
//   - câu không tách được đáp án
//   - đáp án quá dài (> 34 ký tự): làm lựa chọn trắc nghiệm thì tràn nút, và nhìn là đoán ra
//   - câu hỏi quá dài (> 150 ký tự): đề dài lê thê không hợp màn hình game
//   - câu trùng đáp án lẫn câu hỏi

import { readFileSync } from 'node:fs';

const tep = process.argv[2];
if (!tep) {
  console.error('Thiếu tên tệp. Dùng: node tools/import-olympia.mjs <tệp.txt>');
  process.exit(1);
}

const tho = readFileSync(tep, 'utf8').replace(/\r/g, '');
// Tách theo số thứ tự đầu dòng "12." — đây là mốc duy nhất tài liệu gốc dùng nhất quán.
const khoi = tho.split(/\n(?=\d{1,3}\.\s)/).filter((k) => /^\d{1,3}\./.test(k.trim()));

const bo = (s) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/^[\s:–-]+|[\s:–-]+$/g, '')
    .trim();

const cau = [];
const boQua = [];
for (const k of khoi) {
  const dong = k
    .split('\n')
    .map((d) => d.trim())
    .filter(Boolean);
  const dau = dong.join('\n');
  const so = dau.match(/^(\d{1,3})\./)[1];

  let hoi, dap;
  const m = dau.match(/^([\s\S]*?)\n?\s*Đáp\s*án\s*:?\s*([\s\S]*)$/i);
  if (m) {
    hoi = m[1];
    dap = m[2];
  } else if (dong.length >= 2) {
    // Không có chữ "Đáp án" — tài liệu gốc có vài chỗ để đáp án ở dòng cuối
    hoi = dong.slice(0, -1).join(' ');
    dap = dong[dong.length - 1];
  } else {
    boQua.push([so, 'không tách được đáp án']);
    continue;
  }

  hoi = bo(hoi.replace(/^\d{1,3}\.\s*/, ''));
  dap = bo(dap.split('\n')[0]);

  if (!hoi || !dap) boQua.push([so, 'thiếu câu hỏi hoặc đáp án']);
  else if (dap.length > 34) boQua.push([so, `đáp án dài ${dap.length} ký tự`]);
  else if (hoi.length > 150) boQua.push([so, `câu hỏi dài ${hoi.length} ký tự`]);
  else if (hoi.length < 12) boQua.push([so, 'câu hỏi quá ngắn, có thể là rác']);
  else cau.push({ id: 'ol' + so, q: hoi, ans: dap });
}

// Bỏ trùng theo câu hỏi
const thay = new Set();
const sach = cau.filter((c) => {
  const k = c.q.toLowerCase();
  if (thay.has(k)) return false;
  thay.add(k);
  return true;
});

console.error(`Lấy được ${sach.length}/${khoi.length} câu. Bỏ qua ${boQua.length}:`);
for (const [so, ly] of boQua) console.error(`  #${so}: ${ly}`);

const esc = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
process.stdout.write(
  `// data/questions/olympia.js — SINH TỰ ĐỘNG bởi tools/import-olympia.mjs. ĐỪNG SỬA TAY.
// Nguồn: bộ câu hỏi Đường lên đỉnh Olympia do người dùng cung cấp.
// Muốn thêm câu: bổ sung vào tài liệu gốc rồi chạy lại bộ chuyển đổi.
//
// MỨC ĐỘ: THCS trở lên. KHÔNG hợp tiểu học — có hoá hữu cơ, giải tích, địa lý chuyên sâu.
export const OLYMPIA = [
${sach.map((c) => `  { id: ${esc(c.id)}, q: ${esc(c.q)}, ans: ${esc(c.ans)} },`).join('\n')}
];
`,
);
